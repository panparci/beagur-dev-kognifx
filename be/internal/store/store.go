package store

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("not found")
var ErrForbidden = errors.New("forbidden")
var ErrInvalidState = errors.New("invalid state")

type Institution struct {
	ID              string    `json:"id"`
	Name            string    `json:"name"`
	Address         string    `json:"address"`
	ValidatorUserID *string   `json:"validatorUserId,omitempty"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type TeacherProfile struct {
	ID                  string    `json:"id"`
	UserID              string    `json:"userId"`
	InstitutionID       string    `json:"institutionId"`
	InstitutionName     string    `json:"institutionName,omitempty"`
	FullName            string    `json:"fullName"`
	PhotoURL            string    `json:"photoUrl"`
	TeachingPhotoURL    string    `json:"teachingPhotoUrl"`
	JobTitle            string    `json:"jobTitle"`
	YearsOfService      int32     `json:"yearsOfService"`
	Age                 *int32    `json:"age,omitempty"`
	MonthlySalary       int64     `json:"monthlySalary"`
	PhoneNumber         string    `json:"phoneNumber"`
	BankName            string    `json:"bankName"`
	BankAccountNumber   string    `json:"bankAccountNumber"`
	TotalReceivedCount  int32     `json:"totalReceivedCount"`
	TotalReceivedAmount int64     `json:"totalReceivedAmount"`
	Region              string    `json:"region"`
	Latitude            *float64  `json:"latitude,omitempty"`
	Longitude           *float64  `json:"longitude,omitempty"`
	Reason              string    `json:"reason"`
	Status              string    `json:"status"`
	RejectedBy          *string   `json:"rejectedBy,omitempty"`
	IsPublished         bool      `json:"isPublished"`
	CreatedAt           time.Time `json:"createdAt"`
	UpdatedAt           time.Time `json:"updatedAt"`
}

type Donation struct {
	ID               string    `json:"id"`
	DonorUserID      string    `json:"donorUserId"`
	TeacherProfileID *string   `json:"teacherProfileId,omitempty"`
	Amount           int64     `json:"amount"`
	Type             string    `json:"type"`
	CreatedAt        time.Time `json:"createdAt"`
}

type MonthlyReport struct {
	ID            string    `json:"id"`
	TeacherUserID string    `json:"teacherUserId"`
	PhotoURL      string    `json:"photoUrl"`
	Description   string    `json:"description"`
	Status        string    `json:"status"`
	SubmittedAt   time.Time `json:"submittedAt"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type ReportWithDetails struct {
	Report          MonthlyReport `json:"report"`
	TeacherName     string        `json:"teacherName"`
	TeacherPhoto    string        `json:"teacherPhoto"`
	InstitutionName string        `json:"institutionName"`
	JobTitle        string        `json:"jobTitle"`
}

type CampaignProgress struct {
	Target                  int64 `json:"target"`
	Raised                  int64 `json:"raised"`
	Percentage              int   `json:"percentage"`
	DonorCount              int64 `json:"donorCount"`
	FundedTeachersCount     int64 `json:"fundedTeachersCount"`
	PublishedTeachersCount  int64 `json:"publishedTeachersCount"`
	TransferCount           int64 `json:"transferCount"`
	MonthlyTeacherTarget    int64 `json:"monthlyTeacherTarget"`
	CurrentTeacherCount     int64 `json:"currentTeacherCount"`
}

type ValidatorUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Role  string `json:"role"`
}

type Store struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

func (s *Store) requireDB() error {
	if s.pool == nil {
		return errors.New("database unavailable")
	}
	return nil
}

func parseUUID(id string) (uuid.UUID, error) {
	return uuid.Parse(id)
}

const teacherSelect = `
SELECT
    tp.id::text,
    tp.user_id::text,
    tp.institution_id::text,
    COALESCE(i.name, ''),
    tp.full_name,
    tp.photo_url,
    tp.teaching_photo_url,
    tp.job_title,
    tp.years_of_service,
    tp.age,
    tp.monthly_salary,
    tp.phone_number,
    tp.bank_name,
    tp.bank_account_number,
    tp.total_received_count,
    tp.total_received_amount,
    tp.region,
    tp.latitude,
    tp.longitude,
    tp.reason,
    tp.status::text,
    tp.rejected_by,
    tp.is_published,
    tp.created_at,
    tp.updated_at
FROM teacher_profiles tp
LEFT JOIN institutions i ON i.id = tp.institution_id
`

