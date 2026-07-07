package store

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
)

var ErrConflict = errors.New("conflict")

func generateInvoiceNumber(amount int64) string {
	var suffix [3]byte
	_, _ = rand.Read(suffix[:])
	return fmt.Sprintf("BG-%s-%s-%d", time.Now().Format("20060102"), hex.EncodeToString(suffix[:]), amount)
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func (s *Store) userHasRole(ctx context.Context, userID uuid.UUID, roleCode string) (bool, error) {
	var ok bool
	err := s.pool.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM user_roles ur
			JOIN roles r ON r.id = ur.role_id
			WHERE ur.user_id = $1 AND r.code = $2
		)`, userID, roleCode).Scan(&ok)
	return ok, err
}

func (s *Store) ensureDonorRole(ctx context.Context, userID uuid.UUID) error {
	has, err := s.userHasRole(ctx, userID, "DONOR")
	if err != nil {
		return err
	}
	if has {
		return nil
	}
	_, err = s.pool.Exec(ctx, `
		INSERT INTO user_roles (user_id, role_id)
		SELECT $1, r.id FROM roles r WHERE r.code = 'DONOR'
		ON CONFLICT DO NOTHING`, userID)
	return err
}

func (s *Store) assertDonor(ctx context.Context, userID uuid.UUID) error {
	ok, err := s.userHasRole(ctx, userID, "DONOR")
	if err != nil {
		return err
	}
	if !ok {
		return ErrForbidden
	}
	return nil
}

func (s *Store) assertTeacherReceivable(ctx context.Context, teacherProfileID uuid.UUID) error {
	var ok bool
	err := s.pool.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM teacher_profiles
			WHERE id = $1 AND status = 'APPROVED' AND is_published = TRUE
		)`, teacherProfileID).Scan(&ok)
	if err != nil {
		return err
	}
	if !ok {
		return ErrInvalidState
	}
	return nil
}

func normalizeDonationType(t string) (string, error) {
	switch strings.ToUpper(strings.TrimSpace(t)) {
	case "", "ONE_TIME":
		return "ONE_TIME", nil
	case "RECURRING":
		return "RECURRING", nil
	default:
		return "", ErrInvalidState
	}
}

func validateProofURL(raw string) error {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	if strings.HasPrefix(raw, "/api/v1/files/") {
		return nil
	}
	if strings.HasPrefix(raw, "https://") || strings.HasPrefix(raw, "http://") {
		return nil
	}
	return ErrInvalidState
}

const maxDonationAmount int64 = 1_000_000_000 // Rp 1 miliar per transaksi

func validateDonationAmount(amount int64) error {
	if amount <= 0 {
		return ErrInvalidState
	}
	if amount > maxDonationAmount {
		return ErrInvalidState
	}
	return nil
}

func requireDonorProofURL(raw string) error {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ErrInvalidState
	}
	return validateProofURL(raw)
}
