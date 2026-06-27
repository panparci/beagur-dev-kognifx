package handler

import (
	"net/http"

	"bea-guru-api/internal/http/response"
	"bea-guru-api/internal/store"

	"github.com/gin-gonic/gin"
)

type LedgerHandler struct {
	Store *store.Store
}

func (h LedgerHandler) List(c *gin.Context) {
	items, err := h.Store.ListLedger(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, items)
}
