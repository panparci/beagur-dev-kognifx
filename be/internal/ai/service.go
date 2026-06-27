package ai

import (
	"context"
	"fmt"
	"strings"

	"bea-guru-api/internal/store"
)

type Service struct {
	Store    *store.Store
	APIKey   string
	Models   []string
	SiteURL  string
	AppTitle string
}

type ChatResponse struct {
	Text       string   `json:"text"`
	ModelUsed  string   `json:"modelUsed"`
	SourceDocs []string `json:"sourceDocs,omitempty"`
}

func (s *Service) Chat(ctx context.Context, userID, username, message, model string, useRag bool) (ChatResponse, error) {
	history, err := s.Store.ListAiMemory(ctx, userID)
	if err != nil {
		return ChatResponse{}, err
	}

	ragContext := ""
	var sourceDocs []string
	if useRag {
		docs, err := s.Store.SearchRagDocuments(ctx, message, 2)
		if err != nil {
			return ChatResponse{}, err
		}
		ragContext, sourceDocs = BuildRagContext(docs)
	}

	_, _ = s.Store.AppendAiMemory(ctx, userID, "user", message)

	historyLines := make([]string, 0, 8)
	start := 0
	if len(history) > 8 {
		start = len(history) - 8
	}
	for _, h := range history[start:] {
		role := "User"
		if h.Role == "model" {
			role = "Asisten"
		}
		historyLines = append(historyLines, fmt.Sprintf("%s: %s", role, h.Content))
	}

	if ragContext == "" {
		ragContext = "Tidak ada dokumen pendukung khusus untuk pertanyaan ini."
	}

	prompt := fmt.Sprintf(`Anda adalah Asisten Virtual Yayasan Bea Guru Indonesia yang ramah, sopan, dan solutif.
Gunakan data dokumen Bea Guru berikut jika tersedia:
---
%s
---
Riwayat chat:
%s

Jawab pertanyaan user terakhir dengan ringkas, profesional, dan empatik dalam Bahasa Indonesia.

User: %s`, ragContext, strings.Join(historyLines, "\n"), message)

	var result GenerateResult
	if s.APIKey != "" {
		result, err = GenerateWithFallback(ctx, s.APIKey, s.orderedModels(model), prompt, s.SiteURL, s.AppTitle)
		if err != nil {
			result = FallbackChat(message, ragContext)
		}
	} else {
		result = FallbackChat(message, ragContext)
	}

	_, _ = s.Store.AppendAiMemory(ctx, userID, "model", result.Text)
	_ = s.logAction(ctx, userID, username, result, useRagAction(useRag))

	modelUsed := result.Model
	if s.APIKey == "" {
		modelUsed = "Local Grounded Model (Offline-ready)"
	}

	return ChatResponse{
		Text:       result.Text,
		ModelUsed:  modelUsed,
		SourceDocs: sourceDocs,
	}, nil
}

func (s *Service) AssistForm(ctx context.Context, userID, username, jobTitle string, years int, salary int64, draft string) (ChatResponse, error) {
	prompt := fmt.Sprintf(`Rapikan dan kembangkan tulisan pengajuan bantuan guru honorer berikut menjadi cerita yang menyentuh dalam 2-3 paragraf.
Jabatan: %s
Lama mengabdi: %d tahun
Gaji: Rp %s
Draft: "%s"`, jobTitle, years, formatIDR(salary), draft)

	return s.assist(ctx, userID, username, prompt, "assistance", func() string {
		return FallbackStory(jobTitle, years, salary, draft)
	})
}

func (s *Service) AssistReport(ctx context.Context, userID, username, subject, progress, benefit string) (ChatResponse, error) {
	prompt := fmt.Sprintf(`Rangkai jawaban guru menjadi laporan bulanan 1-2 paragraf yang tulus dan menyentuh.
Kegiatan: "%s"
Respons siswa: "%s"
Manfaat donasi: "%s"`, subject, progress, benefit)

	return s.assist(ctx, userID, username, prompt, "assistance", func() string {
		return FallbackReport(subject, progress, benefit)
	})
}

func (s *Service) Summarize(ctx context.Context, userID, username, content string) (ChatResponse, error) {
	prompt := fmt.Sprintf(`Berikan ringkasan eksekutif 2 kalimat mengenai laporan dampak guru berikut:

"%s"`, content)

	resp, err := s.assist(ctx, userID, username, prompt, "summarization", func() string {
		if len(content) > 120 {
			return content[:117] + "..."
		}
		return content
	})
	return resp, err
}

func (s *Service) assist(ctx context.Context, userID, username, prompt, action string, fallback func() string) (ChatResponse, error) {
	var result GenerateResult
	var err error
	if s.APIKey != "" {
		result, err = GenerateWithFallback(ctx, s.APIKey, s.orderedModels(""), prompt, s.SiteURL, s.AppTitle)
		if err != nil {
			text := fallback()
			result = GenerateResult{Text: text, InputTokens: estimateTokens(prompt), OutputTokens: estimateTokens(text), Model: "mock-local-model"}
		}
	} else {
		text := fallback()
		result = GenerateResult{Text: text, InputTokens: estimateTokens(prompt), OutputTokens: estimateTokens(text), Model: "mock-local-model"}
	}

	_ = s.logAction(ctx, userID, username, result, action)

	modelUsed := result.Model
	if s.APIKey == "" {
		modelUsed = "Local Smart Templates"
	}

	return ChatResponse{Text: result.Text, ModelUsed: modelUsed}, nil
}

func (s *Service) orderedModels(requested string) []string {
	models := sanitizeModels(s.Models)
	requested = strings.TrimSpace(requested)
	if requested == "" || !containsModel(models, requested) {
		return models
	}

	ordered := []string{requested}
	for _, model := range models {
		if model != requested {
			ordered = append(ordered, model)
		}
	}
	return ordered
}

func sanitizeModels(models []string) []string {
	out := make([]string, 0, len(models))
	seen := map[string]bool{}
	for _, model := range models {
		model = strings.TrimSpace(model)
		if model == "" || seen[model] {
			continue
		}
		seen[model] = true
		out = append(out, model)
	}
	return out
}

func containsModel(models []string, needle string) bool {
	for _, model := range models {
		if model == needle {
			return true
		}
	}
	return false
}

func useRagAction(useRag bool) string {
	if useRag {
		return "ragSearch"
	}
	return "chat"
}

func (s *Service) logAction(ctx context.Context, userID, username string, result GenerateResult, action string) error {
	_, err := s.Store.CreateAiLog(ctx, store.AiLogEntry{
		UserID:     userID,
		Username:   username,
		Model:      result.Model,
		Action:     action,
		TokensUsed: int32(result.InputTokens + result.OutputTokens),
		Cost:       0,
	})
	return err
}
