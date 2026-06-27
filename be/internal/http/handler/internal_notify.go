package handler

import (
	"net/http"
	"strings"

	"bea-guru-api/internal/http/response"
	"bea-guru-api/internal/notify"

	"github.com/gin-gonic/gin"
)

type InternalNotifyHandler struct {
	Notify *notify.Service
	Secret string
}

func (h InternalNotifyHandler) AccountCreated(c *gin.Context) {
	if strings.TrimSpace(h.Secret) == "" {
		response.Error(c, http.StatusNotFound, "NOT_FOUND", "not found")
		return
	}
	if c.GetHeader("X-Internal-Notify-Secret") != h.Secret {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "invalid secret")
		return
	}

	var body struct {
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", "email is required")
		return
	}

	email := strings.TrimSpace(strings.ToLower(body.Email))
	if email == "" {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", "email is required")
		return
	}

	if h.Notify != nil {
		h.Notify.OnAccountCreated(email, body.Name)
	}

	response.OK(c, gin.H{"queued": true})
}