func scanTeacher(row pgx.Row) (TeacherProfile, error) {
	var t TeacherProfile
	err := row.Scan(
		&t.ID, &t.UserID, &t.InstitutionID, &t.InstitutionName,
		&t.FullName, &t.PhotoURL, &t.TeachingPhotoURL, &t.JobTitle,
		&t.YearsOfService, &t.Age, &t.MonthlySalary, &t.PhoneNumber,
		&t.BankName, &t.BankAccountNumber, &t.TotalReceivedCount,
		&t.TotalReceivedAmount, &t.Region, &t.Latitude, &t.Longitude, &t.Reason, &t.Status,
		&t.RejectedBy, &t.IsPublished, &t.CreatedAt, &t.UpdatedAt,
	)
	return t, err
}

func (s *Store) ListInstitutions(ctx context.Context) ([]Institution, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `
		SELECT id::text, name, address,
		       validator_user_id::text, created_at, updated_at
		FROM institutions
		ORDER BY name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]Institution, 0)
	for rows.Next() {
		var inst Institution
		var validatorID *string
		if err := rows.Scan(&inst.ID, &inst.Name, &inst.Address, &validatorID, &inst.CreatedAt, &inst.UpdatedAt); err != nil {
			return nil, err
		}
		inst.ValidatorUserID = validatorID
		out = append(out, inst)
	}
	return out, rows.Err()
}

func (s *Store) SaveInstitution(ctx context.Context, inst Institution) (Institution, error) {
	if err := s.requireDB(); err != nil {
		return Institution{}, err
	}

	if inst.ID == "" {
		var validatorID any
		if inst.ValidatorUserID != nil && *inst.ValidatorUserID != "" {
			vid, err := parseUUID(*inst.ValidatorUserID)
			if err != nil {
				return Institution{}, err
			}
			validatorID = vid
		}
		err := s.pool.QueryRow(ctx, `
			INSERT INTO institutions (name, address, validator_user_id)
			VALUES ($1, $2, $3)
			RETURNING id::text, created_at, updated_at`,
			inst.Name, inst.Address, validatorID,
		).Scan(&inst.ID, &inst.CreatedAt, &inst.UpdatedAt)
		return inst, err
	}

	id, err := parseUUID(inst.ID)
	if err != nil {
		return Institution{}, err
	}
	var validatorID any
	if inst.ValidatorUserID != nil && *inst.ValidatorUserID != "" {
		vid, err := parseUUID(*inst.ValidatorUserID)
		if err != nil {
			return Institution{}, err
		}
		validatorID = vid
	}
	err = s.pool.QueryRow(ctx, `
		UPDATE institutions
		SET name = $2, address = $3, validator_user_id = $4
		WHERE id = $1
		RETURNING created_at, updated_at`,
		id, inst.Name, inst.Address, validatorID,
	).Scan(&inst.CreatedAt, &inst.UpdatedAt)
	return inst, err
}

func (s *Store) ListValidators(ctx context.Context) ([]ValidatorUser, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `
		SELECT DISTINCT u.id::text, u.email, u.name, r.code
		FROM users u
		JOIN user_roles ur ON ur.user_id = u.id
		JOIN roles r ON r.id = ur.role_id
		WHERE r.code = 'VALIDATOR' AND u.is_active = TRUE
		ORDER BY u.name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]ValidatorUser, 0)
	for rows.Next() {
		var row ValidatorUser
		if err := rows.Scan(&row.ID, &row.Email, &row.Name, &row.Role); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (s *Store) ListTeachers(ctx context.Context, status string) ([]TeacherProfile, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	query := teacherSelect + ` ORDER BY tp.full_name ASC`
	var rows pgx.Rows
	var err error
	if status != "" {
		query = teacherSelect + ` WHERE tp.status = $1::application_status ORDER BY tp.full_name ASC`
		rows, err = s.pool.Query(ctx, query, status)
	} else {
		rows, err = s.pool.Query(ctx, query)
	}
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
		out = append(out, t)
	}
	return out, rows.Err()
}

