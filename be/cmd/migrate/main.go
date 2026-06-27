package main

import (
	"database/sql"
	"fmt"
	"os"

	"bea-guru-api/internal/config"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

const migrationDir = "migrations"

func main() {
	config.LoadDotEnv()
	if len(os.Args) < 2 {
		exitf("usage: go run ./cmd/migrate <up|down|status>")
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		exitf("DATABASE_URL is required")
	}

	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		exitf("open database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		exitf("connect database: %v", err)
	}

	command := os.Args[1]
	if err := goose.SetDialect("postgres"); err != nil {
		exitf("set goose dialect: %v", err)
	}

	switch command {
	case "up":
		err = goose.Up(db, migrationDir)
	case "down":
		err = goose.Down(db, migrationDir)
	case "status":
		err = goose.Status(db, migrationDir)
	default:
		exitf("unsupported migration command %q", command)
	}
	if err != nil {
		exitf("migration %s failed: %v", command, err)
	}
}

func exitf(format string, args ...any) {
	_, _ = fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}
