package store

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"bea-guru-api/internal/domain/user"

	"github.com/jackc/pgx/v5"
)

var ErrOnboardingNotAllowed = errors.New("onboarding not allowed")

func (s *Store) ChooseOnboardingRole(ctx context.Context, userID string, roleCode string) (user.CurrentUser, error) {
	if err := s.requireDB(); err != nil {
		return user.CurrentUser{}, err
	}

	roleCode = strings.ToUpper(strings.TrimSpace(roleCode))
	switch roleCode {
	case string(user.RoleTeacher), string(user.RoleValidator), string(user.RoleDonor):
	default:
		return user.CurrentUser{}, fmt.Errorf("invalid onboarding role")
	}

	uid, err := parseUUID(userID)
	if err != nil {
		return user.CurrentUser{}, err
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return user.CurrentUser{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var status user.AccountStatus
	err = tx.QueryRow(ctx, `
		SELECT account_status::text FROM users
		WHERE id = $1 AND is_active = TRUE
		FOR UPDATE`,
		uid,
	).Scan(&status)
	if errors.Is(err, pgx.ErrNoRows) {
		return user.CurrentUser{}, ErrNotFound
	}
	if err != nil {
		return user.CurrentUser{}, err
	}
	if status != user.AccountStatusNoRole {
		return user.CurrentUser{}, ErrOnboardingNotAllowed
	}

	var existingRoles int
	err = tx.QueryRow(ctx, `SELECT COUNT(*) FROM user_roles WHERE user_id = $1`, uid).Scan(&existingRoles)
	if err != nil {
		return user.CurrentUser{}, err
	}
	if existingRoles > 0 {
		return user.CurrentUser{}, ErrOnboardingNotAllowed
	}

	var roleID string
	err = tx.QueryRow(ctx, `SELECT id::text FROM roles WHERE code = $1`, roleCode).Scan(&roleID)
	if errors.Is(err, pgx.ErrNoRows) {
		return user.CurrentUser{}, fmt.Errorf("role not found")
	}
	if err != nil {
		return user.CurrentUser{}, err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
		uid, roleID,
	)
	if err != nil {
		return user.CurrentUser{}, err
	}

	nextStatus := user.AccountStatusPendingVerification
	if roleCode == string(user.RoleDonor) {
		nextStatus = user.AccountStatusActive
	}

	_, err = tx.Exec(ctx, `
		UPDATE users SET account_status = $2::account_status WHERE id = $1`,
		uid, nextStatus,
	)
	if err != nil {
		return user.CurrentUser{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return user.CurrentUser{}, err
	}

	return s.GetCurrentUser(ctx, userID)
}
