package store

import (
	"context"
	"encoding/json"
	"time"
)

type AdminAuditLog struct {
	ID          string         `json:"id"`
	ActorUserID string         `json:"actorUserId"`
	ActorName   string         `json:"actorName"`
	Action      string         `json:"action"`
	EntityType  string         `json:"entityType"`
	EntityID    string         `json:"entityId"`
	Detail      map[string]any `json:"detail"`
	CreatedAt   time.Time      `json:"createdAt"`
}

func (s *Store) LogAdminAction(ctx context.Context, actorUserID, action, entityType, entityID string, detail map[string]any) error {
	if err := s.requireDB(); err != nil {
		return err
	}
	uid, err := parseUUID(actorUserID)
	if err != nil {
		return err
	}
	if detail == nil {
		detail = map[string]any{}
	}
	payload, err := json.Marshal(detail)
	if err != nil {
		return err
	}
	_, err = s.pool.Exec(ctx, `
		INSERT INTO admin_audit_logs (actor_user_id, action, entity_type, entity_id, detail)
		VALUES ($1, $2, $3, $4, $5::jsonb)`,
		uid, action, entityType, entityID, payload,
	)
	return err
}

func (s *Store) ListAdminAuditLogs(ctx context.Context, limit int) ([]AdminAuditLog, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	rows, err := s.pool.Query(ctx, `
		SELECT l.id::text, l.actor_user_id::text, COALESCE(u.name, ''),
		       l.action, l.entity_type, l.entity_id, l.detail, l.created_at
		FROM admin_audit_logs l
		LEFT JOIN users u ON u.id = l.actor_user_id
		ORDER BY l.created_at DESC
		LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]AdminAuditLog, 0)
	for rows.Next() {
		var item AdminAuditLog
		var detailJSON []byte
		if err := rows.Scan(
			&item.ID, &item.ActorUserID, &item.ActorName,
			&item.Action, &item.EntityType, &item.EntityID, &detailJSON, &item.CreatedAt,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(detailJSON, &item.Detail)
		if item.Detail == nil {
			item.Detail = map[string]any{}
		}
		out = append(out, item)
	}
	return out, rows.Err()
}