func (s *Store) GetTeacherByUserID(ctx context.Context, userID string) (TeacherProfile, error) {
	if err := s.requireDB(); err != nil {
		return TeacherProfile{}, err
	}
	uid, err := parseUUID(userID)
	if err != nil {
		return TeacherProfile{}, err
	}
	row := s.pool.QueryRow(ctx, teacherSelect+` WHERE tp.user_id = $1`, uid)
	t, err := scanTeacher(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return TeacherProfile{}, ErrNotFound
	}
	return t, err
}

func (s *Store) GetTeacherByID(ctx context.Context, id string) (TeacherProfile, error) {
	if err := s.requireDB(); err != nil {
		return TeacherProfile{}, err
	}
	tid, err := parseUUID(id)
	if err != nil {
		return TeacherProfile{}, err
	}
	row := s.pool.QueryRow(ctx, teacherSelect+` WHERE tp.id = $1`, tid)
	t, err := scanTeacher(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return TeacherProfile{}, ErrNotFound
	}
	return t, err
}

func (s *Store) SaveTeacher(ctx context.Context, t TeacherProfile) (TeacherProfile, error) {
	if err := s.requireDB(); err != nil {
		return TeacherProfile{}, err
	}
	userID, err := parseUUID(t.UserID)
	if err != nil {
		return TeacherProfile{}, err
	}
	instID, err := parseUUID(t.InstitutionID)
	if err != nil {
		return TeacherProfile{}, err
	}

	if t.ID == "" {
		t.Status = "PENDING_VALIDATION"
		err := s.pool.QueryRow(ctx, `
			INSERT INTO teacher_profiles (
				user_id, institution_id, full_name, photo_url, teaching_photo_url,
				job_title, years_of_service, age, monthly_salary, phone_number,
				bank_name, bank_account_number, total_received_count, total_received_amount,
				region, latitude, longitude, reason, status, is_published
			) VALUES (
				$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::application_status,$20
			)
			RETURNING id::text, created_at, updated_at`,
			userID, instID, t.FullName, t.PhotoURL, t.TeachingPhotoURL,
			t.JobTitle, t.YearsOfService, t.Age, t.MonthlySalary, t.PhoneNumber,
			t.BankName, t.BankAccountNumber, t.TotalReceivedCount, t.TotalReceivedAmount,
			t.Region, t.Latitude, t.Longitude, t.Reason, t.Status, t.IsPublished,
		).Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt)
		if err != nil {
			return TeacherProfile{}, err
		}
		return s.GetTeacherByID(ctx, t.ID)
	}

	tid, err := parseUUID(t.ID)
	if err != nil {
		return TeacherProfile{}, err
	}
	_, err = s.pool.Exec(ctx, `
		UPDATE teacher_profiles SET
			institution_id = $2, full_name = $3, photo_url = $4, teaching_photo_url = $5,
			job_title = $6, years_of_service = $7, age = $8, monthly_salary = $9,
			phone_number = $10, bank_name = $11, bank_account_number = $12,
			region = $13, latitude = $14, longitude = $15, reason = $16, status = $17::application_status,
			is_published = $18,
			rejected_by = CASE WHEN $17::text = 'PENDING_VALIDATION' THEN NULL ELSE rejected_by END
		WHERE id = $1`,
		tid, instID, t.FullName, t.PhotoURL, t.TeachingPhotoURL,
		t.JobTitle, t.YearsOfService, t.Age, t.MonthlySalary, t.PhoneNumber,
		t.BankName, t.BankAccountNumber, t.Region, t.Latitude, t.Longitude, t.Reason, t.Status, t.IsPublished,
	)
	if err != nil {
		return TeacherProfile{}, err
	}
	return s.GetTeacherByID(ctx, t.ID)
}

func (s *Store) UpdateTeacherStatus(ctx context.Context, id, status string) (TeacherProfile, error) {
	if err := s.requireDB(); err != nil {
		return TeacherProfile{}, err
	}
	tid, err := parseUUID(id)
	if err != nil {
		return TeacherProfile{}, err
	}
	isPublished := status == "APPROVED"
	_, err = s.pool.Exec(ctx, `
		UPDATE teacher_profiles
		SET status = $2::application_status, is_published = $3, rejected_by = NULL
		WHERE id = $1`, tid, status, isPublished)
	if err != nil {
		return TeacherProfile{}, err
	}
	return s.GetTeacherByID(ctx, id)
}

