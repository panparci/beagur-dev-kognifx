package storage

import (
	"bytes"
	"image"
	_ "image/jpeg"
	_ "image/png"

	"github.com/chai2010/webp"
	"github.com/disintegration/imaging"
)

const (
	maxProfileWidth = 1200
	maxReportWidth  = 1400
	webpQuality     = 82
)

// OptimizeImageToWebP decodes JPEG/PNG/WebP, optionally downscales, encodes WebP.
func OptimizeImageToWebP(data []byte, maxWidth int) ([]byte, error) {
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	if maxWidth > 0 && img.Bounds().Dx() > maxWidth {
		img = imaging.Resize(img, maxWidth, 0, imaging.Lanczos)
	}
	var out bytes.Buffer
	if err := webp.Encode(&out, img, &webp.Options{Quality: float32(webpQuality)}); err != nil {
		return nil, err
	}
	return out.Bytes(), nil
}

func maxWidthForFolder(folder string) int {
	if folder == "reports" {
		return maxReportWidth
	}
	return maxProfileWidth
}
