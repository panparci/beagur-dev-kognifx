package handler

import (
	"net/http"
	"os"
	"path/filepath"
	"time"

	"bea-guru-api/internal/db"
	"bea-guru-api/internal/http/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type HealthHandler struct {
	DB        *pgxpool.Pool
	UploadDir string
}

func (h HealthHandler) Health(c *gin.Context) {
	response.OK(c, gin.H{
		"status": "ok",
		"time":   time.Now().UTC().Format(time.RFC3339),
	})
}

func (h HealthHandler) Ready(c *gin.Context) {
	if err := db.Ping(c.Request.Context(), h.DB); err != nil {
		response.Error(c, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Database is not ready")
		return
	}
	if h.UploadDir != "" {
		test := filepath.Join(h.UploadDir, ".readyz")
		if err := os.WriteFile(test, []byte("1"), 0o644); err != nil {
			response.Error(c, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Upload directory is not writable")
			return
		}
		_ = os.Remove(test)
	}

	response.OK(c, gin.H{"status": "ready"})
}
