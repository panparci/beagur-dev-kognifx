package handler

import (
	"net/http"
	"strconv"

	"bea-guru-api/internal/ai"
	"bea-guru-api/internal/http/middleware"
	"bea-guru-api/internal/http/response"
	"bea-guru-api/internal/store"

	"github.com/gin-gonic/gin"
)

type AiHandler struct {
	Store *store.Store
	AI    *ai.Service
}

func (h AiHandler) SearchRag(c *gin.Context) {
	query := c.Query("q")
	topK, _ := strconv.Atoi(c.DefaultQuery("topK", "3"))
	if topK <= 0 {
		topK = 3
	}
	items, err := h.Store.SearchRagDocuments(c.Request.Context(), query, topK)
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, items)
}

func (h AiHandler) ListRag(c *gin.Context) {
	items, err := h.Store.ListRagDocuments(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, items)
}

func (h AiHandler) ListMemory(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	items, err := h.Store.ListAiMemory(c.Request.Context(), current.ID)
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, items)
}

func (h AiHandler) AppendMemory(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	var body struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	saved, err := h.Store.AppendAiMemory(c.Request.Context(), current.ID, body.Role, body.Content)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, saved)
}

func (h AiHandler) ClearMemory(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	if err := h.Store.ClearAiMemory(c.Request.Context(), current.ID); err != nil {
		response.Error(c, http.StatusInternalServerError, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, gin.H{"ok": true})
}

func (h AiHandler) ListLogs(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	items, err := h.Store.ListAiLogs(c.Request.Context(), current.ID)
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, items)
}

func (h AiHandler) CreateLog(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	var body store.AiLogEntry
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	body.UserID = current.ID
	if body.Username == "" {
		body.Username = current.Email
	}
	saved, err := h.Store.CreateAiLog(c.Request.Context(), body)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, saved)
}

func (h AiHandler) Chat(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	var body struct {
		Message string `json:"message"`
		Model   string `json:"model"`
		UseRag  *bool  `json:"useRag"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Message == "" {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", "message is required")
		return
	}
	useRag := true
	if body.UseRag != nil {
		useRag = *body.UseRag
	}
	result, err := h.AI.Chat(c.Request.Context(), current.ID, current.Email, body.Message, body.Model, useRag)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "AI_ERROR", err.Error())
		return
	}
	response.OK(c, result)
}

func (h AiHandler) AssistForm(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	var body struct {
		JobTitle       string `json:"jobTitle"`
		YearsOfService int    `json:"yearsOfService"`
		MonthlySalary  int64  `json:"monthlySalary"`
		DraftReason    string `json:"draftReason"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	result, err := h.AI.AssistForm(c.Request.Context(), current.ID, current.Email, body.JobTitle, body.YearsOfService, body.MonthlySalary, body.DraftReason)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "AI_ERROR", err.Error())
		return
	}
	response.OK(c, result)
}

func (h AiHandler) AssistReport(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	var body struct {
		Subject         string `json:"subject"`
		StudentProgress string `json:"studentProgress"`
		SupportBenefit  string `json:"supportBenefit"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	result, err := h.AI.AssistReport(c.Request.Context(), current.ID, current.Email, body.Subject, body.StudentProgress, body.SupportBenefit)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "AI_ERROR", err.Error())
		return
	}
	response.OK(c, result)
}

func (h AiHandler) Summarize(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	var body struct {
		Content string `json:"content"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Content == "" {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", "content is required")
		return
	}
	result, err := h.AI.Summarize(c.Request.Context(), current.ID, current.Email, body.Content)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "AI_ERROR", err.Error())
		return
	}
	response.OK(c, result)
}
