package config

import (
	"log/slog"
	"os"
	"strconv"
	"strings"
	"time"
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
