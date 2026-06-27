package middleware

import (
	"net/http"
	"strings"

	authjwt "bea-guru-api/internal/auth"
	"bea-guru-api/internal/domain/user"
	"bea-guru-api/internal/http/response"
	"bea-guru-api/internal/store"

	"github.com/gin-gonic/gin"
)

const CurrentUserKey = "currentUser"

func RequireCurrentUser(st *store.Store, jwtValidator *authjwt.Validator, allowHeaderAuth bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		current, err := resolveCurrentUser(c, st, jwtValidator, allowHeaderAuth)
		if err != nil {
			response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "Current user is required")
			c.Abort()
			return
		}
		c.Set(CurrentUserKey, current)
		c.Next()
	}
}

func resolveCurrentUser(c *gin.Context, st *store.Store, jwtValidator *authjwt.Validator, allowHeaderAuth bool) (user.CurrentUser, error) {
	if jwtValidator != nil {
		if authHeader := strings.TrimSpace(c.GetHeader("Authorization")); strings.HasPrefix(authHeader, "Bearer ") {
			token := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
			if token != "" {
				claims, err := jwtValidator.Validate(c.Request.Context(), token)
				if err == nil && st != nil {
					current, lookupErr := st.GetUserByEmail(c.Request.Context(), claims.Email)
					if lookupErr == nil {
						return current, nil
					}
				}
			}
		}
	}

	if st != nil {
		if sid, err := c.Cookie(store.SessionCookieName()); err == nil && sid != "" {
			current, err := st.UserFromSession(c.Request.Context(), sid)
			if err == nil {
				return current, nil
			}
		}
	}

	if !allowHeaderAuth {
		return user.CurrentUser{}, store.ErrNotFound
	}

	current := user.CurrentUser{
		ID:          strings.TrimSpace(c.GetHeader("X-User-ID")),
		Email:       strings.TrimSpace(c.GetHeader("X-User-Email")),
		Name:        strings.TrimSpace(c.GetHeader("X-User-Name")),
		Role:        user.Role(strings.TrimSpace(c.GetHeader("X-User-Role"))),
		Roles:       parseRoles(c.GetHeader("X-User-Roles")),
		Permissions: parseCSV(c.GetHeader("X-User-Permissions")),
	}

	if current.ID == "" || current.Email == "" || current.Role == "" {
		return user.CurrentUser{}, store.ErrNotFound
	}
	if current.Name == "" {
		current.Name = current.Email
	}
	if len(current.Roles) == 0 {
		current.Roles = []user.Role{current.Role}
	}
	return current, nil
}

func HasPermission(current user.CurrentUser, permission string) bool {
	for _, currentPermission := range current.Permissions {
		if currentPermission == permission {
			return true
		}
	}
	return false
}

func RequirePermission(permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		current, ok := CurrentUser(c)
		if !ok {
			response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "Current user is required")
			c.Abort()
			return
		}

		if HasPermission(current, permission) {
			c.Next()
			return
		}

		response.Error(c, http.StatusForbidden, "FORBIDDEN", "Missing required permission")
		c.Abort()
	}
}

func RequireAnyPermission(permissions ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		current, ok := CurrentUser(c)
		if !ok {
			response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "Current user is required")
			c.Abort()
			return
		}

		for _, permission := range permissions {
			if HasPermission(current, permission) {
				c.Next()
				return
			}
		}

		response.Error(c, http.StatusForbidden, "FORBIDDEN", "Missing required permission")
		c.Abort()
	}
}

func CurrentUser(c *gin.Context) (user.CurrentUser, bool) {
	value, ok := c.Get(CurrentUserKey)
	if !ok {
		return user.CurrentUser{}, false
	}

	current, ok := value.(user.CurrentUser)
	return current, ok
}

func parseRoles(value string) []user.Role {
	parts := parseCSV(value)
	roles := make([]user.Role, 0, len(parts))
	for _, part := range parts {
		roles = append(roles, user.Role(part))
	}
	return roles
}

func parseCSV(value string) []string {
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		item := strings.TrimSpace(part)
		if item != "" {
			out = append(out, item)
		}
	}
	return out
}
