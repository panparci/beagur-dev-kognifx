// Dev helper: go run ./cmd/test-email [to-email] [name]
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"bea-guru-api/internal/config"
	"bea-guru-api/internal/notify"
)

func main() {
	config.LoadDotEnv()
	cfg := config.Load()

	to := "wahyufiver.id@gmail.com"
	name := "Wahyu"
	if len(os.Args) > 1 && os.Args[1] != "" {
		to = os.Args[1]
	}
	if len(os.Args) > 2 && os.Args[2] != "" {
		name = os.Args[2]
	}

	svc := notify.New(nil, cfg.BrevoAPIKey, cfg.EmailFrom, cfg.EmailFromName, cfg.FrontendURL, nil)
	if !svc.Enabled() {
		log.Fatal("BREVO_API_KEY and EMAIL_FROM must be set in be/.env")
	}

	base := strings.TrimRight(cfg.FrontendURL, "/")
	portal := base + "/portal"
	html := notify.RenderAccountCreatedHTML(name, portal)

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	err := svc.Send(ctx, notify.Message{
		To:      to,
		ToName:  name,
		Subject: "Pembuatan Akun Bea Guru Kamu Berhasil!",
		HTML:    html,
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Test email sent to %s\n", to)
}
