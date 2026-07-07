package handler

import (
	"errors"
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"bea-guru-api/internal/http/middleware"
	"bea-guru-api/internal/http/response"
	"bea-guru-api/internal/storage"
	"bea-guru-api/internal/store"

	"github.com/gin-gonic/gin"
)

type UploadHandler struct {
	Proofs storage.ProofStore
	Media  storage.MediaStore
}

func readUploadFile(c *gin.Context, maxBytes int64) ([]byte, string, error) {
	file, err := c.FormFile("file")
	if err != nil {
		return nil, "", err
	}
	if file.Size > maxBytes {
		return nil, "", errFileTooLarge
	}
	fh, err := file.Open()
	if err != nil {
		return nil, "", err
	}
	defer fh.Close()
	data, err := io.ReadAll(io.LimitReader(fh, maxBytes+1))
	if err != nil {
		return nil, "", err
	}
	if int64(len(data)) > maxBytes {
		return nil, "", errFileTooLarge
	}
	contentType := file.Header.Get("Content-Type")
	if contentType == "" {
		contentType = http.DetectContentType(data)
	}
	return data, contentType, nil
}

var errFileTooLarge = errors.New("file too large")

func (h UploadHandler) DonationProof(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	data, contentType, err := readUploadFile(c, storage.MaxProofBytes)
	if err != nil {
		msg := "file is required"
		if errors.Is(err, errFileTooLarge) {
			msg = "file too large"
		}
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", msg)
		return
	}
	url, err := h.Proofs.SaveDonorProof(current.ID, data, contentType)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	response.OK(c, gin.H{"url": url})
}

// TeacherImage accepts kind=teacher-profile|teacher-teaching
func (h UploadHandler) TeacherImage(c *gin.Context) {
	kind := strings.TrimSpace(c.PostForm("kind"))
	if kind != "teacher-profile" && kind != "teacher-teaching" {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", "kind must be teacher-profile or teacher-teaching")
		return
	}
	h.saveImage(c, kind)
}

func (h UploadHandler) ReportImage(c *gin.Context) {
	h.saveImage(c, "report")
}

func (h UploadHandler) saveImage(c *gin.Context, kind string) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}
	var folder string
	switch kind {
	case "teacher-profile":
		folder = "teachers/profile"
	case "teacher-teaching":
		folder = "teachers/teaching"
	case "report":
		folder = "reports"
	default:
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", "invalid image kind")
		return
	}
	data, contentType, err := readUploadFile(c, storage.MaxImageBytes)
	if err != nil {
		msg := "file is required"
		if errors.Is(err, errFileTooLarge) {
			msg = "file too large"
		}
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", msg)
		return
	}
	url, err := h.Media.SavePublicImage(folder, current.ID, data, contentType)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}
	response.OK(c, gin.H{"url": url})
}

type FilesHandler struct {
	Proofs storage.ProofStore
	Media  storage.MediaStore
	Store  *store.Store
}

func (h FilesHandler) PublicMedia(c *gin.Context) {
	rel := strings.TrimPrefix(c.Param("filepath"), "/")
	url := "/api/v1/public/media/" + filepath.ToSlash(rel)
	abs, err := h.Media.ResolvePublicMedia(url)
	if err != nil {
		response.Error(c, http.StatusNotFound, "NOT_FOUND", "file not found")
		return
	}
	c.File(abs)
}

func (h FilesHandler) Serve(c *gin.Context) {
	current, ok := middleware.CurrentUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "UNAUTHENTICATED", "login required")
		return
	}

	rel := strings.TrimPrefix(c.Param("filepath"), "/")
	proofURL := "/api/v1/files/" + filepath.ToSlash(rel)

	ownerID := storage.ParseDonorIDFromProofURL(proofURL)
	if dbOwner, err := h.Store.DonationProofOwner(c.Request.Context(), proofURL); err == nil {
		ownerID = dbOwner
	}
	if ownerID == "" {
		response.Error(c, http.StatusNotFound, "NOT_FOUND", "file not found")
		return
	}

	canRead := ownerID == current.ID || middleware.HasPermission(current, "donations:read")
	if !canRead {
		response.Error(c, http.StatusForbidden, "FORBIDDEN", "access denied")
		return
	}

	abs, err := h.Proofs.Resolve(proofURL)
	if err != nil {
		response.Error(c, http.StatusNotFound, "NOT_FOUND", "file not found")
		return
	}
	c.File(abs)
}

type AuditHandler struct {
	Store *store.Store
}

func (h AuditHandler) List(c *gin.Context) {
	items, err := h.Store.ListAdminAuditLogs(c.Request.Context(), 50)
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "DB_ERROR", err.Error())
		return
	}
	response.OK(c, items)
}
