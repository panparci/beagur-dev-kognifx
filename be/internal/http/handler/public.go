package handler

import (
	"net/http"
	"time"

	"bea-guru-api/internal/cache"
	"bea-guru-api/internal/http/response"
	"bea-guru-api/internal/mask"
	"bea-guru-api/internal/store"

	"github.com/gin-gonic/gin"
)

const publicCacheTTL = 30 * time.Second

type PublicHandler struct {
	Store    *store.Store
	teachers *cache.TTL[[]store.TeacherProfile]
}

func NewPublicHandler(st *store.Store) PublicHandler {
	return PublicHandler{
		Store:    st,
		teachers: cache.NewTTL[[]store.TeacherProfile](publicCacheTTL),
	}
}

func (h PublicHandler) Teachers(c *gin.Context) {
	items, err := h.teachers.Get(func() ([]store.TeacherProfile, error) {
		return h.Store.ListPublicTeachers(c.Request.Context())
	})
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	for i := range items {
		items[i].BankAccountNumber = mask.BankAccount(items[i].BankAccountNumber, false)
	}
	response.OK(c, items)
}

func (h PublicHandler) Terms(c *gin.Context) {
	value, err := h.Store.GetSetting(c.Request.Context(), "terms")
	if err != nil {
		response.Error(c, http.StatusNotFound, "NOT_FOUND", "terms not configured")
		return
	}
	response.OK(c, gin.H{"value": value})
}

func (h PublicHandler) Landing(c *gin.Context) {
	value, err := h.Store.GetSetting(c.Request.Context(), "landing")
	if err != nil {
		response.Error(c, http.StatusNotFound, "NOT_FOUND", "landing not configured")
		return
	}
	response.OK(c, gin.H{"value": value})
}
