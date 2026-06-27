package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func CORS(allowedOrigins []string, allowLocalDev bool) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(allowedOrigins))
	for _, origin := range allowedOrigins {
		allowed[origin] = struct{}{}
	}

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin != "" && isOriginAllowed(origin, allowed, allowLocalDev) {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Vary", "Origin")
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Request-ID, X-User-ID, X-User-Email, X-User-Name, X-User-Role, X-User-Roles, X-User-Permissions")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		}

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

func isOriginAllowed(origin string, allowed map[string]struct{}, allowLocalDev bool) bool {
	if _, ok := allowed[origin]; ok {
		return true
	}
	if !allowLocalDev {
		return false
	}
	return isLocalDevOrigin(origin)
}

func isLocalDevOrigin(origin string) bool {
	if !strings.HasPrefix(origin, "http://") && !strings.HasPrefix(origin, "https://") {
		return false
	}
	rest := strings.TrimPrefix(strings.TrimPrefix(origin, "http://"), "https://")
	host := rest
	if idx := strings.Index(rest, ":"); idx >= 0 {
		host = rest[:idx]
	}
	switch host {
	case "localhost", "127.0.0.1", "[::1]":
		return true
	}
	return strings.HasPrefix(host, "192.168.") || strings.HasPrefix(host, "10.")
}
