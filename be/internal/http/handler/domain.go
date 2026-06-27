package handler

import (
	"errors"
	"net/http"
	"time"

	"bea-guru-api/internal/cache"
	"bea-guru-api/internal/domain/user"
	"bea-guru-api/internal/geo"
	"bea-guru-api/internal/http/middleware"
	"bea-guru-api/internal/http/response"
	"bea-guru-api/internal/mask"
	"bea-guru-api/internal/notify"
	"bea-guru-api/internal/store"

	"github.com/gin-gonic/gin"
)

type InstitutionHandler struct {
	Store  *store.Store
	Notify *notify.Service
}

func (h InstitutionHandler) List(c *gin.Context) {
	items, err := h.Store.ListInstitutions(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, items)
}

func (h InstitutionHandler) Save(c *gin.Context) {
	var body store.Institution
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	saved, err := h.Store.SaveInstitution(c.Request.Context(), body)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "DB_ERROR", err.Error())
		return
	}
	if h.Notify != nil && saved.ValidatorUserID != nil && *saved.ValidatorUserID != "" {
		activated, actErr := h.Store.ActivatePendingUser(c.Request.Context(), *saved.ValidatorUserID)
		if actErr == nil && activated {
			contact, cErr := h.Store.GetUserContact(c.Request.Context(), *saved.ValidatorUserID)
			if cErr == nil {
				h.Notify.OnAccountActivated(contact.Email, contact.Name, "Kepala sekolah / validator")
			}
		}
	}
	response.OK(c, saved)
}

func (h InstitutionHandler) ListValidators(c *gin.Context) {
	items, err := h.Store.ListValidators(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, items)
}

type TeacherHandler struct {
	Store  *store.Store
	Notify *notify.Service
}

func (h TeacherHandler) canViewSensitive(viewer user.CurrentUser, profile store.TeacherProfile) bool {
	if viewer.Role == user.RoleAdmin {
		return true
	}
	if profile.UserID == viewer.ID {
		return true
	}
	if viewer.Role == user.RoleValidator && middleware.HasPermission(viewer, "teachers:validate") {
		return true
	}
	return false
}

func (h TeacherHandler) maskTeacherProfile(profile store.TeacherProfile, viewer user.CurrentUser) store.TeacherProfile {
	canView := h.canViewSensitive(viewer, profile)
	profile.BankAccountNumber = mask.BankAccount(profile.BankAccountNumber, canView)
	profile.PhoneNumber = mask.PhoneNumber(profile.PhoneNumber, canView)
	return profile
}

func (h TeacherHandler) maskTeachers(items []store.TeacherProfile, viewer user.CurrentUser) []store.TeacherProfile {
	for i := range items {
		items[i] = h.maskTeacherProfile(items[i], viewer)
	}
	return items
}

func (h TeacherHandler) List(c *gin.Context) {
	current, _ := middleware.CurrentUser(c)
	status := c.Query("status")
	items, err := h.Store.ListTeachers(c.Request.Context(), status)
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, h.maskTeachers(items, current))
}

func (h TeacherHandler) Me(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	item, err := h.Store.GetTeacherByUserID(c.Request.Context(), current.ID)
	if errors.Is(err, store.ErrNotFound) {
		response.Error(c, http.StatusNotFound, "NOT_FOUND", "teacher profile not found")
		return
	}
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	items := h.maskTeachers([]store.TeacherProfile{item}, current)
	response.OK(c, items[0])
}

func (h TeacherHandler) Save(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	var body store.TeacherProfile
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	body.UserID = current.ID
	isNewProfile := body.ID == ""
	lat, lng, canonicalRegion, ok := geo.ResolveCoords(body.Region, body.Latitude, body.Longitude)
	if ok {
		body.Latitude = &lat
		body.Longitude = &lng
		if canonicalRegion != "" {
			body.Region = canonicalRegion
		}
	}
	saved, err := h.Store.SaveTeacher(c.Request.Context(), body)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "DB_ERROR", err.Error())
		return
	}
	if isNewProfile && h.Notify != nil {
		h.Notify.OnTeacherProfileSubmitted(saved)
	}
	items := h.maskTeachers([]store.TeacherProfile{saved}, current)
	response.OK(c, items[0])
}

func (h TeacherHandler) PendingValidation(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	items, err := h.Store.ListPendingValidations(c.Request.Context(), current.ID)
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, h.maskTeachers(items, current))
}

func (h TeacherHandler) ValidationHistory(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	if current.Role != user.RoleValidator {
		response.Error(c, http.StatusForbidden, "FORBIDDEN", "validator only")
		return
	}
	items, err := h.Store.ListValidatorSchoolTeachers(c.Request.Context(), current.ID)
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, h.maskTeachers(items, current))
}

