package handler

import (
	"net/http"

	"bea-guru-api/internal/http/middleware"
	"bea-guru-api/internal/http/response"
	"bea-guru-api/internal/store"

	"github.com/gin-gonic/gin"
)

type ReconciliationHandler struct {
	Store *store.Store
}

func (h ReconciliationHandler) ListUploads(c *gin.Context) {
	data, err := h.Store.ListBankUploads(c.Request.Context())
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}

func (h ReconciliationHandler) ListLines(c *gin.Context) {
	data, err := h.Store.ListBankLines(c.Request.Context(), c.Param("id"))
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}

func (h ReconciliationHandler) CreateUpload(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	var body store.CreateBankUploadInput
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	body.UploadedByUserID = current.ID
	data, err := h.Store.CreateBankUpload(c.Request.Context(), body)
	if writeStoreError(c, err) {
		return
	}
	logAdminAction(c.Request.Context(), h.Store, current.ID, "reconciliation.upload", "bank_statement_upload", data.ID, map[string]any{
		"lines":     data.TotalLines,
		"direction": data.Direction,
	})
	response.OK(c, data)
}

func (h ReconciliationHandler) DeleteUpload(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	id := c.Param("id")
	if err := h.Store.DeleteBankUpload(c.Request.Context(), id); writeStoreError(c, err) {
		return
	}
	logAdminAction(c.Request.Context(), h.Store, current.ID, "reconciliation.delete_upload", "bank_statement_upload", id, nil)
	response.OK(c, gin.H{"deleted": true, "id": id})
}

func (h ReconciliationHandler) ConfirmLine(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	var body struct {
		DonationID *string `json:"donationId"`
		LedgerID   *string `json:"ledgerId"`
	}
	_ = c.ShouldBindJSON(&body)
	data, err := h.Store.ConfirmBankLine(c.Request.Context(), c.Param("id"), current.ID, body.DonationID, body.LedgerID)
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}

func (h ReconciliationHandler) IgnoreLine(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	data, err := h.Store.IgnoreBankLine(c.Request.Context(), c.Param("id"), current.ID)
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}

func (h ReconciliationHandler) CreateDonorFromLine(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	var body store.CreateDonorFromLineInput
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	data, err := h.Store.CreateDonorFromLine(c.Request.Context(), c.Param("id"), current.ID, body)
	if writeStoreError(c, err) {
		return
	}
	logAdminAction(c.Request.Context(), h.Store, current.ID, "reconciliation.create_donor", "bank_transaction_line", c.Param("id"), map[string]any{
		"email": body.Email,
	})
	response.OK(c, data)
}

func (h ReconciliationHandler) ConfirmSuggestedDonor(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	data, err := h.Store.ConfirmSuggestedDonorDonation(c.Request.Context(), c.Param("id"), current.ID)
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}

type NotificationsHandler struct {
	Store *store.Store
}

func (h NotificationsHandler) ListMine(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	data, err := h.Store.ListMyNotifications(c.Request.Context(), current.ID, 40)
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}

func (h NotificationsHandler) UnreadCount(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	n, err := h.Store.CountUnreadNotifications(c.Request.Context(), current.ID)
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, gin.H{"count": n})
}

func (h NotificationsHandler) MarkRead(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	if err := h.Store.MarkNotificationRead(c.Request.Context(), current.ID, c.Param("id")); writeStoreError(c, err) {
		return
	}
	response.OK(c, gin.H{"ok": true})
}

func (h NotificationsHandler) MarkAllRead(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	if err := h.Store.MarkAllNotificationsRead(c.Request.Context(), current.ID); writeStoreError(c, err) {
		return
	}
	response.OK(c, gin.H{"ok": true})
}

type TasksHandler struct {
	Store *store.Store
}

func (h TasksHandler) ListTemplates(c *gin.Context) {
	data, err := h.Store.ListTaskTemplates(c.Request.Context())
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}

func (h TasksHandler) CreateTemplate(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	var body store.CreateTaskTemplateInput
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	body.CreatedByUserID = current.ID
	// Default active on create when client omits the flag (JSON false is still false).
	tpl, assigned, err := h.Store.CreateTaskTemplate(c.Request.Context(), body)
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, gin.H{"template": tpl, "assignedCount": assigned})
}

func (h TasksHandler) SetTemplateActive(c *gin.Context) {
	var body struct {
		IsActive bool `json:"isActive"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	tpl, assigned, err := h.Store.SetTaskTemplateActive(c.Request.Context(), c.Param("id"), body.IsActive)
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, gin.H{"template": tpl, "assignedCount": assigned})
}

func (h TasksHandler) ListAssignmentsAdmin(c *gin.Context) {
	data, err := h.Store.ListTaskAssignmentsAdmin(c.Request.Context(), c.Query("templateId"))
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}

func (h TasksHandler) ListMine(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	data, err := h.Store.ListMyTaskAssignments(c.Request.Context(), current.ID)
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}

func (h TasksHandler) Submit(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	var body struct {
		Responses []store.TaskFieldResponse `json:"responses"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	data, err := h.Store.SubmitTaskAssignment(c.Request.Context(), c.Param("id"), current.ID, body.Responses)
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}

type LmsHandler struct {
	Store *store.Store
}

func (h LmsHandler) ListCourses(c *gin.Context) {
	publishedOnly := c.Query("all") != "1"
	data, err := h.Store.ListLmsCourses(c.Request.Context(), publishedOnly)
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}

func (h LmsHandler) GetCourse(c *gin.Context) {
	data, err := h.Store.GetLmsCourse(c.Request.Context(), c.Param("id"))
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}

func (h LmsHandler) CreateCourse(c *gin.Context) {
	var body store.UpsertLmsCourseInput
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	data, err := h.Store.CreateLmsCourse(c.Request.Context(), body)
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}

func (h LmsHandler) UpdateCourse(c *gin.Context) {
	var body store.UpsertLmsCourseInput
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	data, err := h.Store.UpdateLmsCourse(c.Request.Context(), c.Param("id"), body)
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}

func (h LmsHandler) MyProgress(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	data, err := h.Store.ListMyLmsProgress(c.Request.Context(), current.ID)
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}

func (h LmsHandler) SaveProgress(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	var body store.SaveLmsProgressInput
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	data, err := h.Store.SaveLmsProgress(c.Request.Context(), current.ID, c.Param("id"), body)
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}

func (h LmsHandler) ListSessions(c *gin.Context) {
	data, err := h.Store.ListLiveSessions(c.Request.Context())
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}

func (h LmsHandler) CreateSession(c *gin.Context) {
	var body store.CreateLiveSessionInput
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	data, err := h.Store.CreateLiveSession(c.Request.Context(), body)
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}

func (h LmsHandler) RegisterSession(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	data, err := h.Store.RegisterLiveSession(c.Request.Context(), c.Param("id"), current.ID)
	if writeStoreError(c, err) {
		return
	}
	response.OK(c, data)
}
