package store

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

var digitsOnly = regexp.MustCompile(`\D+`)

func normalizeAccount(raw string) string {
	return digitsOnly.ReplaceAllString(raw, "")
}

type BankStatementUpload struct {
	ID               string    `json:"id"`
	FileName         string    `json:"fileName"`
	Direction        string    `json:"direction"`
	UploadedByUserID string    `json:"uploadedByUserId"`
	TotalLines       int       `json:"totalLines"`
	MatchedCount     int       `json:"matchedCount"`
	Status           string    `json:"status"`
	CreatedAt        time.Time `json:"createdAt"`
}

type BankTransactionLine struct {
	ID                   string     `json:"id"`
	UploadID             string     `json:"uploadId"`
	Direction            string     `json:"direction"`
	TransactionDate      string     `json:"transactionDate"`
	Amount               int64      `json:"amount"`
	CounterpartyName     string     `json:"counterpartyName"`
	CounterpartyAccount  string     `json:"counterpartyAccount"`
	Description          string     `json:"description"`
	MatchStatus          string     `json:"matchStatus"`
	MatchedDonationID    *string    `json:"matchedDonationId,omitempty"`
	MatchedLedgerID      *string    `json:"matchedLedgerId,omitempty"`
	SuggestedDonationID  *string    `json:"suggestedDonationId,omitempty"`
	SuggestedLedgerID    *string    `json:"suggestedLedgerId,omitempty"`
	SuggestedDonorUserID *string    `json:"suggestedDonorUserId,omitempty"`
	ReviewedByUserID     *string    `json:"reviewedByUserId,omitempty"`
	ReviewedAt           *time.Time `json:"reviewedAt,omitempty"`
}

type BankLineInput struct {
	TransactionDate     string `json:"transactionDate"`
	Amount              int64  `json:"amount"`
	CounterpartyName    string `json:"counterpartyName"`
	CounterpartyAccount string `json:"counterpartyAccount"`
	Description         string `json:"description"`
}

type CreateBankUploadInput struct {
	FileName         string          `json:"fileName"`
	Direction        string          `json:"direction"`
	UploadedByUserID string          `json:"-"`
	Lines            []BankLineInput `json:"lines"`
}

type pendingDonationMatch struct {
	ID          string
	DonorUserID string
	Amount      int64
	CreatedAt   time.Time
}

type outLedgerMatch struct {
	ID                string
	Amount            int64
	OccurredAt        time.Time
	TeacherAccount    string
	TeacherProfileID  string
}

