package storage

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

const (
	MaxImageBytes     = 3 << 20 // 3 MiB
	publicMediaPrefix = "/api/v1/public/media/"
)

var allowedImageMIME = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

// MediaRules configures which image URLs are accepted when saving to DB.
type MediaRules struct {
	PublicBaseURL string // R2 public origin, e.g. https://assets.example.com
}

// MediaStore saves public images (teacher profile, reports) to R2 or local disk.
type MediaStore struct {
	localRoot string
	rules     MediaRules
	r2        *r2Client
}

func NewMediaStore(localRoot string, rules MediaRules, r2 *r2Client) MediaStore {
	if strings.TrimSpace(localRoot) == "" {
		localRoot = "uploads"
	}
	return MediaStore{localRoot: localRoot, rules: rules, r2: r2}
}

func (m MediaStore) Rules() MediaRules { return m.rules }

func (m MediaStore) ValidateImageContentType(contentType string) (string, error) {
	ct := strings.ToLower(strings.TrimSpace(contentType))
	ext, ok := allowedImageMIME[ct]
	if !ok {
		return "", fmt.Errorf("unsupported content type %q", contentType)
	}
	return ext, nil
}

// SavePublicImage stores a teacher/report photo. Returns a public URL.
func (m MediaStore) SavePublicImage(folder, ownerID string, data []byte, contentType string) (string, error) {
	if len(data) == 0 {
		return "", fmt.Errorf("empty file")
	}
	if len(data) > MaxImageBytes {
		return "", fmt.Errorf("file exceeds %d bytes", MaxImageBytes)
	}
	ext, err := m.ValidateImageContentType(contentType)
	if err != nil {
		return "", err
	}
	_ = ext // always stored as webp after optimize
	ownerID = strings.TrimSpace(ownerID)
	if ownerID == "" {
		return "", fmt.Errorf("owner id required")
	}
	folder = strings.Trim(folder, "/")
	if folder == "" {
		return "", fmt.Errorf("folder required")
	}

	optimized, err := OptimizeImageToWebP(data, maxWidthForFolder(folder))
	if err != nil {
		return "", fmt.Errorf("optimize image: %w", err)
	}
	data = optimized
	contentType = "image/webp"
	ext = ".webp"

	key := folder + "/" + ownerID + "/" + uuid.NewString() + ext
	if m.r2 != nil {
		return m.r2.putPublic(key, data, contentType)
	}

	rel := filepath.Join("media", filepath.FromSlash(key))
	abs := filepath.Join(m.localRoot, rel)
	if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
		return "", err
	}
	if err := os.WriteFile(abs, data, 0o644); err != nil {
		return "", err
	}
	return publicMediaPrefix + filepath.ToSlash(key), nil
}

// SaveStatic uploads a fixed-path asset (logo, mascot) — key e.g. static/maskot.gif
func (m MediaStore) SaveStatic(key string, data []byte, contentType string) (string, error) {
	if len(data) == 0 {
		return "", fmt.Errorf("empty file")
	}
	key = strings.TrimPrefix(strings.TrimSpace(key), "/")
	if key == "" || strings.Contains(key, "..") {
		return "", fmt.Errorf("invalid key")
	}
	if m.r2 != nil {
		return m.r2.putPublic(key, data, contentType)
	}
	rel := filepath.Join("media", filepath.FromSlash(key))
	abs := filepath.Join(m.localRoot, rel)
	if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
		return "", err
	}
	if err := os.WriteFile(abs, data, 0o644); err != nil {
		return "", err
	}
	return publicMediaPrefix + filepath.ToSlash(key), nil
}

// ResolvePublicMedia maps a public media URL to a local file path (dev only).
func (m MediaStore) ResolvePublicMedia(url string) (string, error) {
	url = strings.TrimPrefix(url, publicMediaPrefix)
	url = strings.TrimPrefix(url, "/")
	if url == "" || strings.Contains(url, "..") {
		return "", fmt.Errorf("invalid path")
	}
	rel := filepath.Join("media", url)
	abs := filepath.Join(m.localRoot, rel)
	cleanRoot := filepath.Clean(filepath.Join(m.localRoot, "media"))
	cleanAbs := filepath.Clean(abs)
	if !strings.HasPrefix(cleanAbs, cleanRoot+string(os.PathSeparator)) && cleanAbs != cleanRoot {
		return "", fmt.Errorf("invalid path")
	}
	return abs, nil
}

// ValidatePublicMediaURL rejects base64 blobs; accepts R2, local public media, or preset hosts.
func (r MediaRules) ValidatePublicMediaURL(raw string) error {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return fmt.Errorf("image url required")
	}
	if strings.HasPrefix(raw, "data:image") {
		return fmt.Errorf("upload foto via menu unggah, bukan base64 di database")
	}
	if strings.HasPrefix(raw, publicMediaPrefix) {
		return nil
	}
	base := strings.TrimRight(strings.TrimSpace(r.PublicBaseURL), "/")
	if base != "" && strings.HasPrefix(raw, base+"/") {
		return nil
	}
	// ponytail: report wizard preset stock photos — upgrade path: own asset library on R2
	if strings.HasPrefix(raw, "https://images.unsplash.com/") {
		return nil
	}
	return fmt.Errorf("url gambar tidak dikenali — unggah ulang dari portal")
}