// ValidatorDecision moves PENDING_VALIDATION → PENDING_APPROVAL (approve) or REJECTED (reject)
// only for teachers at institutions assigned to the validator.
func (s *Store) ValidatorDecision(ctx context.Context, profileID, validatorUserID string, approve bool) (TeacherProfile, error) {
	if err := s.requireDB(); err != nil {
		return TeacherProfile{}, err
	}
	tid, err := parseUUID(profileID)
	if err != nil {
		return TeacherProfile{}, err
	}
	vid, err := parseUUID(validatorUserID)
	if err != nil {
		return TeacherProfile{}, err
	}

	newStatus := "REJECTED"
	var rejectedBy any = "VALIDATOR"
	if approve {
		newStatus = "PENDING_APPROVAL"
		rejectedBy = nil
	}

	tag, err := s.pool.Exec(ctx, `
		UPDATE teacher_profiles tp
		SET status = $3::application_status,
		    is_published = FALSE,
		    rejected_by = $4
		WHERE tp.id = $1
		  AND tp.status = 'PENDING_VALIDATION'
		  AND tp.institution_id IN (
		    SELECT id FROM institutions WHERE validator_user_id = $2
		  )`, tid, vid, newStatus, rejectedBy)
	if err != nil {
		return TeacherProfile{}, err
	}
	if tag.RowsAffected() == 0 {
		if _, err := s.GetTeacherByID(ctx, profileID); errors.Is(err, ErrNotFound) {
			return TeacherProfile{}, ErrNotFound
		}
		return TeacherProfile{}, ErrForbidden
	}
	return s.GetTeacherByID(ctx, profileID)
}

// AdminApprovalDecision moves PENDING_APPROVAL → APPROVED or REJECTED (yayasan).
func (s *Store) AdminApprovalDecision(ctx context.Context, profileID string, approve bool) (TeacherProfile, error) {
	if err := s.requireDB(); err != nil {
		return TeacherProfile{}, err
	}
	tid, err := parseUUID(profileID)
	if err != nil {
		return TeacherProfile{}, err
	}

	newStatus := "REJECTED"
	isPublished := false
	var rejectedBy any = "ADMIN"
	if approve {
		newStatus = "APPROVED"
		isPublished = true
		rejectedBy = nil
	}

	tag, err := s.pool.Exec(ctx, `
		UPDATE teacher_profiles
		SET status = $2::application_status,
		    is_published = $3,
		    rejected_by = $4
		WHERE id = $1 AND status = 'PENDING_APPROVAL'`, tid, newStatus, isPublished, rejectedBy)
	if err != nil {
		return TeacherProfile{}, err
	}
	if tag.RowsAffected() == 0 {
		if _, err := s.GetTeacherByID(ctx, profileID); errors.Is(err, ErrNotFound) {
			return TeacherProfile{}, ErrNotFound
		}
		return TeacherProfile{}, ErrInvalidState
	}
	if approve {
		profile, err := s.GetTeacherByID(ctx, profileID)
		if err != nil {
			return TeacherProfile{}, err
		}
		_, _ = s.pool.Exec(ctx, `
			UPDATE users SET account_status = 'ACTIVE'::account_status
			WHERE id = $1 AND account_status = 'PENDING_VERIFICATION'`,
			profile.UserID,
		)
		return profile, nil
	}
	return s.GetTeacherByID(ctx, profileID)
}

func (s *Store) ListPendingValidations(ctx context.Context, validatorUserID string) ([]TeacherProfile, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	vid, err := parseUUID(validatorUserID)
	if err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, teacherSelect+`
		WHERE tp.status = 'PENDING_VALIDATION'
		  AND tp.institution_id IN (
		    SELECT id FROM institutions WHERE validator_user_id = $1
		  )
		ORDER BY tp.created_at ASC`, vid)
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
		out = append(out, t)
	}
	return out, rows.Err()
}

// ListValidatorSchoolTeachers returns all guru honorer at institutions assigned to this validator.
func (s *Store) ListValidatorSchoolTeachers(ctx context.Context, validatorUserID string) ([]TeacherProfile, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	vid, err := parseUUID(validatorUserID)
	if err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, teacherSelect+`
		WHERE tp.institution_id IN (
		    SELECT id FROM institutions WHERE validator_user_id = $1
		  )
		ORDER BY tp.updated_at DESC`, vid)
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
		out = append(out, t)
	}
	return out, rows.Err()
}

