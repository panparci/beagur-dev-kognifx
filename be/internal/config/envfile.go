package config

import (
	"os"
	"path/filepath"
	"strings"
)

// LoadDotEnv loads be/.env when variables are not already set in the process env.
// This keeps `go run ./cmd/api` working even outside `make run`.
func LoadDotEnv() {
	for _, path := range dotEnvCandidates() {
		if err := parseEnvFile(path); err == nil {
			return
		}
	}
}

func dotEnvCandidates() []string {
	wd, err := os.Getwd()
	if err != nil {
		return []string{".env", filepath.Join("be", ".env")}
	}
	return []string{
		filepath.Join(wd, ".env"),
		filepath.Join(wd, "be", ".env"),
	}
}

func parseEnvFile(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)
		if key == "" {
			continue
		}
		if _, exists := os.LookupEnv(key); exists {
			continue
		}
		if err := os.Setenv(key, value); err != nil {
			return err
		}
	}
	return nil
}
