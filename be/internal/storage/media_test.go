package storage

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"os"
	"testing"
)

func TestMediaRulesRejectBase64(t *testing.T) {
	rules := MediaRules{PublicBaseURL: "https://assets.example.com"}
	if err := rules.ValidatePublicMediaURL("data:image/png;base64,abc"); err == nil {
		t.Fatal("expected base64 rejection")
	}
	if err := rules.ValidatePublicMediaURL("https://assets.example.com/teachers/x.jpg"); err != nil {
		t.Fatalf("r2 url: %v", err)
	}
	if err := rules.ValidatePublicMediaURL(publicMediaPrefix + "teachers/u/1.jpg"); err != nil {
		t.Fatalf("local public: %v", err)
	}
}

func TestMediaStoreSaveLocal(t *testing.T) {
	root := t.TempDir()
	m := NewMediaStore(root, MediaRules{}, nil)
	png := makeTestPNG(t)
	url, err := m.SavePublicImage("teachers/profile", "user-1", png, "image/png")
	if err != nil {
		t.Fatal(err)
	}
	if !stringsHasPrefix(url, publicMediaPrefix) {
		t.Fatalf("unexpected url %q", url)
	}
	abs, err := m.ResolvePublicMedia(url)
	if err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(abs)
	if err != nil || len(data) < 12 {
		t.Fatalf("read back webp: len=%d err=%v", len(data), err)
	}
}

func makeTestPNG(t *testing.T) []byte {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, 4, 4))
	img.Set(0, 0, color.RGBA{255, 0, 0, 255})
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatal(err)
	}
	return buf.Bytes()
}

func stringsHasPrefix(s, prefix string) bool {
	return len(s) >= len(prefix) && s[:len(prefix)] == prefix
}
