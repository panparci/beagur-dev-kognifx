package handler

import (
	"net/http"
	"strconv"

	"bea-guru-api/internal/http/middleware"
	"bea-guru-api/internal/http/response"
	"bea-guru-api/internal/store"

	"github.com/gin-gonic/gin"
)

type AnalyticsHandler struct {
	Store *store.Store
}

func (h AnalyticsHandler) Monthly(c *gin.Context) {
	months := 12
	if raw := c.Query("months"); raw != "" {
		if n, err := strconv.Atoi(raw); err == nil && n > 0 {
			months = n
		}
	}
	data, err := h.Store.MonthlyProgramAnalytics(c.Request.Context(), months)
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}

func (h AnalyticsHandler) ImportSnapshots(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	var body struct {
		Rows []store.AnalyticsSnapshotInput `json:"rows"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	n, err := h.Store.UpsertAnalyticsSnapshots(c.Request.Context(), body.Rows)
	if writeStoreError(c, err) {
		return
	}
	logAdminAction(c.Request.Context(), h.Store, current.ID, "analytics.import", "analytics", "", map[string]any{
		"rows": n,
	})
	response.OK(c, gin.H{"imported": n})
}
