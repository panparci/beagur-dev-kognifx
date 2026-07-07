package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"bea-guru-api/internal/config"
	"bea-guru-api/internal/db"
	httpRouter "bea-guru-api/internal/http/router"
)

func main() {
	config.LoadDotEnv()
	cfg := config.Load()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: cfg.LogLevel,
	}))

	if strings.TrimSpace(cfg.DatabaseURL) == "" {
		logger.Error("DATABASE_URL is required — copy be/.env.example to be/.env and set postgres URL")
		os.Exit(1)
	}
	if err := os.MkdirAll(cfg.UploadDir, 0o755); err != nil {
		logger.Error("upload dir init failed", "dir", cfg.UploadDir, "error", err)
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := db.Open(ctx, cfg.DatabaseURL, db.PoolOptions{
		MaxConns: cfg.DBMaxConns,
		MinConns: cfg.DBMinConns,
	})
	if err != nil {
		logger.Error("database init failed", "error", err)
		os.Exit(1)
	}
	if pool != nil {
		defer pool.Close()
	}

	engine := httpRouter.New(httpRouter.Dependencies{
		Config: cfg,
		Logger: logger,
		DB:     pool,
	})

	server := &http.Server{
		Addr:              cfg.HTTPAddr(),
		Handler:           engine,
		ReadHeaderTimeout: cfg.ReadHeaderTimeout,
		ReadTimeout:       cfg.ReadTimeout,
		WriteTimeout:      cfg.WriteTimeout,
		IdleTimeout:       cfg.IdleTimeout,
	}

	go func() {
		logger.Info("api listening", "addr", server.Addr, "env", cfg.AppEnv)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	stop()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("graceful shutdown failed", "error", err)
		os.Exit(1)
	}

	logger.Info("api stopped")
}
