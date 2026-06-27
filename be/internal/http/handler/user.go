package handler

import (
	"net/http"

	"bea-guru-api/internal/http/middleware"
	"bea-guru-api/internal/http/response"

	"github.com/gin-gonic/gin"
)

type UserHandler struct{}

func (h UserHandler) Me(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "Current user is required")
		return
	}

	response.OK(c, current)
}