func (s *Store) ListPendingApprovals(ctx context.Context) ([]TeacherProfile, error) {
	return s.ListTeachers(ctx, "PENDING_APPROVAL")
}

func (s *Store) ListApprovedTeachers(ctx context.Context) ([]TeacherProfile, error) {
	items, err := s.ListTeachers(ctx, "APPROVED")
	if err != nil {
		return nil, err
	}
	for i := range items {
		items[i] = maskTeacherForPublic(items[i])
	}
	return items, nil
}

func (s *Store) CreateDonation(ctx context.Context, d Donation) (Donation, error) {
	if err := s.requireDB(); err != nil {
		return Donation{}, err
	}
	donorID, err := parseUUID(d.DonorUserID)
	if err != nil {
		return Donation{}, err
	}
	var teacherID any
	if d.TeacherProfileID != nil && *d.TeacherProfileID != "" {
		tid, err := parseUUID(*d.TeacherProfileID)
		if err != nil {
			return Donation{}, err
		}
		teacherID = tid
	}
	err = s.pool.QueryRow(ctx, `
		INSERT INTO donations (donor_user_id, teacher_profile_id, amount, type)
		VALUES ($1, $2, $3, $4::donation_type)
		RETURNING id::text, created_at`,
		donorID, teacherID, d.Amount, d.Type,
	).Scan(&d.ID, &d.CreatedAt)
	return d, err
}

