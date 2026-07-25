package store

import (
	"context"
	"strings"
	"time"
)

type UserNotification struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	LinkTab   string    `json:"linkTab"`
	IsRead    bool      `json:"isRead"`
	CreatedAt time.Time `json:"createdAt"`
}

func (s *Store) CreateUserNotification(ctx context.Context, userID, typ, title, body, linkTab string) error {
	if err := s.requireDB(); err != nil {
		return err
	}
	_, err := s.pool.Exec(ctx, `
		INSERT INTO user_notifications (user_id, type, title, body, link_tab)
		VALUES ($1::uuid, $2, $3, $4, $5)`,
		userID, strings.TrimSpace(typ), strings.TrimSpace(title), strings.TrimSpace(body), strings.TrimSpace(linkTab),
	)
	return err
}

func (s *Store) ListMyNotifications(ctx context.Context, userID string, limit int) ([]UserNotification, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	if limit <= 0 || limit > 100 {
		limit = 30
	}
	rows, err := s.pool.Query(ctx, `
		SELECT id::text, user_id::text, type, title, body, link_tab, is_read, created_at
		FROM user_notifications
		WHERE user_id = $1::uuid
		ORDER BY created_at DESC
		LIMIT $2`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]UserNotification, 0)
	for rows.Next() {
		var n UserNotification
		if err := rows.Scan(&n.ID, &n.UserID, &n.Type, &n.Title, &n.Body, &n.LinkTab, &n.IsRead, &n.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, n)
	}
	return out, rows.Err()
}

func (s *Store) MarkNotificationRead(ctx context.Context, userID, notificationID string) error {
	if err := s.requireDB(); err != nil {
		return err
	}
	tag, err := s.pool.Exec(ctx, `
		UPDATE user_notifications SET is_read = TRUE
		WHERE id = $1::uuid AND user_id = $2::uuid`, notificationID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) MarkAllNotificationsRead(ctx context.Context, userID string) error {
	if err := s.requireDB(); err != nil {
		return err
	}
	_, err := s.pool.Exec(ctx, `
		UPDATE user_notifications SET is_read = TRUE
		WHERE user_id = $1::uuid AND is_read = FALSE`, userID)
	return err
}

func (s *Store) CountUnreadNotifications(ctx context.Context, userID string) (int, error) {
	if err := s.requireDB(); err != nil {
		return 0, err
	}
	var n int
	err := s.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM user_notifications
		WHERE user_id = $1::uuid AND is_read = FALSE`, userID).Scan(&n)
	return n, err
}
