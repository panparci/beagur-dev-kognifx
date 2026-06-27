package handler

import (
	"errors"
	"net/http"
	"strings"

	"bea-guru-api/internal/http/middleware"
	"bea-guru-api/internal/http/response"
	"bea-guru-api/internal/store"

	"github.com/gin-gonic/gin"
)

type OnboardingHandler struct {
	Store *store.Store
}

func (h OnboardingHandler) ChooseRole(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}

	var body struct {
		Role string `json:"role"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", "role is required")
		return
	}

	updated, err := h.Store.ChooseOnboardingRole(c.Request.Context(), current.ID, body.Role)
	if errors.Is(err, store.ErrOnboardingNotAllowed) {
		response.Error(c, http.StatusConflict, "ROLE_ALREADY_SET", "Akun sudah memiliki peran. Hubungi admin jika perlu perubahan.")
		return
	}
	if errors.Is(err, store.ErrNotFound) {
		response.Error(c, http.StatusNotFound, "NOT_FOUND", "user not found")
		return
	}
	if err != nil {
		if strings.Contains(err.Error(), "invalid onboarding role") {
			response.Error(c, http.StatusBadRequest, "INVALID_ROLE", "Peran tidak valid untuk onboarding publik.")
			return
		}
		response.Error(c, http.StatusInternalServerError, "DB_ERROR", "Gagal menetapkan peran akun.")
		return
	}

	response.OK(c, updated)
}