func (s *Store) ListDonations(ctx context.Context) ([]Donation, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `
		SELECT id::text, donor_user_id::text, teacher_profile_id::text,
		       amount, type::text, created_at
		FROM donations ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]Donation, 0)
	for rows.Next() {
		var d Donation
		if err := rows.Scan(&d.ID, &d.DonorUserID, &d.TeacherProfileID, &d.Amount, &d.Type, &d.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

func (s *Store) ListDonationsByDonor(ctx context.Context, donorUserID string) ([]Donation, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	did, err := parseUUID(donorUserID)
	if err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `
		SELECT id::text, donor_user_id::text, teacher_profile_id::text,
		       amount, type::text, created_at
		FROM donations WHERE donor_user_id = $1 ORDER BY created_at DESC`, did)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]Donation, 0)
	for rows.Next() {
		var d Donation
		if err := rows.Scan(&d.ID, &d.DonorUserID, &d.TeacherProfileID, &d.Amount, &d.Type, &d.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

func (s *Store) CampaignProgress(ctx context.Context) (CampaignProgress, error) {
	if err := s.requireDB(); err != nil {
		return CampaignProgress{}, err
	}
	var p CampaignProgress
	p.MonthlyTeacherTarget = 350

	err := s.pool.QueryRow(ctx, `
		SELECT
			COALESCE(SUM(amount), 0),
			COUNT(DISTINCT donor_user_id),
			COUNT(*)
		FROM donations`).Scan(&p.Raised, &p.DonorCount, &p.TransferCount)
	if err != nil {
		return CampaignProgress{}, err
	}

	err = s.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM teacher_profiles WHERE status = 'APPROVED'`).Scan(&p.FundedTeachersCount)
	if err != nil {
		return CampaignProgress{}, err
	}

	err = s.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM teacher_profiles
		WHERE status = 'APPROVED' AND is_published = TRUE`).Scan(&p.PublishedTeachersCount)
	if err != nil {
		return CampaignProgress{}, err
	}

	p.CurrentTeacherCount = p.FundedTeachersCount
	p.Target = p.MonthlyTeacherTarget
	if p.MonthlyTeacherTarget > 0 {
		p.Percentage = int((p.CurrentTeacherCount * 100) / p.MonthlyTeacherTarget)
	}
	if p.Percentage > 100 {
		p.Percentage = 100
	}

	return p, nil
}

func (s *Store) ListReportsByTeacher(ctx context.Context, teacherUserID string) ([]MonthlyReport, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	uid, err := parseUUID(teacherUserID)
	if err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `
		SELECT id::text, teacher_user_id::text, photo_url, description,
		       status::text, submitted_at, created_at, updated_at
		FROM monthly_reports WHERE teacher_user_id = $1
		ORDER BY submitted_at DESC`, uid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]MonthlyReport, 0)
	for rows.Next() {
		var r MonthlyReport
		if err := rows.Scan(&r.ID, &r.TeacherUserID, &r.PhotoURL, &r.Description,
			&r.Status, &r.SubmittedAt, &r.CreatedAt, &r.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *Store) CreateReport(ctx context.Context, r MonthlyReport) (MonthlyReport, error) {
	if err := s.requireDB(); err != nil {
		return MonthlyReport{}, err
	}
	uid, err := parseUUID(r.TeacherUserID)
	if err != nil {
		return MonthlyReport{}, err
	}
	r.Status = "PENDING"
	err = s.pool.QueryRow(ctx, `
		INSERT INTO monthly_reports (teacher_user_id, photo_url, description, status, submitted_at)
		VALUES ($1, $2, $3, 'PENDING', COALESCE($4, NOW()))
		RETURNING id::text, submitted_at, created_at, updated_at`,
		uid, r.PhotoURL, r.Description, r.SubmittedAt,
	).Scan(&r.ID, &r.SubmittedAt, &r.CreatedAt, &r.UpdatedAt)
	return r, err
}

func (s *Store) UpdateReportStatus(ctx context.Context, id, status string) (MonthlyReport, error) {
	if err := s.requireDB(); err != nil {
		return MonthlyReport{}, err
	}
	rid, err := parseUUID(id)
	if err != nil {
		return MonthlyReport{}, err
	}
	var r MonthlyReport
	err = s.pool.QueryRow(ctx, `
		UPDATE monthly_reports SET status = $2::report_status
		WHERE id = $1
		RETURNING id::text, teacher_user_id::text, photo_url, description,
		          status::text, submitted_at, created_at, updated_at`,
		rid, status,
	).Scan(&r.ID, &r.TeacherUserID, &r.PhotoURL, &r.Description,
		&r.Status, &r.SubmittedAt, &r.CreatedAt, &r.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return MonthlyReport{}, ErrNotFound
	}
	return r, err
}

func (s *Store) ListReportsWithDetails(ctx context.Context, approvedOnly bool) ([]ReportWithDetails, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	query := `
		SELECT mr.id::text, mr.teacher_user_id::text, mr.photo_url, mr.description,
		       mr.status::text, mr.submitted_at, mr.created_at, mr.updated_at,
		       COALESCE(tp.full_name, ''), COALESCE(tp.photo_url, ''),
		       COALESCE(i.name, ''), COALESCE(tp.job_title, '')
		FROM monthly_reports mr
		LEFT JOIN teacher_profiles tp ON tp.user_id = mr.teacher_user_id
		LEFT JOIN institutions i ON i.id = tp.institution_id`
	if approvedOnly {
		query += ` WHERE mr.status = 'APPROVED'`
	}
	query += ` ORDER BY mr.submitted_at DESC`

	rows, err := s.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]ReportWithDetails, 0)
	for rows.Next() {
		var item ReportWithDetails
		if err := rows.Scan(
			&item.Report.ID, &item.Report.TeacherUserID, &item.Report.PhotoURL,
			&item.Report.Description, &item.Report.Status, &item.Report.SubmittedAt,
			&item.Report.CreatedAt, &item.Report.UpdatedAt,
			&item.TeacherName, &item.TeacherPhoto, &item.InstitutionName, &item.JobTitle,
		); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, rows.Err()
}

func (s *Store) Ping(ctx context.Context) error {
	if s.pool == nil {
		return fmt.Errorf("database unavailable")
	}
	return s.pool.Ping(ctx)
}

func (s *Store) GetSetting(ctx context.Context, key string) (string, error) {
	if err := s.requireDB(); err != nil {
		return "", err
	}
	var value string
	err := s.pool.QueryRow(ctx, `SELECT value FROM program_settings WHERE key = $1`, key).Scan(&value)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	return value, err
}

func (s *Store) SetSetting(ctx context.Context, key, value string) (string, error) {
	if err := s.requireDB(); err != nil {
		return "", err
	}
	var out string
	err := s.pool.QueryRow(ctx, `
		INSERT INTO program_settings (key, value)
		VALUES ($1, $2)
		ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
		RETURNING value`, key, value,
	).Scan(&out)
	return out, err
}
