package cookie

import (
	"net/http"

	"bea-guru-api/internal/store"

	"github.com/gin-gonic/gin"
)

func SetSession(c *gin.Context, sessionID string, maxAge int) {
	secure := c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https"
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     store.SessionCookieName(),
		Value:    sessionID,
		Path:     "/",
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	})
}

func ClearSession(c *gin.Context) {
	SetSession(c, "", -1)
}
