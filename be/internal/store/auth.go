package store

import (
	"context"
	"errors"
	"strings"
	"time"

	"bea-guru-api/internal/domain/user"

	"github.com/jackc/pgx/v5"
)

const sessionCookieName = "bea_guru_sid"

func (s *Store) CreateSession(ctx context.Context, userID string, ttl time.Duration) (string, error) {
	if err := s.requireDB(); err != nil {
		return "", err
	}
	uid, err := parseUUID(userID)
	if err != nil {
		return "", err
	}
	var sid string
	expiresAt := time.Now().Add(ttl)
	err = s.pool.QueryRow(ctx, `
		INSERT INTO user_sessions (user_id, expires_at)
		VALUES ($1, $2)
		RETURNING id::text`,
		uid, expiresAt,
	).Scan(&sid)
	return sid, err
}

func (s *Store) DeleteSession(ctx context.Context, sessionID string) error {
	if err := s.requireDB(); err != nil {
		return err
	}
	sid, err := parseUUID(sessionID)
	if err != nil {
		return err
	}
	_, err = s.pool.Exec(ctx, `DELETE FROM user_sessions WHERE id = $1`, sid)
	return err
}

func (s *Store) UserFromSession(ctx context.Context, sessionID string) (user.CurrentUser, error) {
	if err := s.requireDB(); err != nil {
		return user.CurrentUser{}, err
	}
	sid, err := parseUUID(sessionID)
	if err != nil {
		return user.CurrentUser{}, err
	}

	var current user.CurrentUser
	var roleCodes []string
	var permCodes []string
	var accountStatus user.AccountStatus
	err = s.pool.QueryRow(ctx, `
		SELECT
			u.id::text,
			u.email,
			u.name,
			u.account_status::text,
			COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}'),
			COALESCE(array_agg(DISTINCT p.code) FILTER (WHERE p.code IS NOT NULL), '{}')
		FROM user_sessions s
		JOIN users u ON u.id = s.user_id AND u.is_active = TRUE
		LEFT JOIN user_roles ur ON ur.user_id = u.id
		LEFT JOIN roles r ON r.id = ur.role_id
		LEFT JOIN role_permissions rp ON rp.role_id = r.id
		LEFT JOIN permissions p ON p.id = rp.permission_id
		WHERE s.id = $1 AND s.expires_at > NOW()
		GROUP BY u.id, u.email, u.name, u.account_status`,
		sid,
	).Scan(&current.ID, &current.Email, &current.Name, &accountStatus, &roleCodes, &permCodes)
	if errors.Is(err, pgx.ErrNoRows) {
		return user.CurrentUser{}, ErrNotFound
	}
	if err != nil {
		return user.CurrentUser{}, err
	}

	current.Roles = make([]user.Role, 0, len(roleCodes))
	for _, code := range roleCodes {
		if code != "" {
			current.Roles = append(current.Roles, user.Role(code))
		}
	}
	if len(current.Roles) > 0 {
		current.Role = current.Roles[0]
	}
	current.AccountStatus = accountStatus
	current.Permissions = permCodes
	return current, nil
}

func (s *Store) GetUserByEmail(ctx context.Context, email string) (user.CurrentUser, error) {
	if err := s.requireDB(); err != nil {
		return user.CurrentUser{}, err
	}
	normalized := strings.ToLower(strings.TrimSpace(email))
	if normalized == "" {
		return user.CurrentUser{}, ErrNotFound
	}
	var userID string
	err := s.pool.QueryRow(ctx, `
		SELECT id::text FROM users
		WHERE LOWER(email) = $1 AND is_active = TRUE`,
		normalized,
	).Scan(&userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return user.CurrentUser{}, ErrNotFound
	}
	if err != nil {
		return user.CurrentUser{}, err
	}
	return s.GetCurrentUser(ctx, userID)
}

func (s *Store) GetDevUserByRole(ctx context.Context, roleCode string) (user.CurrentUser, error) {
	if err := s.requireDB(); err != nil {
		return user.CurrentUser{}, err
	}
	var userID string
	err := s.pool.QueryRow(ctx, `
		SELECT u.id::text
		FROM users u
		JOIN user_roles ur ON ur.user_id = u.id
		JOIN roles r ON r.id = ur.role_id
		WHERE r.code = $1 AND u.is_active = TRUE
		ORDER BY u.email
		LIMIT 1`, roleCode,
	).Scan(&userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return user.CurrentUser{}, ErrNotFound
	}
	if err != nil {
		return user.CurrentUser{}, err
	}
	return s.GetCurrentUser(ctx, userID)
}

func (s *Store) GetCurrentUser(ctx context.Context, userID string) (user.CurrentUser, error) {
	if err := s.requireDB(); err != nil {
		return user.CurrentUser{}, err
	}
	uid, err := parseUUID(userID)
	if err != nil {
		return user.CurrentUser{}, err
	}

	var current user.CurrentUser
	err = s.pool.QueryRow(ctx, `
		SELECT id::text, email, name, account_status::text FROM users WHERE id = $1 AND is_active = TRUE`,
		uid,
	).Scan(&current.ID, &current.Email, &current.Name, &current.AccountStatus)
	if errors.Is(err, pgx.ErrNoRows) {
		return user.CurrentUser{}, ErrNotFound
	}
	if err != nil {
		return user.CurrentUser{}, err
	}

	rows, err := s.pool.Query(ctx, `
		SELECT r.code FROM roles r
		JOIN user_roles ur ON ur.role_id = r.id
		WHERE ur.user_id = $1
		ORDER BY r.code`, uid)
	if err != nil {
		return user.CurrentUser{}, err
	}
	defer rows.Close()

	current.Roles = make([]user.Role, 0)
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err != nil {
			return user.CurrentUser{}, err
		}
		current.Roles = append(current.Roles, user.Role(code))
	}
	if err := rows.Err(); err != nil {
		return user.CurrentUser{}, err
	}
	if len(current.Roles) > 0 {
		current.Role = current.Roles[0]
	}

	if len(current.Roles) == 0 {
		current.Permissions = []string{}
		return current, nil
	}

	permRows, err := s.pool.Query(ctx, `
		SELECT DISTINCT p.code
		FROM permissions p
		JOIN role_permissions rp ON rp.permission_id = p.id
		JOIN user_roles ur ON ur.role_id = rp.role_id
		WHERE ur.user_id = $1
		ORDER BY p.code`, uid)
	if err != nil {
		return user.CurrentUser{}, err
	}
	defer permRows.Close()

	current.Permissions = make([]string, 0)
	for permRows.Next() {
		var code string
		if err := permRows.Scan(&code); err != nil {
			return user.CurrentUser{}, err
		}
		current.Permissions = append(current.Permissions, code)
	}
	return current, permRows.Err()
}

func SessionCookieName() string {
	return sessionCookieName
}