func (s *Store) ListBankUploads(ctx context.Context) ([]BankStatementUpload, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `
		SELECT id::text, file_name, direction, uploaded_by_user_id::text,
		       total_lines, matched_count, status, created_at
		FROM bank_statement_uploads
		ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]BankStatementUpload, 0)
	for rows.Next() {
		var u BankStatementUpload
		if err := rows.Scan(&u.ID, &u.FileName, &u.Direction, &u.UploadedByUserID,
			&u.TotalLines, &u.MatchedCount, &u.Status, &u.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

func (s *Store) ListBankLines(ctx context.Context, uploadID string) ([]BankTransactionLine, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `
		SELECT id::text, upload_id::text, direction, transaction_date::text, amount,
		       counterparty_name, counterparty_account, description, match_status,
		       matched_donation_id::text, matched_ledger_id::text,
		       suggested_donation_id::text, suggested_ledger_id::text,
		       suggested_donor_user_id::text,
		       reviewed_by_user_id::text, reviewed_at
		FROM bank_transaction_lines
		WHERE upload_id = $1::uuid
		ORDER BY transaction_date, amount`, uploadID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanBankLines(rows)
}

func scanBankLines(rows pgx.Rows) ([]BankTransactionLine, error) {
	out := make([]BankTransactionLine, 0)
	for rows.Next() {
		var l BankTransactionLine
		var matchedDon, matchedLed, sugDon, sugLed, sugDonor, reviewed *string
		var reviewedAt *time.Time
		if err := rows.Scan(
			&l.ID, &l.UploadID, &l.Direction, &l.TransactionDate, &l.Amount,
			&l.CounterpartyName, &l.CounterpartyAccount, &l.Description, &l.MatchStatus,
			&matchedDon, &matchedLed, &sugDon, &sugLed, &sugDonor, &reviewed, &reviewedAt,
		); err != nil {
			return nil, err
		}
		l.MatchedDonationID = nullIfEmpty(matchedDon)
		l.MatchedLedgerID = nullIfEmpty(matchedLed)
		l.SuggestedDonationID = nullIfEmpty(sugDon)
		l.SuggestedLedgerID = nullIfEmpty(sugLed)
		l.SuggestedDonorUserID = nullIfEmpty(sugDonor)
		l.ReviewedByUserID = nullIfEmpty(reviewed)
		l.ReviewedAt = reviewedAt
		out = append(out, l)
	}
	return out, rows.Err()
}

func nullIfEmpty(p *string) *string {
	if p == nil || *p == "" {
		return nil
	}
	return p
}

func (s *Store) CreateBankUpload(ctx context.Context, in CreateBankUploadInput) (BankStatementUpload, error) {
	if err := s.requireDB(); err != nil {
		return BankStatementUpload{}, err
	}
	dir := strings.ToUpper(strings.TrimSpace(in.Direction))
	if dir != "INCOMING" && dir != "OUTGOING" {
		return BankStatementUpload{}, fmt.Errorf("%w: direction must be INCOMING or OUTGOING", ErrInvalidState)
	}
	if len(in.Lines) == 0 {
		return BankStatementUpload{}, fmt.Errorf("%w: lines required", ErrInvalidState)
	}
	fileName := strings.TrimSpace(in.FileName)
	if fileName == "" {
		fileName = "rekening-koran.csv"
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return BankStatementUpload{}, err
	}
	defer tx.Rollback(ctx)

	var upload BankStatementUpload
	err = tx.QueryRow(ctx, `
		INSERT INTO bank_statement_uploads (file_name, direction, uploaded_by_user_id, total_lines)
		VALUES ($1, $2, $3::uuid, $4)
		RETURNING id::text, file_name, direction, uploaded_by_user_id::text,
		          total_lines, matched_count, status, created_at`,
		fileName, dir, in.UploadedByUserID, len(in.Lines),
	).Scan(&upload.ID, &upload.FileName, &upload.Direction, &upload.UploadedByUserID,
		&upload.TotalLines, &upload.MatchedCount, &upload.Status, &upload.CreatedAt)
	if err != nil {
		return BankStatementUpload{}, err
	}

	var pending []pendingDonationMatch
	var donorAccounts []donorAccountMatch
	var outs []outLedgerMatch
	if dir == "INCOMING" {
		pending, err = s.loadPendingDonations(ctx, tx)
		if err != nil {
			return BankStatementUpload{}, err
		}
		donorAccounts, err = s.loadDonorAccounts(ctx, tx)
	} else {
		outs, err = s.loadOutgoingLedgers(ctx, tx)
	}
	if err != nil {
		return BankStatementUpload{}, err
	}

	matched := 0
	for _, raw := range in.Lines {
		if raw.Amount <= 0 || strings.TrimSpace(raw.TransactionDate) == "" {
			continue
		}
		status := "UNMATCHED"
		var matchedDon, matchedLed, sugDon, sugLed, sugDonor *string
		if dir == "INCOMING" {
			status, matchedDon, sugDon, sugDonor = matchIncoming(raw, pending, donorAccounts)
		} else {
			status, matchedLed, sugLed = matchOutgoing(raw, outs)
		}
		if status == "MATCHED" {
			matched++
		}
		_, err = tx.Exec(ctx, `
			INSERT INTO bank_transaction_lines (
				upload_id, direction, transaction_date, amount,
				counterparty_name, counterparty_account, description, match_status,
				matched_donation_id, matched_ledger_id, suggested_donation_id, suggested_ledger_id,
				suggested_donor_user_id
			) VALUES (
				$1::uuid, $2, $3::date, $4, $5, $6, $7, $8,
				NULLIF($9, '')::uuid, NULLIF($10, '')::uuid, NULLIF($11, '')::uuid, NULLIF($12, '')::uuid,
				NULLIF($13, '')::uuid
			)`,
			upload.ID, dir, raw.TransactionDate, raw.Amount,
			strings.TrimSpace(raw.CounterpartyName), strings.TrimSpace(raw.CounterpartyAccount),
			strings.TrimSpace(raw.Description), status,
			ptrStr(matchedDon), ptrStr(matchedLed), ptrStr(sugDon), ptrStr(sugLed), ptrStr(sugDonor),
		)
		if err != nil {
			return BankStatementUpload{}, err
		}
		// Consume exact matches so one donation/ledger isn't double-matched.
		if status == "MATCHED" && matchedDon != nil {
			pending = filterPending(pending, *matchedDon)
		}
		if status == "MATCHED" && matchedLed != nil {
			outs = filterOuts(outs, *matchedLed)
		}
	}

	uploadStatus := "REVIEW_NEEDED"
	if matched == upload.TotalLines {
		uploadStatus = "COMPLETED"
	}
	err = tx.QueryRow(ctx, `
		UPDATE bank_statement_uploads
		SET matched_count = $2, status = $3
		WHERE id = $1::uuid
		RETURNING matched_count, status`,
		upload.ID, matched, uploadStatus,
	).Scan(&upload.MatchedCount, &upload.Status)
	if err != nil {
		return BankStatementUpload{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return BankStatementUpload{}, err
	}
	return upload, nil
}

func ptrStr(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

func filterPending(in []pendingDonationMatch, id string) []pendingDonationMatch {
	out := make([]pendingDonationMatch, 0, len(in))
	for _, d := range in {
		if d.ID != id {
			out = append(out, d)
		}
	}
	return out
}

func filterOuts(in []outLedgerMatch, id string) []outLedgerMatch {
	out := make([]outLedgerMatch, 0, len(in))
	for _, d := range in {
		if d.ID != id {
			out = append(out, d)
		}
	}
	return out
}

func withinDays(a, b time.Time, days int) bool {
	diff := a.Sub(b)
	if diff < 0 {
		diff = -diff
	}
	return diff <= time.Duration(days)*24*time.Hour
}

func matchIncoming(line BankLineInput, pending []pendingDonationMatch, accounts []donorAccountMatch) (status string, matched, suggestedDonation, suggestedDonor *string) {
	txDate, err := time.Parse("2006-01-02", line.TransactionDate)
	if err != nil {
		return "UNMATCHED", nil, nil, nil
	}
	for i := range pending {
		d := pending[i]
		if d.Amount == line.Amount && withinDays(d.CreatedAt, txDate, 5) {
			id := d.ID
			return "MATCHED", &id, nil, nil
		}
	}
	for i := range pending {
		d := pending[i]
		if d.Amount == line.Amount {
			id := d.ID
			return "SUGGESTED", nil, &id, nil
		}
	}
	acct := normalizeAccount(line.CounterpartyAccount)
	if acct != "" {
		for i := range accounts {
			if normalizeAccount(accounts[i].AccountNumber) == acct {
				id := accounts[i].DonorUserID
				return "SUGGESTED", nil, nil, &id
			}
		}
	}
	return "UNMATCHED", nil, nil, nil
}

func matchOutgoing(line BankLineInput, outs []outLedgerMatch) (status string, matched, suggested *string) {
	txDate, err := time.Parse("2006-01-02", line.TransactionDate)
	if err != nil {
		return "UNMATCHED", nil, nil
	}
	acct := normalizeAccount(line.CounterpartyAccount)
	candidates := make([]outLedgerMatch, 0)
	for _, o := range outs {
		if acct != "" && normalizeAccount(o.TeacherAccount) == acct {
			candidates = append(candidates, o)
		}
	}
	for i := range candidates {
		o := candidates[i]
		if o.Amount == line.Amount && withinDays(o.OccurredAt, txDate, 3) {
			id := o.ID
			return "MATCHED", &id, nil
		}
	}
	if len(candidates) > 0 {
		id := candidates[0].ID
		return "SUGGESTED", nil, &id
	}
	return "UNMATCHED", nil, nil
}

func (s *Store) loadPendingDonations(ctx context.Context, tx pgx.Tx) ([]pendingDonationMatch, error) {
	rows, err := tx.Query(ctx, `
		SELECT id::text, donor_user_id::text, amount, created_at
		FROM donations
		WHERE verification_status = 'PENDING'
		ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]pendingDonationMatch, 0)
	for rows.Next() {
		var d pendingDonationMatch
		if err := rows.Scan(&d.ID, &d.DonorUserID, &d.Amount, &d.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

type donorAccountMatch struct {
	DonorUserID   string
	AccountNumber string
}

func (s *Store) loadDonorAccounts(ctx context.Context, tx pgx.Tx) ([]donorAccountMatch, error) {
	rows, err := tx.Query(ctx, `
		SELECT donor_user_id::text, account_number FROM donor_bank_accounts`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]donorAccountMatch, 0)
	for rows.Next() {
		var d donorAccountMatch
		if err := rows.Scan(&d.DonorUserID, &d.AccountNumber); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

func (s *Store) loadOutgoingLedgers(ctx context.Context, tx pgx.Tx) ([]outLedgerMatch, error) {
	rows, err := tx.Query(ctx, `
		SELECT le.id::text, le.amount, le.occurred_at,
		       COALESCE(tp.bank_account_number, ''), COALESCE(le.teacher_profile_id::text, '')
		FROM ledger_entries le
		LEFT JOIN teacher_profiles tp ON tp.id = le.teacher_profile_id
		WHERE le.entry_type = 'OUT'
		ORDER BY le.occurred_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]outLedgerMatch, 0)
	for rows.Next() {
		var o outLedgerMatch
		if err := rows.Scan(&o.ID, &o.Amount, &o.OccurredAt, &o.TeacherAccount, &o.TeacherProfileID); err != nil {
			return nil, err
		}
		out = append(out, o)
	}
	return out, rows.Err()
}

func (s *Store) ConfirmBankLine(ctx context.Context, lineID, reviewerID string, donationID, ledgerID *string) (BankTransactionLine, error) {
	if err := s.requireDB(); err != nil {
		return BankTransactionLine{}, err
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return BankTransactionLine{}, err
	}
	defer tx.Rollback(ctx)

	var uploadID, direction string
	var sugDon, sugLed *string
	err = tx.QueryRow(ctx, `
		SELECT upload_id::text, direction, suggested_donation_id::text, suggested_ledger_id::text
		FROM bank_transaction_lines WHERE id = $1::uuid`, lineID,
	).Scan(&uploadID, &direction, &sugDon, &sugLed)
	if err != nil {
		if err == pgx.ErrNoRows {
			return BankTransactionLine{}, ErrNotFound
		}
		return BankTransactionLine{}, err
	}

	donID := firstNonNil(donationID, sugDon)
	ledID := firstNonNil(ledgerID, sugLed)

	_, err = tx.Exec(ctx, `
		UPDATE bank_transaction_lines
		SET match_status = 'MATCHED',
		    matched_donation_id = NULLIF($2, '')::uuid,
		    matched_ledger_id = NULLIF($3, '')::uuid,
		    reviewed_by_user_id = $4::uuid,
		    reviewed_at = NOW()
		WHERE id = $1::uuid`,
		lineID, ptrStr(donID), ptrStr(ledID), reviewerID)
	if err != nil {
		return BankTransactionLine{}, err
	}

	if direction == "INCOMING" && donID != nil && *donID != "" {
		_, err = tx.Exec(ctx, `
			UPDATE donations
			SET verification_status = 'VERIFIED', verified_at = NOW(), verified_by = $2::uuid
			WHERE id = $1::uuid AND verification_status = 'PENDING'`,
			*donID, reviewerID)
		if err != nil {
			return BankTransactionLine{}, err
		}
		var donorID, acct, holder string
		_ = tx.QueryRow(ctx, `
			SELECT d.donor_user_id::text, l.counterparty_account, l.counterparty_name
			FROM donations d
			JOIN bank_transaction_lines l ON l.id = $2::uuid
			WHERE d.id = $1::uuid`, *donID, lineID).Scan(&donorID, &acct, &holder)
		if donorID != "" && acct != "" {
			_, _ = tx.Exec(ctx, `
				INSERT INTO donor_bank_accounts (donor_user_id, account_number, account_holder)
				VALUES ($1::uuid, $2, $3)
				ON CONFLICT (donor_user_id, account_number) DO UPDATE SET account_holder = EXCLUDED.account_holder`,
				donorID, acct, holder)
		}
	}

	if err := s.refreshUploadCounts(ctx, tx, uploadID); err != nil {
		return BankTransactionLine{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return BankTransactionLine{}, err
	}
	lines, err := s.ListBankLines(ctx, uploadID)
	if err != nil {
		return BankTransactionLine{}, err
	}
	for _, l := range lines {
		if l.ID == lineID {
			return l, nil
		}
	}
	return BankTransactionLine{}, ErrNotFound
}

func firstNonNil(a, b *string) *string {
	if a != nil && *a != "" {
		return a
	}
	return b
}

func (s *Store) IgnoreBankLine(ctx context.Context, lineID, reviewerID string) (BankTransactionLine, error) {
	if err := s.requireDB(); err != nil {
		return BankTransactionLine{}, err
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return BankTransactionLine{}, err
	}
	defer tx.Rollback(ctx)

	var uploadID string
	err = tx.QueryRow(ctx, `
		UPDATE bank_transaction_lines
		SET match_status = 'IGNORED', reviewed_by_user_id = $2::uuid, reviewed_at = NOW()
		WHERE id = $1::uuid
		RETURNING upload_id::text`, lineID, reviewerID).Scan(&uploadID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return BankTransactionLine{}, ErrNotFound
		}
		return BankTransactionLine{}, err
	}
	if err := s.refreshUploadCounts(ctx, tx, uploadID); err != nil {
		return BankTransactionLine{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return BankTransactionLine{}, err
	}
	lines, err := s.ListBankLines(ctx, uploadID)
	if err != nil {
		return BankTransactionLine{}, err
	}
	for _, l := range lines {
		if l.ID == lineID {
			return l, nil
		}
	}
	return BankTransactionLine{}, ErrNotFound
}

func (s *Store) refreshUploadCounts(ctx context.Context, tx pgx.Tx, uploadID string) error {
	var total, resolved int
	err := tx.QueryRow(ctx, `
		SELECT COUNT(*),
		       COUNT(*) FILTER (WHERE match_status IN ('MATCHED', 'IGNORED'))
		FROM bank_transaction_lines WHERE upload_id = $1::uuid`, uploadID,
	).Scan(&total, &resolved)
	if err != nil {
		return err
	}
	status := "REVIEW_NEEDED"
	if total > 0 && resolved == total {
		status = "COMPLETED"
	}
	_, err = tx.Exec(ctx, `
		UPDATE bank_statement_uploads
		SET matched_count = (
			SELECT COUNT(*) FROM bank_transaction_lines
			WHERE upload_id = $1::uuid AND match_status = 'MATCHED'
		),
		status = $2
		WHERE id = $1::uuid`, uploadID, status)
	return err
}

type CreateDonorFromLineInput struct {
	DonorName string `json:"donorName"`
	Email     string `json:"email"`
}

func (s *Store) CreateDonorFromLine(ctx context.Context, lineID, reviewerID string, in CreateDonorFromLineInput) (BankTransactionLine, error) {
	if err := s.requireDB(); err != nil {
		return BankTransactionLine{}, err
	}
	name := strings.TrimSpace(in.DonorName)
	email := strings.TrimSpace(strings.ToLower(in.Email))
	if name == "" || email == "" {
		return BankTransactionLine{}, fmt.Errorf("%w: nama dan email wajib", ErrInvalidState)
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return BankTransactionLine{}, err
	}
	defer tx.Rollback(ctx)

	var uploadID, direction, acct, holder string
	var amount int64
	var status string
	err = tx.QueryRow(ctx, `
		SELECT upload_id::text, direction, amount, counterparty_account, counterparty_name, match_status
		FROM bank_transaction_lines WHERE id = $1::uuid`, lineID,
	).Scan(&uploadID, &direction, &amount, &acct, &holder, &status)
	if err != nil {
		if err == pgx.ErrNoRows {
			return BankTransactionLine{}, ErrNotFound
		}
		return BankTransactionLine{}, err
	}
	if direction != "INCOMING" {
		return BankTransactionLine{}, fmt.Errorf("%w: hanya transaksi masuk", ErrInvalidState)
	}
	if status == "MATCHED" || status == "IGNORED" {
		return BankTransactionLine{}, fmt.Errorf("%w: baris sudah selesai", ErrInvalidState)
	}

	donor, err := s.SaveDonor(ctx, "", email, name, "")
	if err != nil {
		return BankTransactionLine{}, err
	}

	var donationID string
	err = tx.QueryRow(ctx, `
		INSERT INTO donations (donor_user_id, amount, type, verification_status, invoice_number, verified_at, verified_by)
		VALUES ($1::uuid, $2, 'ONE_TIME'::donation_type, 'VERIFIED', $3, NOW(), $4::uuid)
		RETURNING id::text`,
		donor.ID, amount, fmt.Sprintf("RK-%s", lineID[:8]), reviewerID,
	).Scan(&donationID)
	if err != nil {
		return BankTransactionLine{}, err
	}

	if acct != "" {
		_, _ = tx.Exec(ctx, `
			INSERT INTO donor_bank_accounts (donor_user_id, account_number, account_holder)
			VALUES ($1::uuid, $2, $3)
			ON CONFLICT (donor_user_id, account_number) DO UPDATE SET account_holder = EXCLUDED.account_holder`,
			donor.ID, acct, holder)
	}

	_, err = tx.Exec(ctx, `
		UPDATE bank_transaction_lines
		SET match_status = 'MATCHED',
		    matched_donation_id = $2::uuid,
		    reviewed_by_user_id = $3::uuid,
		    reviewed_at = NOW()
		WHERE id = $1::uuid`, lineID, donationID, reviewerID)
	if err != nil {
		return BankTransactionLine{}, err
	}
	if err := s.refreshUploadCounts(ctx, tx, uploadID); err != nil {
		return BankTransactionLine{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return BankTransactionLine{}, err
	}
	lines, err := s.ListBankLines(ctx, uploadID)
	if err != nil {
		return BankTransactionLine{}, err
	}
	for _, l := range lines {
		if l.ID == lineID {
			return l, nil
		}
	}
	return BankTransactionLine{}, ErrNotFound
}

func (s *Store) ConfirmSuggestedDonorDonation(ctx context.Context, lineID, reviewerID string) (BankTransactionLine, error) {
	if err := s.requireDB(); err != nil {
		return BankTransactionLine{}, err
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return BankTransactionLine{}, err
	}
	defer tx.Rollback(ctx)

	var uploadID, direction, acct, holder string
	var amount int64
	var sugDonor *string
	err = tx.QueryRow(ctx, `
		SELECT upload_id::text, direction, amount, counterparty_account, counterparty_name,
		       suggested_donor_user_id::text
		FROM bank_transaction_lines WHERE id = $1::uuid`, lineID,
	).Scan(&uploadID, &direction, &amount, &acct, &holder, &sugDonor)
	if err != nil {
		if err == pgx.ErrNoRows {
			return BankTransactionLine{}, ErrNotFound
		}
		return BankTransactionLine{}, err
	}
	if direction != "INCOMING" || sugDonor == nil || *sugDonor == "" {
		return BankTransactionLine{}, fmt.Errorf("%w: tidak ada donatur yang disarankan", ErrInvalidState)
	}

	var donationID string
	err = tx.QueryRow(ctx, `
		INSERT INTO donations (donor_user_id, amount, type, verification_status, invoice_number, verified_at, verified_by)
		VALUES ($1::uuid, $2, 'ONE_TIME'::donation_type, 'VERIFIED', $3, NOW(), $4::uuid)
		RETURNING id::text`,
		*sugDonor, amount, fmt.Sprintf("RK-%s", lineID[:8]), reviewerID,
	).Scan(&donationID)
	if err != nil {
		return BankTransactionLine{}, err
	}
	if acct != "" {
		_, _ = tx.Exec(ctx, `
			INSERT INTO donor_bank_accounts (donor_user_id, account_number, account_holder)
			VALUES ($1::uuid, $2, $3)
			ON CONFLICT (donor_user_id, account_number) DO UPDATE SET account_holder = EXCLUDED.account_holder`,
			*sugDonor, acct, holder)
	}
	_, err = tx.Exec(ctx, `
		UPDATE bank_transaction_lines
		SET match_status = 'MATCHED',
		    matched_donation_id = $2::uuid,
		    reviewed_by_user_id = $3::uuid,
		    reviewed_at = NOW()
		WHERE id = $1::uuid`, lineID, donationID, reviewerID)
	if err != nil {
		return BankTransactionLine{}, err
	}
	if err := s.refreshUploadCounts(ctx, tx, uploadID); err != nil {
		return BankTransactionLine{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return BankTransactionLine{}, err
	}
	lines, err := s.ListBankLines(ctx, uploadID)
	if err != nil {
		return BankTransactionLine{}, err
	}
	for _, l := range lines {
		if l.ID == lineID {
			return l, nil
		}
	}
	return BankTransactionLine{}, ErrNotFound
}

