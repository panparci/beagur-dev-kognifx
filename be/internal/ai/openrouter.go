package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type GenerateResult struct {
	Text         string
	InputTokens  int
	OutputTokens int
	Model        string
}

func Generate(ctx context.Context, apiKey, model, prompt, siteURL, appTitle string) (GenerateResult, error) {
	if apiKey == "" {
		return GenerateResult{}, fmt.Errorf("openrouter api key not configured")
	}

	targetModel := model
	if targetModel == "" {
		return GenerateResult{}, fmt.Errorf("openrouter model is required")
	}

	body := map[string]any{
		"model": targetModel,
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
		"temperature": 0.7,
		"max_tokens":  1000,
	}
	payload, _ := json.Marshal(body)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://openrouter.ai/api/v1/chat/completions", bytes.NewReader(payload))
	if err != nil {
		return GenerateResult{}, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)
	if siteURL != "" {
		req.Header.Set("HTTP-Referer", siteURL)
	}
	if appTitle != "" {
		req.Header.Set("X-Title", appTitle)
	}

	client := &http.Client{Timeout: 45 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return GenerateResult{}, err
	}
	defer res.Body.Close()

	raw, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 400 {
		return GenerateResult{}, fmt.Errorf("openrouter model %s status %d: %s", targetModel, res.StatusCode, string(raw))
	}

	var parsed struct {
		Model   string `json:"model"`
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Usage struct {
			PromptTokens     int `json:"prompt_tokens"`
			CompletionTokens int `json:"completion_tokens"`
		} `json:"usage"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return GenerateResult{}, err
	}

	text := ""
	if len(parsed.Choices) > 0 {
		text = parsed.Choices[0].Message.Content
	}
	if strings.TrimSpace(text) == "" {
		return GenerateResult{}, fmt.Errorf("openrouter model %s returned empty response", targetModel)
	}

	inputTokens := parsed.Usage.PromptTokens
	if inputTokens == 0 {
		inputTokens = estimateTokens(prompt)
	}
	outputTokens := parsed.Usage.CompletionTokens
	if outputTokens == 0 {
		outputTokens = estimateTokens(text)
	}
	if parsed.Model != "" {
		targetModel = parsed.Model
	}
	return GenerateResult{
		Text:         text,
		InputTokens:  inputTokens,
		OutputTokens: outputTokens,
		Model:        targetModel,
	}, nil
}

func GenerateWithFallback(ctx context.Context, apiKey string, models []string, prompt, siteURL, appTitle string) (GenerateResult, error) {
	if len(models) == 0 {
		return GenerateResult{}, fmt.Errorf("AI_MODELS is required")
	}
	var lastErr error
	for _, model := range models {
		result, err := Generate(ctx, apiKey, model, prompt, siteURL, appTitle)
		if err == nil {
			return result, nil
		}
		lastErr = err
	}
	if lastErr == nil {
		lastErr = fmt.Errorf("no openrouter models configured")
	}
	return GenerateResult{}, lastErr
}

func estimateTokens(s string) int {
	if s == "" {
		return 0
	}
	return (len(s) + 3) / 4
}

func ContainsAny(text string, terms ...string) bool {
	lower := strings.ToLower(text)
	for _, term := range terms {
		if strings.Contains(lower, strings.ToLower(term)) {
			return true
		}
	}
	return false
}
