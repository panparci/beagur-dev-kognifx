package store

import (
	"context"
	"errors"

	"bea-guru-api/internal/domain/user"

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

func (s *Store) RejectPendingUser(ctx context.Context, userID string) (bool, error) {
	if err := s.requireDB(); err != nil {
		return false, err
	}
	uid, err := parseUUID(userID)
	if err != nil {
		return false, err
	}
	tag, err := s.pool.Exec(ctx, `
		UPDATE users
		SET is_active = FALSE
		WHERE id = $1 AND account_status = 'PENDING_VERIFICATION' AND is_active = TRUE`,
		uid,
	)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}

func (s *Store) ListPendingAccountApprovals(ctx context.Context) ([]PendingAccountApproval, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `
		SELECT DISTINCT u.id::text, u.email, u.name, r.code, u.account_status::text, u.created_at
		FROM users u
		JOIN user_roles ur ON ur.user_id = u.id
		JOIN roles r ON r.id = ur.role_id
		WHERE u.account_status = 'PENDING_VERIFICATION'
		  AND u.is_active = TRUE
		  AND r.code = $1
		ORDER BY u.created_at ASC, u.name ASC`,
		string(user.RoleValidator),
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]PendingAccountApproval, 0)
	for rows.Next() {
		var row PendingAccountApproval
		if err := rows.Scan(&row.ID, &row.Email, &row.Name, &row.Role, &row.AccountStatus, &row.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
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
