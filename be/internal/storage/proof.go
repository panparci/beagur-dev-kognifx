package storage

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

const (
	MaxProofBytes = 5 << 20 // 5 MiB
)

var allowedProofMIME = map[string]string{
	"image/jpeg":      ".jpg",
	"image/png":       ".png",
	"image/webp":      ".webp",
	"application/pdf": ".pdf",
}

type ProofStore struct {
	Root string
}

func NewProofStore(root string) ProofStore {
	if strings.TrimSpace(root) == "" {
		root = "uploads"
	}
	return ProofStore{Root: root}
}

func (s ProofStore) ValidateContentType(contentType string) (string, error) {
	ct := strings.ToLower(strings.TrimSpace(contentType))
	ext, ok := allowedProofMIME[ct]
	if !ok {
		return "", fmt.Errorf("unsupported content type %q", contentType)
	}
	return ext, nil
}

func (s ProofStore) SaveDonorProof(donorID string, data []byte, contentType string) (string, error) {
	if len(data) == 0 {
		return "", fmt.Errorf("empty file")
	}
	if len(data) > MaxProofBytes {
		return "", fmt.Errorf("file exceeds %d bytes", MaxProofBytes)
	}
	ext, err := s.ValidateContentType(contentType)
	if err != nil {
		return "", err
	}
	donorID = strings.TrimSpace(donorID)
	if donorID == "" {
		return "", fmt.Errorf("donor id required")
	}

	rel := filepath.Join("donation-proofs", donorID, uuid.NewString()+ext)
	abs := filepath.Join(s.Root, rel)
	if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
		return "", err
	}
	if err := os.WriteFile(abs, data, 0o644); err != nil {
		return "", err
	}
	return "/api/v1/files/" + filepath.ToSlash(rel), nil
}

func (s ProofStore) Resolve(rel string) (string, error) {
	rel = strings.TrimPrefix(rel, "/api/v1/files/")
	rel = strings.TrimPrefix(rel, "/")
	if rel == "" || strings.Contains(rel, "..") {
		return "", fmt.Errorf("invalid path")
	}
	abs := filepath.Join(s.Root, rel)
	cleanRoot := filepath.Clean(s.Root)
	cleanAbs := filepath.Clean(abs)
	if !strings.HasPrefix(cleanAbs, cleanRoot+string(os.PathSeparator)) && cleanAbs != cleanRoot {
		return "", fmt.Errorf("invalid path")
	}
	return abs, nil
}

func ParseDonorIDFromProofURL(url string) string {
	url = strings.TrimPrefix(url, "/api/v1/files/donation-proofs/")
	parts := strings.Split(url, "/")
	if len(parts) < 2 {
		return ""
	}
	return parts[0]
}
