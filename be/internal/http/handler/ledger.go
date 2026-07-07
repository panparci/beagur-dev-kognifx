package handler

import (
	"net/http"

	"bea-guru-api/internal/http/middleware"
	"bea-guru-api/internal/http/response"
	"bea-guru-api/internal/notify"
	"bea-guru-api/internal/store"

	"github.com/gin-gonic/gin"
)

type LedgerHandler struct {
	Store  *store.Store
	Notify *notify.Service
}

func (h LedgerHandler) List(c *gin.Context) {
	items, err := h.Store.ListLedger(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, items)
}

func (h LedgerHandler) Disburse(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	var body struct {
		TeacherProfileID string `json:"teacherProfileId"`
		Amount           int64  `json:"amount"`
		Description      string `json:"description"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	if body.TeacherProfileID == "" || body.Amount <= 0 {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", "teacherProfileId and positive amount are required")
		return
	}

	entry, err := h.Store.CreateDisbursement(c.Request.Context(), store.DisbursementInput{
		TeacherProfileID: body.TeacherProfileID,
		Amount:           body.Amount,
		Description:      body.Description,
	})
	if writeStoreError(c, err) {
		return
	}

	logAdminAction(c.Request.Context(), h.Store, current.ID, "ledger.disbursement", "ledger", entry.ID, map[string]any{
		"amount":           body.Amount,
		"teacherProfileId": body.TeacherProfileID,
		"description":      body.Description,
	})

	if h.Notify != nil {
		if profile, pErr := h.Store.GetTeacherByID(c.Request.Context(), body.TeacherProfileID); pErr == nil {
			h.Notify.OnDisbursementPaid(profile, body.Amount, body.Description)
		}
	}

	response.OK(c, entry)
}
