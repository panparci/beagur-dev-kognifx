package handler

import (
	"errors"
	"net/http"

	"bea-guru-api/internal/http/response"
	"bea-guru-api/internal/store"

	"github.com/gin-gonic/gin"
)

func writeStoreError(c *gin.Context, err error) bool {
	if err == nil {
		return false
	}
	switch {
	case errors.Is(err, store.ErrNotFound):
		response.Error(c, http.StatusNotFound, "NOT_FOUND", err.Error())
	case errors.Is(err, store.ErrForbidden):
		response.Error(c, http.StatusForbidden, "FORBIDDEN", err.Error())
	case errors.Is(err, store.ErrInvalidState):
		response.Error(c, http.StatusConflict, "INVALID_STATE", err.Error())
	case errors.Is(err, store.ErrConflict):
		response.Error(c, http.StatusConflict, "CONFLICT", err.Error())
	default:
		response.Error(c, http.StatusInternalServerError, "DB_ERROR", err.Error())
	}
	return true
}
