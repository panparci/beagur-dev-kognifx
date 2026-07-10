package handler

import (
	"errors"
	"net/http"

	"bea-guru-api/internal/domain/user"
	"bea-guru-api/internal/http/middleware"
	"bea-guru-api/internal/http/response"
	"bea-guru-api/internal/notify"
	"bea-guru-api/internal/store"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	Store  *store.Store
	Notify *notify.Service
}

func (h UserHandler) Me(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "Current user is required")
		return
	}

	response.OK(c, current)
}

func (h UserHandler) PendingApprovals(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "Current user is required")
		return
	}
	if current.Role != user.RoleAdmin {
		response.Error(c, http.StatusForbidden, "FORBIDDEN", "admin only")
		return
	}

	items, err := h.Store.ListPendingAccountApprovals(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, items)
}

func (h UserHandler) DecidePendingApproval(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "Current user is required")
		return
	}
	if current.Role != user.RoleAdmin {
		response.Error(c, http.StatusForbidden, "FORBIDDEN", "admin only")
		return
	}

	id := c.Param("id")
	roleCode, err := h.Store.GetUserRoleCode(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			response.Error(c, http.StatusNotFound, "NOT_FOUND", "user role not found")
			return
		}
		response.Error(c, http.StatusInternalServerError, "DB_ERROR", err.Error())
		return
	}
	if roleCode != string(user.RoleValidator) {
		response.Error(c, http.StatusBadRequest, "INVALID_ROLE", "approval akun langsung hanya untuk kepala sekolah")
		return
	}

	approve := c.Query("approve") == "true"
	var changed bool
	if approve {
		changed, err = h.Store.ActivatePendingUser(c.Request.Context(), id)
	} else {
		changed, err = h.Store.RejectPendingUser(c.Request.Context(), id)
	}
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			response.Error(c, http.StatusNotFound, "NOT_FOUND", "user not found")
			return
		}
		response.Error(c, http.StatusInternalServerError, "DB_ERROR", err.Error())
		return
	}
	if !changed {
		response.Error(c, http.StatusConflict, "INVALID_STATE", "akun tidak sedang menunggu verifikasi")
		return
	}

	updated, err := h.Store.GetCurrentUser(c.Request.Context(), id)
	if !approve && err != nil {
		response.OK(c, gin.H{"id": id, "approved": false})
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "DB_ERROR", err.Error())
		return
	}
	if h.Notify != nil && approve {
		roleLabel := "Guru honorer"
		if updated.Role == user.RoleValidator {
			roleLabel = "Kepala sekolah / validator"
		}
		h.Notify.OnAccountActivated(updated.Email, updated.Name, roleLabel)
	}
	response.OK(c, updated)
}
