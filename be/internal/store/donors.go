package store

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
)

type DonorSummary struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	Name          string `json:"name"`
	Phone         string `json:"phone"`
	TotalDonation int64  `json:"totalDonation"`
	DonationCount int64  `json:"donationCount"`
	IsActive      bool   `json:"isActive"`
}

const donationSelect = `
SELECT d.id::text, d.donor_user_id::text, d.teacher_profile_id::text,
       d.amount, d.type::text, d.created_at,
       d.verification_status::text, d.proof_url, d.invoice_number`

func scanDonation(row pgx.Row) (Donation, error) {
	var d Donation
	err := row.Scan(
		&d.ID, &d.DonorUserID, &d.TeacherProfileID,
		&d.Amount, &d.Type, &d.CreatedAt,
		&d.VerificationStatus, &d.ProofURL, &d.InvoiceNumber,
	)
	return d, err
}

func (s *Store) ListDonors(ctx context.Context, includeInactive bool) ([]DonorSummary, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	activeFilter := "AND u.is_active = TRUE"
	if includeInactive {
		activeFilter = ""
	}
	rows, err := s.pool.Query(ctx, `
		SELECT u.id::text, u.email, u.name, COALESCE(u.phone, ''), u.is_active,
		       COALESCE(SUM(d.amount) FILTER (WHERE d.verification_status = 'VERIFIED'), 0),
		       COUNT(d.id) FILTER (WHERE d.verification_status = 'VERIFIED')
		FROM users u
		JOIN user_roles ur ON ur.user_id = u.id
		JOIN roles r ON r.id = ur.role_id AND r.code = 'DONOR'
		LEFT JOIN donations d ON d.donor_user_id = u.id
		WHERE TRUE `+activeFilter+`
		GROUP BY u.id, u.email, u.name, u.phone, u.is_active
		ORDER BY u.name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]DonorSummary, 0)
	for rows.Next() {
		var d DonorSummary
		if err := rows.Scan(&d.ID, &d.Email, &d.Name, &d.Phone, &d.IsActive, &d.TotalDonation, &d.DonationCount); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

func (s *Store) SaveDonor(ctx context.Context, id, email, name, phone string) (DonorSummary, error) {
	if err := s.requireDB(); err != nil {
		return DonorSummary{}, err
	}
	email = strings.TrimSpace(strings.ToLower(email))
	name = strings.TrimSpace(name)
	phone = strings.TrimSpace(phone)
	if email == "" || name == "" {
		return DonorSummary{}, ErrInvalidState
	}

	var donorID string
	if id == "" {
		err := s.pool.QueryRow(ctx, `
			SELECT id::text FROM users WHERE LOWER(email) = $1`, email).Scan(&donorID)
		if errors.Is(err, pgx.ErrNoRows) {
			err = s.pool.QueryRow(ctx, `
				INSERT INTO users (email, name, phone, account_status)
				VALUES ($1, $2, $3, 'ACTIVE')
				RETURNING id::text`, email, name, phone).Scan(&donorID)
			if err != nil {
				return DonorSummary{}, err
			}
		} else if err != nil {
			return DonorSummary{}, err
		} else {
			_, err = s.pool.Exec(ctx, `
				UPDATE users SET name = $2, phone = $3, updated_at = NOW()
				WHERE id = $1`, donorID, name, phone)
			if err != nil {
				return DonorSummary{}, err
			}
		}
		uid, err := parseUUID(donorID)
		if err != nil {
			return DonorSummary{}, err
		}
		if err := s.ensureDonorRole(ctx, uid); err != nil {
			return DonorSummary{}, err
		}
	} else {
		uid, err := parseUUID(id)
		if err != nil {
			return DonorSummary{}, err
		}
		if err := s.assertDonor(ctx, uid); err != nil {
			return DonorSummary{}, err
		}
		err = s.pool.QueryRow(ctx, `
			UPDATE users SET email = $2, name = $3, phone = $4, updated_at = NOW()
			WHERE id = $1
			RETURNING id::text`, uid, email, name, phone).Scan(&donorID)
		if err != nil {
			if isUniqueViolation(err) {
				return DonorSummary{}, ErrConflict
			}
			return DonorSummary{}, err
		}
	}

	donors, err := s.ListDonors(ctx, true)
	if err != nil {
		return DonorSummary{}, err
	}
	for _, d := range donors {
		if d.ID == donorID {
			return d, nil
		}
	}
	return DonorSummary{}, ErrNotFound
}

func (s *Store) ListDonationsAdmin(ctx context.Context) ([]Donation, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, donationSelect+`,
		       u.name, u.email, COALESCE(tp.full_name, '')
		FROM donations d
		JOIN users u ON u.id = d.donor_user_id
		LEFT JOIN teacher_profiles tp ON tp.id = d.teacher_profile_id
		ORDER BY d.created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]Donation, 0)
	for rows.Next() {
		var d Donation
		if err := rows.Scan(
			&d.ID, &d.DonorUserID, &d.TeacherProfileID,
			&d.Amount, &d.Type, &d.CreatedAt,
			&d.VerificationStatus, &d.ProofURL, &d.InvoiceNumber,
			&d.DonorName, &d.DonorEmail, &d.TeacherName,
		); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

func (s *Store) VerifyDonation(ctx context.Context, donationID string, approve bool, invoiceNumber, verifiedBy string) (Donation, error) {
	if err := s.requireDB(); err != nil {
		return Donation{}, err
	}
	did, err := parseUUID(donationID)
	if err != nil {
		return Donation{}, err
	}
	status := "REJECTED"
	if approve {
		status = "VERIFIED"
	}
	invoiceNumber = strings.TrimSpace(invoiceNumber)

	var verifierID any
	if verifiedBy != "" {
		vid, err := parseUUID(verifiedBy)
		if err != nil {
			return Donation{}, err
		}
		verifierID = vid
	}

	var d Donation
	err = s.pool.QueryRow(ctx, `
		UPDATE donations
		SET verification_status = $2::donation_verification_status,
		    invoice_number = CASE WHEN $3 <> '' THEN $3 ELSE invoice_number END,
		    verified_at = NOW(),
		    verified_by = $4
		WHERE id = $1 AND verification_status = 'PENDING'
		RETURNING id::text, donor_user_id::text, teacher_profile_id::text,
		          amount, type::text, created_at,
		          verification_status::text, proof_url, invoice_number`,
		did, status, invoiceNumber, verifierID,
	).Scan(
		&d.ID, &d.DonorUserID, &d.TeacherProfileID,
		&d.Amount, &d.Type, &d.CreatedAt,
		&d.VerificationStatus, &d.ProofURL, &d.InvoiceNumber,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		existing, getErr := s.GetDonationByID(ctx, donationID)
		if getErr != nil {
			return Donation{}, getErr
		}
		if existing.VerificationStatus != "PENDING" {
			return Donation{}, ErrInvalidState
		}
		return Donation{}, ErrNotFound
	}
	if isUniqueViolation(err) {
		return Donation{}, ErrConflict
	}
	return d, err
}

type InvoiceInput struct {
	DonorUserID      string  `json:"donorUserId"`
	Amount           int64   `json:"amount"`
	Type             string  `json:"type"`
	TeacherProfileID *string `json:"teacherProfileId,omitempty"`
	InvoiceNumber    string  `json:"invoiceNumber"`
}

func (s *Store) CreateDonationInvoice(ctx context.Context, in InvoiceInput) (Donation, error) {
	if err := s.requireDB(); err != nil {
		return Donation{}, err
	}
	if err := validateDonationAmount(in.Amount); err != nil {
		return Donation{}, err
	}
	dtype, err := normalizeDonationType(in.Type)
	if err != nil {
		return Donation{}, err
	}
	invoice := strings.TrimSpace(in.InvoiceNumber)
	if invoice == "" {
		invoice = generateInvoiceNumber(in.Amount)
	}
	donorID, err := parseUUID(in.DonorUserID)
	if err != nil {
		return Donation{}, err
	}
	if err := s.assertDonor(ctx, donorID); err != nil {
		return Donation{}, err
	}
	var teacherID any
	if in.TeacherProfileID != nil && *in.TeacherProfileID != "" {
		tid, err := parseUUID(*in.TeacherProfileID)
		if err != nil {
			return Donation{}, err
		}
		if err := s.assertTeacherReceivable(ctx, tid); err != nil {
			return Donation{}, err
		}
		teacherID = tid
	}

	var d Donation
	err = s.pool.QueryRow(ctx, `
		INSERT INTO donations (donor_user_id, teacher_profile_id, amount, type, verification_status, invoice_number)
		VALUES ($1, $2, $3, $4::donation_type, 'PENDING', $5)
		RETURNING id::text, donor_user_id::text, teacher_profile_id::text,
		          amount, type::text, created_at,
		          verification_status::text, proof_url, invoice_number`,
		donorID, teacherID, in.Amount, dtype, invoice,
	).Scan(
		&d.ID, &d.DonorUserID, &d.TeacherProfileID,
		&d.Amount, &d.Type, &d.CreatedAt,
		&d.VerificationStatus, &d.ProofURL, &d.InvoiceNumber,
	)
	if isUniqueViolation(err) {
		return Donation{}, ErrConflict
	}
	return d, err
}

func (s *Store) DeactivateDonor(ctx context.Context, donorID string) error {
	if err := s.requireDB(); err != nil {
		return err
	}
	uid, err := parseUUID(donorID)
	if err != nil {
		return err
	}
	if err := s.assertDonor(ctx, uid); err != nil {
		return err
	}
	tag, err := s.pool.Exec(ctx, `
		UPDATE users SET is_active = FALSE, updated_at = NOW()
		WHERE id = $1 AND is_active = TRUE`, uid)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrInvalidState
	}
	return nil
}

func (s *Store) DonationProofOwner(ctx context.Context, proofURL string) (string, error) {
	if err := s.requireDB(); err != nil {
		return "", err
	}
	proofURL = strings.TrimSpace(proofURL)
	if proofURL == "" {
		return "", ErrNotFound
	}
	var donorID string
	err := s.pool.QueryRow(ctx, `
		SELECT donor_user_id::text FROM donations
		WHERE proof_url = $1
		ORDER BY created_at DESC
		LIMIT 1`, proofURL).Scan(&donorID)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	return donorID, err
}

func (s *Store) GetDonationByID(ctx context.Context, donationID string) (Donation, error) {
	if err := s.requireDB(); err != nil {
		return Donation{}, err
	}
	did, err := parseUUID(donationID)
	if err != nil {
		return Donation{}, err
	}
	row := s.pool.QueryRow(ctx, donationSelect+`
		FROM donations d WHERE d.id = $1`, did)
	d, err := scanDonation(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return Donation{}, ErrNotFound
	}
	return d, err
}
