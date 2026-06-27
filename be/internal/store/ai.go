package store

import (
	"context"
	"strings"
	"time"
)

type RagDocument struct {
	ID       string    `json:"id"`
	Title    string    `json:"title"`
	Content  string    `json:"content"`
	Category string    `json:"category"`
	Tags     []string  `json:"tags,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

type AiChatMessage struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
}

type AiLogEntry struct {
	ID         string    `json:"id"`
	UserID     string    `json:"userId"`
	Username   string    `json:"username"`
	Model      string    `json:"model"`
	Action     string    `json:"action"`
	TokensUsed int32     `json:"tokensUsed"`
	Cost       float64   `json:"cost"`
	Timestamp  time.Time `json:"timestamp"`
}

func (s *Store) ListRagDocuments(ctx context.Context) ([]RagDocument, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `
		SELECT id::text, title, content, category, tags, created_at
		FROM rag_documents ORDER BY title`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out = make([]RagDocument, 0)
	for rows.Next() {
		var d RagDocument
		if err := rows.Scan(&d.ID, &d.Title, &d.Content, &d.Category, &d.Tags, &d.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

func (s *Store) SearchRagDocuments(ctx context.Context, query string, topK int) ([]RagDocument, error) {
	docs, err := s.ListRagDocuments(ctx)
	if err != nil {
		return nil, err
	}
	if query == "" {
		if topK > len(docs) {
			topK = len(docs)
		}
		return docs[:topK], nil
	}

	type ranked struct {
		doc   RagDocument
		score int
	}
	terms := strings.Fields(strings.ToLower(query))
	var rankedDocs []ranked
	for _, doc := range docs {
		score := 0
		titleLower := strings.ToLower(doc.Title)
		contentLower := strings.ToLower(doc.Content)
		for _, term := range terms {
			if len(term) <= 2 {
				continue
			}
			if strings.Contains(titleLower, term) {
				score += 10
			}
			if strings.Contains(contentLower, term) {
				score += 2
			}
			for _, tag := range doc.Tags {
				if strings.Contains(strings.ToLower(tag), term) {
					score += 5
				}
			}
		}
		if score > 0 {
			rankedDocs = append(rankedDocs, ranked{doc: doc, score: score})
		}
	}
	for i := 0; i < len(rankedDocs); i++ {
		for j := i + 1; j < len(rankedDocs); j++ {
			if rankedDocs[j].score > rankedDocs[i].score {
				rankedDocs[i], rankedDocs[j] = rankedDocs[j], rankedDocs[i]
			}
		}
	}
	if topK > len(rankedDocs) {
		topK = len(rankedDocs)
	}
	out := make([]RagDocument, topK)
	for i := 0; i < topK; i++ {
		out[i] = rankedDocs[i].doc
	}
	return out, nil
}

func (s *Store) ListAiMemory(ctx context.Context, userID string) ([]AiChatMessage, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	uid, err := parseUUID(userID)
	if err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `
		SELECT id::text, user_id::text, role, content, created_at
		FROM ai_chat_messages WHERE user_id = $1
		ORDER BY created_at ASC`, uid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out = make([]AiChatMessage, 0)
	for rows.Next() {
		var m AiChatMessage
		if err := rows.Scan(&m.ID, &m.UserID, &m.Role, &m.Content, &m.Timestamp); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (s *Store) AppendAiMemory(ctx context.Context, userID, role, content string) (AiChatMessage, error) {
	if err := s.requireDB(); err != nil {
		return AiChatMessage{}, err
	}
	uid, err := parseUUID(userID)
	if err != nil {
		return AiChatMessage{}, err
	}
	var m AiChatMessage
	err = s.pool.QueryRow(ctx, `
		INSERT INTO ai_chat_messages (user_id, role, content)
		VALUES ($1, $2, $3)
		RETURNING id::text, user_id::text, role, content, created_at`,
		uid, role, content,
	).Scan(&m.ID, &m.UserID, &m.Role, &m.Content, &m.Timestamp)
	return m, err
}

func (s *Store) ClearAiMemory(ctx context.Context, userID string) error {
	if err := s.requireDB(); err != nil {
		return err
	}
	uid, err := parseUUID(userID)
	if err != nil {
		return err
	}
	_, err = s.pool.Exec(ctx, `DELETE FROM ai_chat_messages WHERE user_id = $1`, uid)
	return err
}

func (s *Store) ListAiLogs(ctx context.Context, userID string) ([]AiLogEntry, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	uid, err := parseUUID(userID)
	if err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `
		SELECT id::text, user_id::text, username, model, action, tokens_used, cost::float8, created_at
		FROM ai_logs WHERE user_id = $1
		ORDER BY created_at DESC`, uid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out = make([]AiLogEntry, 0)
	for rows.Next() {
		var l AiLogEntry
		if err := rows.Scan(&l.ID, &l.UserID, &l.Username, &l.Model, &l.Action, &l.TokensUsed, &l.Cost, &l.Timestamp); err != nil {
			return nil, err
		}
		out = append(out, l)
	}
	return out, rows.Err()
}

func (s *Store) CreateAiLog(ctx context.Context, entry AiLogEntry) (AiLogEntry, error) {
	if err := s.requireDB(); err != nil {
		return AiLogEntry{}, err
	}
	uid, err := parseUUID(entry.UserID)
	if err != nil {
		return AiLogEntry{}, err
	}
	var out AiLogEntry
	err = s.pool.QueryRow(ctx, `
		INSERT INTO ai_logs (user_id, username, model, action, tokens_used, cost)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id::text, user_id::text, username, model, action, tokens_used, cost::float8, created_at`,
		uid, entry.Username, entry.Model, entry.Action, entry.TokensUsed, entry.Cost,
	).Scan(&out.ID, &out.UserID, &out.Username, &out.Model, &out.Action, &out.TokensUsed, &out.Cost, &out.Timestamp)
	return out, err
}
