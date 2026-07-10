package store

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"bea-guru-api/internal/domain/user"

	"github.com/jackc/pgx/v5"
)

func (s *Store) GetInstitutionByValidatorUserID(ctx context.Context, validatorUserID string) (Institution, error) {
	if err := s.requireDB(); err != nil {
		return Institution{}, err
	}
	uid, err := parseUUID(validatorUserID)
	if err != nil {
		return Institution{}, err
	}
	var inst Institution
	var validatorID *string
	err = s.pool.QueryRow(ctx, `
		SELECT id::text, name, address, validator_user_id::text, created_at, updated_at
		FROM institutions
		WHERE validator_user_id = $1`,
		uid,
	).Scan(&inst.ID, &inst.Name, &inst.Address, &validatorID, &inst.CreatedAt, &inst.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Institution{}, ErrNotFound
	}
	if err != nil {
		return Institution{}, err
	}
	inst.ValidatorUserID = validatorID
	return inst, nil
}

func (s *Store) CreateValidatorInstitution(ctx context.Context, validatorUserID, name, address string) (Institution, error) {
	if err := s.requireDB(); err != nil {
		return Institution{}, err
	}

	name = strings.TrimSpace(name)
	address = strings.TrimSpace(address)
	if name == "" || address == "" {
		return Institution{}, fmt.Errorf("name and address required")
	}

	uid, err := parseUUID(validatorUserID)
	if err != nil {
		return Institution{}, err
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Institution{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var status user.AccountStatus
	var roleCode string
	err = tx.QueryRow(ctx, `
		SELECT u.account_status::text, r.code
		FROM users u
		JOIN user_roles ur ON ur.user_id = u.id
		JOIN roles r ON r.id = ur.role_id
		WHERE u.id = $1 AND u.is_active = TRUE
		LIMIT 1`,
		uid,
	).Scan(&status, &roleCode)
	if errors.Is(err, pgx.ErrNoRows) {
		return Institution{}, ErrNotFound
	}
	if err != nil {
		return Institution{}, err
	}
	if roleCode != string(user.RoleValidator) || status != user.AccountStatusActive {
		return Institution{}, ErrForbidden
	}

	var existing int
	if err := tx.QueryRow(ctx, `
		SELECT COUNT(*) FROM institutions WHERE validator_user_id = $1`, uid,
	).Scan(&existing); err != nil {
		return Institution{}, err
	}
	if existing > 0 {
		return Institution{}, ErrInvalidState
	}

	var inst Institution
	vid := validatorUserID
	inst.ValidatorUserID = &vid
	err = tx.QueryRow(ctx, `
		INSERT INTO institutions (name, address, validator_user_id)
		VALUES ($1, $2, $3)
		RETURNING id::text, created_at, updated_at`,
		name, address, uid,
	).Scan(&inst.ID, &inst.CreatedAt, &inst.UpdatedAt)
	if err != nil {
		return Institution{}, err
	}
	inst.Name = name
	inst.Address = address

	if err := tx.Commit(ctx); err != nil {
		return Institution{}, err
	}
	return inst, nil
}
