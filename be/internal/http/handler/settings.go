package handler

import (
	"errors"
	"net/http"
	"strings"

	"bea-guru-api/internal/http/response"
	"bea-guru-api/internal/store"

	"github.com/gin-gonic/gin"
)

type SettingsHandler struct {
	Store *store.Store
}

func (h SettingsHandler) GetTerms(c *gin.Context) {
	value, err := h.Store.GetSetting(c.Request.Context(), "terms")
	if errors.Is(err, store.ErrNotFound) {
		response.Error(c, http.StatusNotFound, "NOT_FOUND", "terms not configured")
		return
	}
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, gin.H{"value": value})
}

func (h SettingsHandler) PutTerms(c *gin.Context) {
	var body struct {
		Value string `json:"value"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	if body.Value == "" {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", "value is required")
		return
	}
	saved, err := h.Store.SetSetting(c.Request.Context(), "terms", body.Value)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, gin.H{"value": saved})
}

func (h SettingsHandler) GetLanding(c *gin.Context) {
	value, err := h.Store.GetSetting(c.Request.Context(), "landing")
	if errors.Is(err, store.ErrNotFound) {
		response.Error(c, http.StatusNotFound, "NOT_FOUND", "landing not configured")
		return
	}
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, gin.H{"value": value})
}

func (h SettingsHandler) PutLanding(c *gin.Context) {
	var body struct {
		Value string `json:"value"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	if strings.TrimSpace(body.Value) == "" {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", "value is required")
		return
	}
	saved, err := h.Store.SetSetting(c.Request.Context(), "landing", body.Value)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, gin.H{"value": saved})
}
