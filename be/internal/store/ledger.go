package store

import (
	"context"
	"strings"
	"time"
)

type LedgerEntry struct {
	ID          string    `json:"id"`
	Type        string    `json:"type"`
	Description string    `json:"description"`
	Amount      int64     `json:"amount"`
	OccurredAt  time.Time `json:"occurredAt"`
	Source      string    `json:"source,omitempty"`
}

func (s *Store) ListLedger(ctx context.Context) ([]LedgerEntry, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `
		SELECT id, entry_type, description, amount, occurred_at, source FROM (
			SELECT id::text, entry_type::text, description, amount, occurred_at, 'ledger'::text AS source
			FROM ledger_entries
			UNION ALL
			SELECT
				d.id::text,
				'IN',
				'Donasi dari ' || u.name,
				d.amount,
				d.created_at,
				'donation'
			FROM donations d
			JOIN users u ON u.id = d.donor_user_id
		) combined
		ORDER BY occurred_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]LedgerEntry, 0)
	for rows.Next() {
		var e LedgerEntry
		if err := rows.Scan(&e.ID, &e.Type, &e.Description, &e.Amount, &e.OccurredAt, &e.Source); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

type DisbursementInput struct {
	TeacherProfileID string
	Amount           int64
	Description      string
}

func (s *Store) CreateDisbursement(ctx context.Context, in DisbursementInput) (LedgerEntry, error) {
	if err := s.requireDB(); err != nil {
		return LedgerEntry{}, err
	}
	if in.Amount <= 0 {
		return LedgerEntry{}, ErrInvalidState
	}
	tid, err := parseUUID(in.TeacherProfileID)
	if err != nil {
		return LedgerEntry{}, err
	}
	desc := strings.TrimSpace(in.Description)
	if desc == "" {
		desc = "Penyaluran dana Bea Guru"
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return LedgerEntry{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var entry LedgerEntry
	err = tx.QueryRow(ctx, `
		INSERT INTO ledger_entries (entry_type, description, amount, teacher_profile_id)
		VALUES ('OUT', $1, $2, $3)
		RETURNING id::text, entry_type::text, description, amount, occurred_at`,
		desc, in.Amount, tid,
	).Scan(&entry.ID, &entry.Type, &entry.Description, &entry.Amount, &entry.OccurredAt)
	if err != nil {
		return LedgerEntry{}, err
	}
	entry.Source = "ledger"

	_, err = tx.Exec(ctx, `
		UPDATE teacher_profiles
		SET total_received_count = total_received_count + 1,
		    total_received_amount = total_received_amount + $2
		WHERE id = $1`, tid, in.Amount)
	if err != nil {
		return LedgerEntry{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return LedgerEntry{}, err
	}
	return entry, nil
}

func (s *Store) ListPublicTeachers(ctx context.Context) ([]TeacherProfile, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, teacherSelect+`
		WHERE tp.status = 'APPROVED' AND tp.is_published = TRUE
		ORDER BY tp.full_name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]TeacherProfile, 0)
	for rows.Next() {
		t, err := scanTeacher(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, maskTeacherForPublic(t))
	}
	return out, rows.Err()
}