func (h TeacherHandler) Validate(c *gin.Context) {
	id := c.Param("id")
	approve := c.Query("approve") == "true"
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	if current.Role != user.RoleValidator {
		response.Error(c, http.StatusForbidden, "FORBIDDEN", "validator only")
		return
	}
	saved, err := h.Store.ValidatorDecision(c.Request.Context(), id, current.ID, approve)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			response.Error(c, http.StatusNotFound, "NOT_FOUND", "teacher not found")
			return
		}
		if errors.Is(err, store.ErrForbidden) {
			response.Error(c, http.StatusForbidden, "FORBIDDEN", "guru bukan di sekolah binaan Anda atau sudah diproses")
			return
		}
		response.Error(c, http.StatusInternalServerError, "DB_ERROR", err.Error())
		return
	}
	if h.Notify != nil {
		h.Notify.OnValidatorDecision(saved, approve)
	}
	items := h.maskTeachers([]store.TeacherProfile{saved}, current)
	response.OK(c, items[0])
}

func (h TeacherHandler) PendingApproval(c *gin.Context) {
	current, _ := middleware.CurrentUser(c)
	items, err := h.Store.ListPendingApprovals(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, h.maskTeachers(items, current))
}

func (h TeacherHandler) Approve(c *gin.Context) {
	id := c.Param("id")
	approve := c.Query("approve") == "true"
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	if current.Role != user.RoleAdmin {
		response.Error(c, http.StatusForbidden, "FORBIDDEN", "admin only")
		return
	}
	saved, err := h.Store.AdminApprovalDecision(c.Request.Context(), id, approve)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			response.Error(c, http.StatusNotFound, "NOT_FOUND", "teacher not found")
			return
		}
		if errors.Is(err, store.ErrInvalidState) {
			response.Error(c, http.StatusConflict, "INVALID_STATE", "guru belum disetujui validator atau sudah diproses")
			return
		}
		response.Error(c, http.StatusInternalServerError, "DB_ERROR", err.Error())
		return
	}
	if h.Notify != nil {
		h.Notify.OnAdminApprovalDecision(saved, approve)
	}
	items := h.maskTeachers([]store.TeacherProfile{saved}, current)
	response.OK(c, items[0])
}

func (h TeacherHandler) Approved(c *gin.Context) {
	current, _ := middleware.CurrentUser(c)
	items, err := h.Store.ListApprovedTeachers(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, h.maskTeachers(items, current))
}

type DonationHandler struct {
	Store  *store.Store
	Notify *notify.Service
}

func (h DonationHandler) List(c *gin.Context) {
	items, err := h.Store.ListDonations(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, items)
}

func (h DonationHandler) Mine(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	items, err := h.Store.ListDonationsByDonor(c.Request.Context(), current.ID)
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, items)
}

func (h DonationHandler) Create(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	var body store.Donation
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	body.DonorUserID = current.ID
	saved, err := h.Store.CreateDonation(c.Request.Context(), body)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "DB_ERROR", err.Error())
		return
	}
	if h.Notify != nil {
		h.Notify.OnDonationCreated(saved, store.UserContact{
			Email: current.Email,
			Name:  current.Name,
		})
	}
	response.OK(c, saved)
}

type ReportHandler struct {
	Store  *store.Store
	Notify *notify.Service
}

func (h ReportHandler) Mine(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	items, err := h.Store.ListReportsByTeacher(c.Request.Context(), current.ID)
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, items)
}

func (h ReportHandler) Create(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	var body store.MonthlyReport
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	body.TeacherUserID = current.ID
	saved, err := h.Store.CreateReport(c.Request.Context(), body)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "DB_ERROR", err.Error())
		return
	}
	if h.Notify != nil {
		h.Notify.OnReportSubmitted(saved)
	}
	response.OK(c, saved)
}

func (h ReportHandler) ListWithDetails(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}

	approvedOnly := c.Query("approved") == "true"
	if approvedOnly {
		if !middleware.HasPermission(current, "reports:read") {
			response.Error(c, http.StatusForbidden, "FORBIDDEN", "Missing required permission")
			return
		}
	} else if !middleware.HasPermission(current, "reports:approve") {
		response.Error(c, http.StatusForbidden, "FORBIDDEN", "Missing required permission")
		return
	}

	items, err := h.Store.ListReportsWithDetails(c.Request.Context(), approvedOnly)
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, items)
}

func (h ReportHandler) UpdateStatus(c *gin.Context) {
	var body struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	saved, err := h.Store.UpdateReportStatus(c.Request.Context(), c.Param("id"), body.Status)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			response.Error(c, http.StatusNotFound, "NOT_FOUND", "report not found")
			return
		}
		response.Error(c, http.StatusInternalServerError, "DB_ERROR", err.Error())
		return
	}
	if h.Notify != nil {
		h.Notify.OnReportStatusUpdated(saved)
	}
	response.OK(c, saved)
}

type CampaignHandler struct {
	Store         *store.Store
	progressCache *cache.TTL[store.CampaignProgress]
}

func NewCampaignHandler(st *store.Store) CampaignHandler {
	return CampaignHandler{
		Store:         st,
		progressCache: cache.NewTTL[store.CampaignProgress](30 * time.Second),
	}
}

func (h CampaignHandler) Progress(c *gin.Context) {
	p, err := h.progressCache.Get(func() (store.CampaignProgress, error) {
		return h.Store.CampaignProgress(c.Request.Context())
	})
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, p)
}
