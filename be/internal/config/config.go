package config

import (
	"log/slog"
	"os"
	"strconv"
	"strings"
	"time"

	"bea-guru-api/internal/storage"
)

type Config struct {
	AppEnv            string
	AppName           string
	Port              string
	AllowedOrigins    []string
	DatabaseURL       string
	DBMaxConns        int32
	DBMinConns        int32
	OpenRouterAPIKey  string
	OpenRouterSiteURL string
	AIModels          []string
	BetterAuthURL     string
	BetterAuthJWKSURL string
	BrevoAPIKey       string
	EmailFrom         string
	EmailFromName     string
	FrontendURL          string
	InternalNotifySecret string
	R2AccountID          string
	R2AccessKeyID        string
	R2SecretAccessKey    string
	R2Bucket             string
	R2PublicBaseURL      string
	UploadDir            string
	MaxProofBytes     int
	LogLevel          slog.Level
	ReadHeaderTimeout time.Duration
	ReadTimeout       time.Duration
	WriteTimeout      time.Duration
	IdleTimeout       time.Duration
}

func Load() Config {
	env := getEnv("APP_ENV", "development")
	return Config{
		AppEnv:            env,
		AppName:           getEnv("APP_NAME", "bea-guru-api"),
		Port:              getEnv("PORT", "8080"),
		AllowedOrigins:    splitCSV(getEnv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")),
		DatabaseURL:       os.Getenv("DATABASE_URL"),
		DBMaxConns:        int32(getInt("DB_MAX_CONNS", 25)),
		DBMinConns:        int32(getInt("DB_MIN_CONNS", 2)),
		OpenRouterAPIKey:  firstNonEmpty(os.Getenv("OPENROUTER_API_KEY"), os.Getenv("API_MODEL")),
		OpenRouterSiteURL: os.Getenv("OPENROUTER_SITE_URL"),
		AIModels:          splitCSV(os.Getenv("AI_MODELS")),
		BetterAuthURL:     getEnv("BETTER_AUTH_URL", "http://localhost:3000"),
		BetterAuthJWKSURL: getEnv("BETTER_AUTH_JWKS_URL", "http://localhost:3001/api/auth/jwks"),
		BrevoAPIKey:       os.Getenv("BREVO_API_KEY"),
		EmailFrom:         getEnv("EMAIL_FROM", ""),
		EmailFromName:     getEnv("EMAIL_FROM_NAME", "Bea Guru"),
		FrontendURL:       firstNonEmpty(os.Getenv("FRONTEND_URL"), os.Getenv("OPENROUTER_SITE_URL"), "http://localhost:3000"),
		InternalNotifySecret: os.Getenv("INTERNAL_NOTIFY_SECRET"),
		R2AccountID:          os.Getenv("R2_ACCOUNT_ID"),
		R2AccessKeyID:        os.Getenv("R2_ACCESS_KEY_ID"),
		R2SecretAccessKey:    os.Getenv("R2_SECRET_ACCESS_KEY"),
		R2Bucket:             getEnv("R2_BUCKET", "bea-guru-media"),
		R2PublicBaseURL:      strings.TrimRight(strings.TrimSpace(os.Getenv("R2_PUBLIC_BASE_URL")), "/"),
		UploadDir:            getEnv("UPLOAD_DIR", "uploads"),
		MaxProofBytes:        storage.MaxProofBytes,
		LogLevel:          parseLogLevel(getEnv("LOG_LEVEL", "info")),
		ReadHeaderTimeout: getDuration("READ_HEADER_TIMEOUT", 5*time.Second),
		ReadTimeout:       getDuration("READ_TIMEOUT", 15*time.Second),
		WriteTimeout:      getDuration("WRITE_TIMEOUT", 15*time.Second),
		IdleTimeout:       getDuration("IDLE_TIMEOUT", 60*time.Second),
	}
}

func (c Config) HTTPAddr() string {
	return ":" + c.Port
}

func (c Config) IsProduction() bool {
	return strings.EqualFold(c.AppEnv, "production")
}

func (c Config) R2Config() storage.R2Config {
	return storage.R2Config{
		AccountID:       c.R2AccountID,
		AccessKeyID:     c.R2AccessKeyID,
		SecretAccessKey: c.R2SecretAccessKey,
		Bucket:          c.R2Bucket,
		PublicBaseURL:   c.R2PublicBaseURL,
	}
}

func (c Config) MediaRules() storage.MediaRules {
	return storage.MediaRules{PublicBaseURL: c.R2PublicBaseURL}
}

func getEnv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}


func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		item := strings.TrimSpace(part)
		if item != "" {
			out = append(out, item)
		}
	}
	return out
}

func getDuration(key string, fallback time.Duration) time.Duration {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}
	if parsed, err := time.ParseDuration(raw); err == nil {
		return parsed
	}
	if seconds, err := strconv.Atoi(raw); err == nil {
		return time.Duration(seconds) * time.Second
	}
	return fallback
}

func getInt(key string, fallback int) int {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}
	if n, err := strconv.Atoi(raw); err == nil && n > 0 {
		return n
	}
	return fallback
}

func parseLogLevel(value string) slog.Level {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "debug":
		return slog.LevelDebug
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}
