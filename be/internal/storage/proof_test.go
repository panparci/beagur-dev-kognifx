package storage

import (
	"os"
	"testing"
)

func TestProofStoreValidateContentType(t *testing.T) {
	s := NewProofStore(t.TempDir())
	ext, err := s.ValidateContentType("image/png")
	if err != nil || ext != ".png" {
		t.Fatalf("png: ext=%q err=%v", ext, err)
	}
	if _, err := s.ValidateContentType("text/plain"); err == nil {
		t.Fatal("expected reject for text/plain")
	}
}

func TestProofStoreSaveAndResolve(t *testing.T) {
	root := t.TempDir()
	s := NewProofStore(root)
	url, err := s.SaveDonorProof("11111111-1111-1111-1111-111111111102", []byte("fake-png"), "image/png")
	if err != nil {
		t.Fatal(err)
	}
	abs, err := s.Resolve(url)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := s.Resolve("/api/v1/files/../secret"); err == nil {
		t.Fatal("path traversal should fail")
	}
	data, err := os.ReadFile(abs)
	if err != nil || string(data) != "fake-png" {
		t.Fatalf("read back: %q err=%v", data, err)
	}
}
