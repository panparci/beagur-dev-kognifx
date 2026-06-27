package handler

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"bea-guru-api/internal/domain/user"
	"bea-guru-api/internal/http/cookie"
	"bea-guru-api/internal/http/response"
	"bea-guru-api/internal/store"

	"github.com/gin-gonic/gin"
)

const sessionMaxAge = 7 * 24 * 60 * 60

type AuthHandler struct {
	Store *store.Store
}

func (h AuthHandler) Login(c *gin.Context) {
	var body struct {
		Email string `json:"email"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	email := strings.TrimSpace(body.Email)
	if email == "" {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", "email is required")
		return
	}

	current, err := h.Store.GetUserByEmail(c.Request.Context(), email)
	if errors.Is(err, store.ErrNotFound) {
		response.Error(c, http.StatusNotFound, "NOT_FOUND", "Email belum terdaftar. Hubungi admin yayasan atau sekolah.")
		return
	}
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}

	sid, err := h.Store.CreateSession(c.Request.Context(), current.ID, 7*24*time.Hour)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "DB_ERROR", err.Error())
		return
	}

	cookie.SetSession(c, sid, sessionMaxAge)
	response.OK(c, toUserResponse(current))
}

func (h AuthHandler) DevLogin(c *gin.Context) {
	var body struct {
		Role string `json:"role"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	if body.Role == "" {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", "role is required")
		return
	}

	current, err := h.Store.GetDevUserByRole(c.Request.Context(), body.Role)
	if errors.Is(err, store.ErrNotFound) {
		response.Error(c, http.StatusNotFound, "NOT_FOUND", "user not found for role")
		return
	}
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}

	sid, err := h.Store.CreateSession(c.Request.Context(), current.ID, 7*24*time.Hour)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "DB_ERROR", err.Error())
		return
	}

	cookie.SetSession(c, sid, sessionMaxAge)
	response.OK(c, toUserResponse(current))
}

func (h AuthHandler) Logout(c *gin.Context) {
	if sid, err := c.Cookie(store.SessionCookieName()); err == nil && sid != "" {
		_ = h.Store.DeleteSession(c.Request.Context(), sid)
	}
	cookie.ClearSession(c)
	response.OK(c, gin.H{"ok": true})
}

func toUserResponse(current user.CurrentUser) gin.H {
	return gin.H{
		"id":            current.ID,
		"email":         current.Email,
		"name":          current.Name,
		"role":          current.Role,
		"roles":         current.Roles,
		"permissions":   current.Permissions,
		"accountStatus": current.AccountStatus,
	}
}
