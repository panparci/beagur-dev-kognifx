package store

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
)

type UserContact struct {
	Email string
	Name  string
}

func (s *Store) GetUserContact(ctx context.Context, userID string) (UserContact, error) {
	if err := s.requireDB(); err != nil {
		return UserContact{}, err
	}
	uid, err := parseUUID(userID)
	if err != nil {
		return UserContact{}, err
	}
	var contact UserContact
	err = s.pool.QueryRow(ctx, `
		SELECT email, COALESCE(NULLIF(TRIM(name), ''), email)
		FROM users WHERE id = $1 AND is_active = TRUE`, uid,
	).Scan(&contact.Email, &contact.Name)
	if errors.Is(err, pgx.ErrNoRows) {
		return UserContact{}, ErrNotFound
	}
	return contact, err
}

func (s *Store) GetValidatorContactForInstitution(ctx context.Context, institutionID string) (UserContact, error) {
	if err := s.requireDB(); err != nil {
		return UserContact{}, err
	}
	iid, err := parseUUID(institutionID)
	if err != nil {
		return UserContact{}, err
	}
	var contact UserContact
	err = s.pool.QueryRow(ctx, `
		SELECT u.email, COALESCE(NULLIF(TRIM(u.name), ''), u.email)
		FROM institutions i
		JOIN users u ON u.id = i.validator_user_id AND u.is_active = TRUE
		WHERE i.id = $1`, iid,
	).Scan(&contact.Email, &contact.Name)
	if errors.Is(err, pgx.ErrNoRows) {
		return UserContact{}, ErrNotFound
	}
	return contact, err
}

func (s *Store) ListAdminContacts(ctx context.Context) ([]UserContact, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `
		SELECT DISTINCT u.email, COALESCE(NULLIF(TRIM(u.name), ''), u.email)
		FROM users u
		JOIN user_roles ur ON ur.user_id = u.id
		JOIN roles r ON r.id = ur.role_id
		WHERE r.code = 'ADMIN' AND u.is_active = TRUE
		ORDER BY u.email`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]UserContact, 0)
	for rows.Next() {
		var contact UserContact
		if err := rows.Scan(&contact.Email, &contact.Name); err != nil {
			return nil, err
		}
		out = append(out, contact)
	}
	return out, rows.Err()
}

func (s *Store) GetTeacherContactByProfileID(ctx context.Context, profileID string) (UserContact, TeacherProfile, error) {
	profile, err := s.GetTeacherByID(ctx, profileID)
	if err != nil {
		return UserContact{}, TeacherProfile{}, err
	}
	contact, err := s.GetUserContact(ctx, profile.UserID)
	if err != nil {
		return UserContact{}, profile, err
	}
	return contact, profile, nil
}

func (s *Store) GetTeacherContactByUserID(ctx context.Context, teacherUserID string) (UserContact, error) {
	return s.GetUserContact(ctx, teacherUserID)
}
