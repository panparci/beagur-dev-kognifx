package handler

import (
	"net/http"

	"bea-guru-api/internal/http/middleware"
	"bea-guru-api/internal/http/response"
	"bea-guru-api/internal/store"

	"github.com/gin-gonic/gin"
)

type DonorHandler struct {
	Store *store.Store
}

func (h DonorHandler) List(c *gin.Context) {
	includeInactive := c.Query("includeInactive") == "true"
	items, err := h.Store.ListDonors(c.Request.Context(), includeInactive)
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, items)
}

func (h DonorHandler) Save(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	var body struct {
		ID    string `json:"id"`
		Email string `json:"email"`
		Name  string `json:"name"`
		Phone string `json:"phone"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	saved, err := h.Store.SaveDonor(c.Request.Context(), body.ID, body.Email, body.Name, body.Phone)
	if writeStoreError(c, err) {
		return
	}
	action := "donor.created"
	if body.ID != "" {
		action = "donor.updated"
	}
	logAdminAction(c.Request.Context(), h.Store, current.ID, action, "donor", saved.ID, map[string]any{
		"email": saved.Email,
		"name":  saved.Name,
	})
	response.OK(c, saved)
}

func (h DonorHandler) Deactivate(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	donorID := c.Param("id")
	if err := h.Store.DeactivateDonor(c.Request.Context(), donorID); writeStoreError(c, err) {
		return
	}
	logAdminAction(c.Request.Context(), h.Store, current.ID, "donor.deactivated", "donor", donorID, nil)
	response.OK(c, gin.H{"id": donorID, "isActive": false})
}
