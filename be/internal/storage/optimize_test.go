package storage

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"testing"
)

func TestOptimizeImageToWebP(t *testing.T) {
	img := image.NewRGBA(image.Rect(0, 0, 16, 16))
	for y := 0; y < 16; y++ {
		for x := 0; x < 16; x++ {
			img.Set(x, y, color.RGBA{uint8(x * 16), uint8(y * 16), 100, 255})
		}
	}
	var pngBuf bytes.Buffer
	if err := png.Encode(&pngBuf, img); err != nil {
		t.Fatal(err)
	}
	out, err := OptimizeImageToWebP(pngBuf.Bytes(), 8)
	if err != nil || len(out) < 12 {
		t.Fatalf("webp encode failed: len=%d err=%v", len(out), err)
	}
}
