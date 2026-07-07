// Sync static frontend assets (logo WebP, mascot GIF) to R2 or local media store.
//
// Usage: go run ./cmd/r2static
// Requires: ffmpeg in PATH for mascot conversion; be/.env with R2_* vars for cloud upload.
package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"

	"bea-guru-api/internal/config"
	"bea-guru-api/internal/storage"
)

func main() {
	config.LoadDotEnv()
	cfg := config.Load()

	r2, err := storage.NewR2Client(cfg.R2Config())
	if err != nil {
		log.Fatal(err)
	}
	media := storage.NewMediaStore(cfg.UploadDir, cfg.MediaRules(), r2)

	root, err := repoRoot()
	if err != nil {
		log.Fatal(err)
	}
	public := filepath.Join(root, "fe", "public")

	// Logo PNG → WebP
	logoPNG := filepath.Join(public, "brand", "bea-guru-logo.png")
	logoData, err := os.ReadFile(logoPNG)
	if err != nil {
		log.Fatalf("read logo: %v", err)
	}
	logoWebP, err := storage.OptimizeImageToWebP(logoData, 800)
	if err != nil {
		log.Fatalf("logo webp: %v", err)
	}
	logoURL, err := media.SaveStatic("static/brand/bea-guru-logo.webp", logoWebP, "image/webp")
	if err != nil {
		log.Fatalf("upload logo: %v", err)
	}
	fmt.Println("logo:", logoURL)

	// Mascot MP4 → GIF (ffmpeg palette; smaller than raw mp4 for short loop)
	maskotMP4 := filepath.Join(public, "maskot.mp4")
	gifPath := filepath.Join(os.TempDir(), "bea-guru-maskot.gif")
	defer os.Remove(gifPath)

	ffmpeg := exec.Command("ffmpeg", "-y", "-i", maskotMP4, "-t", "5",
		"-vf", "fps=10,scale=360:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer",
		"-loop", "0", gifPath)
	ffmpeg.Stderr = os.Stderr
	if err := ffmpeg.Run(); err != nil {
		log.Fatalf("ffmpeg maskot (install ffmpeg): %v", err)
	}
	gifData, err := os.ReadFile(gifPath)
	if err != nil {
		log.Fatal(err)
	}
	mascotURL, err := media.SaveStatic("static/maskot.gif", gifData, "image/gif")
	if err != nil {
		log.Fatalf("upload mascot: %v", err)
	}
	fmt.Println("mascot:", mascotURL)

	// ponytail: local fallback bila R2 CDN timeout dari jaringan dev
	staticDir := filepath.Join(root, "fe", "public", "static", "brand")
	if err := os.MkdirAll(staticDir, 0o755); err == nil {
		_ = os.WriteFile(filepath.Join(staticDir, "bea-guru-logo.webp"), logoWebP, 0o644)
		_ = os.WriteFile(filepath.Join(filepath.Dir(staticDir), "maskot.gif"), gifData, 0o644)
		fmt.Println("local fallback: fe/public/static/")
	}
	fmt.Println("Set VITE_R2_PUBLIC_BASE_URL=" + cfg.R2PublicBaseURL + " in fe/.env")
}

func repoRoot() (string, error) {
	wd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	if _, err := os.Stat(filepath.Join(wd, "fe", "public")); err == nil {
		return wd, nil
	}
	if _, err := os.Stat(filepath.Join(wd, "..", "fe", "public")); err == nil {
		return filepath.Join(wd, ".."), nil
	}
	return "", fmt.Errorf("run from repo root or be/")
}
