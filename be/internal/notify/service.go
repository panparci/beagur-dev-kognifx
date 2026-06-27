package notify

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"bea-guru-api/internal/store"
)

const brevoSendURL = "https://api.brevo.com/v3/smtp/email"

type Message struct {
	To      string
	ToName  string
	Subject string
	HTML    string
}

type Service struct {
	Store       *store.Store
	Logger      *slog.Logger
	APIKey      string
	FromEmail   string
	FromName    string
	FrontendURL string
	HTTPClient  *http.Client
}

func New(logger *slog.Logger, apiKey, fromEmail, fromName, frontendURL string, st *store.Store) *Service {
	if logger == nil {
		logger = slog.Default()
	}
	return &Service{
		Store:       st,
		Logger:      logger,
		APIKey:      strings.TrimSpace(apiKey),
		FromEmail:   strings.TrimSpace(fromEmail),
		FromName:    strings.TrimSpace(fromName),
		FrontendURL: strings.TrimRight(strings.TrimSpace(frontendURL), "/"),
		HTTPClient:  &http.Client{Timeout: 12 * time.Second},
	}
}

func (s *Service) Enabled() bool {
	return s.APIKey != "" && s.FromEmail != ""
}

func (s *Service) portalURL(path string) string {
	if s.FrontendURL == "" {
		return path
	}
	if path == "" || path == "/" {
		return s.FrontendURL
	}
	if strings.HasPrefix(path, "/") {
		return s.FrontendURL + path
	}
	return s.FrontendURL + "/" + path
}

func (s *Service) runAsync(fn func(context.Context)) {
	if !s.Enabled() {
		return
	}
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		fn(ctx)
	}()
}

func (s *Service) Send(ctx context.Context, msg Message) error {
	if !s.Enabled() {
		return nil
	}
	toEmail := strings.TrimSpace(msg.To)
	if toEmail == "" {
		return nil
	}

	toName := strings.TrimSpace(msg.ToName)
	if toName == "" {
		toName = toEmail
	}
	fromName := s.FromName
	if fromName == "" {
		fromName = "Bea Guru"
	}

	payload := map[string]any{
		"sender": map[string]string{
			"name":  fromName,
			"email": s.FromEmail,
		},
		"to": []map[string]string{
			{"email": toEmail, "name": toName},
		},
		"subject":     msg.Subject,
		"htmlContent": msg.HTML,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, brevoSendURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("api-key", s.APIKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	client := s.HTTPClient
	if client == nil {
		client = http.DefaultClient
	}

	res, err := client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 200 && res.StatusCode < 300 {
		return nil
	}

	raw, _ := io.ReadAll(io.LimitReader(res.Body, 4096))
	return fmt.Errorf("brevo send failed: status=%d body=%s", res.StatusCode, strings.TrimSpace(string(raw)))
}

func (s *Service) sendLogged(ctx context.Context, msg Message) {
	if err := s.Send(ctx, msg); err != nil {
		s.Logger.Warn("email send failed",
			"to", msg.To,
			"subject", msg.Subject,
			"error", err,
		)
	}
}
