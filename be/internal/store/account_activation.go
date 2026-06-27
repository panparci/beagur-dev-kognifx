package store

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
)

// ActivatePendingUser sets PENDING_VERIFICATION → ACTIVE. Returns true when status changed.
func (s *Store) ActivatePendingUser(ctx context.Context, userID string) (bool, error) {
	if err := s.requireDB(); err != nil {
		return false, err
	}
	uid, err := parseUUID(userID)
	if err != nil {
		return false, err
	}
	tag, err := s.pool.Exec(ctx, `
		UPDATE users
		SET account_status = 'ACTIVE'::account_status
		WHERE id = $1 AND account_status = 'PENDING_VERIFICATION' AND is_active = TRUE`,
		uid,
	)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}

func (s *Store) GetUserRoleCode(ctx context.Context, userID string) (string, error) {
	if err := s.requireDB(); err != nil {
		return "", err
	}
	uid, err := parseUUID(userID)
	if err != nil {
		return "", err
	}
	var role string
	err = s.pool.QueryRow(ctx, `
		SELECT r.code FROM user_roles ur
		JOIN roles r ON r.id = ur.role_id
		WHERE ur.user_id = $1
		ORDER BY r.code
		LIMIT 1`, uid,
	).Scan(&role)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	return role, err
}
