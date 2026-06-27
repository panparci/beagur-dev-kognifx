package middleware

import (
	"log/slog"
	"net/http"

	"bea-guru-api/internal/http/response"

	"github.com/gin-gonic/gin"
)

func Recovery(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if recovered := recover(); recovered != nil {
				logger.Error("panic recovered", "error", recovered, "path", c.Request.URL.Path)
				response.Error(c, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", "Unexpected server error")
				c.Abort()
			}
		}()

		c.Next()
	}
}
