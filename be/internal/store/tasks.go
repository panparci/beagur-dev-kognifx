package store

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type TaskFormField struct {
	ID       string `json:"id"`
	Label    string `json:"label"`
	Type     string `json:"type"` // TEXT | PHOTO | DECLARATION
	Required bool   `json:"required"`
}

type TaskTemplate struct {
	ID                      string          `json:"id"`
	Title                   string          `json:"title"`
	Description             string          `json:"description"`
	Type                    string          `json:"type"`
	Recurrence              string          `json:"recurrence"`
	TargetMode              string          `json:"targetMode"`
	TargetInstitutionIDs    []string        `json:"targetInstitutionIds"`
	TargetTeacherProfileIDs []string        `json:"targetTeacherProfileIds"`
	Fields                  []TaskFormField `json:"fields"`
	DueDate                 *time.Time      `json:"dueDate,omitempty"`
	IsActive                bool            `json:"isActive"`
	CreatedByUserID         string          `json:"createdByUserId"`
	CreatedAt               time.Time       `json:"createdAt"`
	AssignedCount           int             `json:"assignedCount,omitempty"`
}

type TaskFieldResponse struct {
	FieldID string `json:"fieldId"`
	Value   string `json:"value"`
}

type TaskAssignment struct {
	ID               string              `json:"id"`
	TemplateID       string              `json:"templateId"`
	TeacherProfileID string              `json:"teacherProfileId"`
	TeacherUserID    string              `json:"teacherUserId"`
	Period           string              `json:"period"`
	Status           string              `json:"status"`
	IsLate           bool                `json:"isLate"`
	AssignedAt       time.Time           `json:"assignedAt"`
	DueAt            *time.Time          `json:"dueAt,omitempty"`
	SubmittedAt      *time.Time          `json:"submittedAt,omitempty"`
	Responses        []TaskFieldResponse `json:"responses"`
	Title            string              `json:"title,omitempty"`
	Description      string              `json:"description,omitempty"`
	Fields           []TaskFormField     `json:"fields,omitempty"`
}

type CreateTaskTemplateInput struct {
	Title                   string          `json:"title"`
	Description             string          `json:"description"`
	Type                    string          `json:"type"`
	Recurrence              string          `json:"recurrence"`
	TargetMode              string          `json:"targetMode"`
	TargetInstitutionIDs    []string        `json:"targetInstitutionIds"`
	TargetTeacherProfileIDs []string        `json:"targetTeacherProfileIds"`
	Fields                  []TaskFormField `json:"fields"`
	DueDate                 *time.Time      `json:"dueDate"`
	IsActive                *bool           `json:"isActive"`
	CreatedByUserID         string          `json:"-"`
}

func currentTaskPeriod() string {
	now := time.Now()
	return fmt.Sprintf("%04d-%02d", now.Year(), int(now.Month()))
}

func (s *Store) ListTaskTemplates(ctx context.Context) ([]TaskTemplate, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `
		SELECT t.id::text, t.title, t.description, t.type, t.recurrence, t.target_mode,
		       COALESCE(array_to_json(t.target_institution_ids)::text, '[]'),
		       COALESCE(array_to_json(t.target_teacher_profile_ids)::text, '[]'),
		       t.fields, t.due_date, t.is_active, t.created_by_user_id::text, t.created_at,
		       (SELECT COUNT(*) FROM task_assignments a WHERE a.template_id = t.id)
		FROM task_templates t
		ORDER BY t.created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]TaskTemplate, 0)
	for rows.Next() {
		tpl, err := scanTaskTemplate(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, tpl)
	}
	return out, rows.Err()
}

func scanTaskTemplate(row pgx.Row) (TaskTemplate, error) {
	var t TaskTemplate
	var instJSON, teacherJSON string
	var fieldsRaw []byte
	var due pgtype.Timestamptz
	err := row.Scan(
		&t.ID, &t.Title, &t.Description, &t.Type, &t.Recurrence, &t.TargetMode,
		&instJSON, &teacherJSON, &fieldsRaw, &due, &t.IsActive, &t.CreatedByUserID, &t.CreatedAt,
		&t.AssignedCount,
	)
	if err != nil {
		return TaskTemplate{}, err
	}
	_ = json.Unmarshal([]byte(instJSON), &t.TargetInstitutionIDs)
	_ = json.Unmarshal([]byte(teacherJSON), &t.TargetTeacherProfileIDs)
	if t.TargetInstitutionIDs == nil {
		t.TargetInstitutionIDs = []string{}
	}
	if t.TargetTeacherProfileIDs == nil {
		t.TargetTeacherProfileIDs = []string{}
	}
	_ = json.Unmarshal(fieldsRaw, &t.Fields)
	if t.Fields == nil {
		t.Fields = []TaskFormField{}
	}
	if due.Valid {
		t.DueDate = &due.Time
	}
	return t, nil
}

func (s *Store) CreateTaskTemplate(ctx context.Context, in CreateTaskTemplateInput) (TaskTemplate, int, error) {
	if err := s.requireDB(); err != nil {
		return TaskTemplate{}, 0, err
	}
	title := strings.TrimSpace(in.Title)
	if title == "" {
		return TaskTemplate{}, 0, fmt.Errorf("%w: title required", ErrInvalidState)
	}
	typ := strings.ToUpper(strings.TrimSpace(in.Type))
	if typ != "ROUTINE" && typ != "ADHOC" {
		return TaskTemplate{}, 0, fmt.Errorf("%w: type must be ROUTINE or ADHOC", ErrInvalidState)
	}
	mode := strings.ToUpper(strings.TrimSpace(in.TargetMode))
	if mode == "" {
		mode = "ALL_TEACHERS"
	}
	recurrence := strings.ToUpper(strings.TrimSpace(in.Recurrence))
	if typ == "ROUTINE" && recurrence == "" {
		recurrence = "MONTHLY"
	}
	fieldsJSON, _ := json.Marshal(in.Fields)
	if in.Fields == nil {
		fieldsJSON = []byte("[]")
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return TaskTemplate{}, 0, err
	}
	defer tx.Rollback(ctx)

	var id string
	active := true
	if in.IsActive != nil {
		active = *in.IsActive
	}
	err = tx.QueryRow(ctx, `
		INSERT INTO task_templates (
			title, description, type, recurrence, target_mode,
			target_institution_ids, target_teacher_profile_ids, fields, due_date,
			is_active, created_by_user_id
		) VALUES (
			$1, $2, $3, $4, $5,
			COALESCE($6::uuid[], '{}'), COALESCE($7::uuid[], '{}'), $8::jsonb, $9,
			$10, $11::uuid
		)
		RETURNING id::text`,
		title, strings.TrimSpace(in.Description), typ, recurrence, mode,
		in.TargetInstitutionIDs, in.TargetTeacherProfileIDs, fieldsJSON, in.DueDate,
		active, in.CreatedByUserID,
	).Scan(&id)
	if err != nil {
		return TaskTemplate{}, 0, err
	}

	assigned := 0
	if active {
		assigned, err = s.generateAssignmentsTx(ctx, tx, id)
		if err != nil {
			return TaskTemplate{}, 0, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return TaskTemplate{}, 0, err
	}
	tpls, err := s.ListTaskTemplates(ctx)
	if err != nil {
		return TaskTemplate{}, 0, err
	}
	for _, t := range tpls {
		if t.ID == id {
			return t, assigned, nil
		}
	}
	return TaskTemplate{ID: id}, assigned, nil
}

func (s *Store) SetTaskTemplateActive(ctx context.Context, templateID string, active bool) (TaskTemplate, int, error) {
	if err := s.requireDB(); err != nil {
		return TaskTemplate{}, 0, err
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return TaskTemplate{}, 0, err
	}
	defer tx.Rollback(ctx)

	tag, err := tx.Exec(ctx, `UPDATE task_templates SET is_active = $2 WHERE id = $1::uuid`, templateID, active)
	if err != nil {
		return TaskTemplate{}, 0, err
	}
	if tag.RowsAffected() == 0 {
		return TaskTemplate{}, 0, ErrNotFound
	}
	assigned := 0
	if active {
		assigned, err = s.generateAssignmentsTx(ctx, tx, templateID)
		if err != nil {
			return TaskTemplate{}, 0, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return TaskTemplate{}, 0, err
	}
	tpls, err := s.ListTaskTemplates(ctx)
	if err != nil {
		return TaskTemplate{}, 0, err
	}
	for _, t := range tpls {
		if t.ID == templateID {
			return t, assigned, nil
		}
	}
	return TaskTemplate{}, assigned, ErrNotFound
}

func (s *Store) generateAssignmentsTx(ctx context.Context, tx pgx.Tx, templateID string) (int, error) {
	var typ, mode, recurrence string
	var due *time.Time
	var instJSON, teacherJSON string
	err := tx.QueryRow(ctx, `
		SELECT type, target_mode, recurrence, due_date,
		       COALESCE(array_to_json(target_institution_ids)::text, '[]'),
		       COALESCE(array_to_json(target_teacher_profile_ids)::text, '[]')
		FROM task_templates WHERE id = $1::uuid`, templateID,
	).Scan(&typ, &mode, &recurrence, &due, &instJSON, &teacherJSON)
	if err != nil {
		return 0, err
	}
	var instIDs, teacherIDs []string
	_ = json.Unmarshal([]byte(instJSON), &instIDs)
	_ = json.Unmarshal([]byte(teacherJSON), &teacherIDs)

	period := ""
	var dueAt *time.Time
	if typ == "ROUTINE" {
		period = currentTaskPeriod()
		y, m := time.Now().Year(), int(time.Now().Month())
		last := time.Date(y, time.Month(m)+1, 0, 23, 59, 0, 0, time.Local)
		dueAt = &last
	} else {
		dueAt = due
	}

	rows, err := tx.Query(ctx, `
		SELECT id::text, user_id::text, institution_id::text
		FROM teacher_profiles
		WHERE status = 'APPROVED'`)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	type teacherRow struct {
		ID, UserID, InstitutionID string
	}
	teachers := make([]teacherRow, 0)
	for rows.Next() {
		var t teacherRow
		if err := rows.Scan(&t.ID, &t.UserID, &t.InstitutionID); err != nil {
			return 0, err
		}
		teachers = append(teachers, t)
	}
	if err := rows.Err(); err != nil {
		return 0, err
	}

	instSet := map[string]struct{}{}
	for _, id := range instIDs {
		instSet[id] = struct{}{}
	}
	teacherSet := map[string]struct{}{}
	for _, id := range teacherIDs {
		teacherSet[id] = struct{}{}
	}

	created := 0
	for _, t := range teachers {
		ok := false
		switch mode {
		case "ALL_TEACHERS":
			ok = true
		case "SPECIFIC_INSTITUTIONS":
			_, ok = instSet[t.InstitutionID]
		case "SPECIFIC_TEACHERS":
			_, ok = teacherSet[t.ID]
		}
		if !ok {
			continue
		}
		tag, err := tx.Exec(ctx, `
			INSERT INTO task_assignments (
				template_id, teacher_profile_id, teacher_user_id, period, status, due_at
			) VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'PENDING', $5)
			ON CONFLICT (template_id, teacher_profile_id, period) DO NOTHING`,
			templateID, t.ID, t.UserID, period, dueAt)
		if err != nil {
			return created, err
		}
		if tag.RowsAffected() > 0 {
			created++
			var title, description string
			_ = tx.QueryRow(ctx, `SELECT title, description FROM task_templates WHERE id = $1::uuid`, templateID).Scan(&title, &description)
			deadline := ""
			if dueAt != nil {
				deadline = " Batas: " + dueAt.Format("2 Jan 2006")
			}
			_, _ = tx.Exec(ctx, `
				INSERT INTO user_notifications (user_id, type, title, body, link_tab)
				VALUES ($1::uuid, 'TASK_ASSIGNED', $2, $3, 'Tugas & Misi Yayasan')`,
				t.UserID,
				"Tugas baru: "+title,
				description+deadline,
			)
		}
	}
	return created, nil
}

func (s *Store) ListTaskAssignmentsAdmin(ctx context.Context, templateID string) ([]TaskAssignment, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	q := `
		SELECT a.id::text, a.template_id::text, a.teacher_profile_id::text, a.teacher_user_id::text,
		       a.period, a.status, a.is_late, a.assigned_at, a.due_at, a.submitted_at, a.responses,
		       t.title, t.description, t.fields
		FROM task_assignments a
		JOIN task_templates t ON t.id = a.template_id`
	args := []any{}
	if templateID != "" {
		q += ` WHERE a.template_id = $1::uuid`
		args = append(args, templateID)
	}
	q += ` ORDER BY a.assigned_at DESC`
	rows, err := s.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanTaskAssignments(rows)
}

func (s *Store) ListMyTaskAssignments(ctx context.Context, userID string) ([]TaskAssignment, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	// Mark overdue
	_, _ = s.pool.Exec(ctx, `
		UPDATE task_assignments
		SET status = 'OVERDUE'
		WHERE teacher_user_id = $1::uuid AND status = 'PENDING'
		  AND due_at IS NOT NULL AND due_at < NOW()`, userID)

	rows, err := s.pool.Query(ctx, `
		SELECT a.id::text, a.template_id::text, a.teacher_profile_id::text, a.teacher_user_id::text,
		       a.period, a.status, a.is_late, a.assigned_at, a.due_at, a.submitted_at, a.responses,
		       t.title, t.description, t.fields
		FROM task_assignments a
		JOIN task_templates t ON t.id = a.template_id
		WHERE a.teacher_user_id = $1::uuid
		ORDER BY
			CASE a.status WHEN 'PENDING' THEN 0 WHEN 'OVERDUE' THEN 1 ELSE 2 END,
			a.due_at NULLS LAST,
			a.assigned_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanTaskAssignments(rows)
}

func scanTaskAssignments(rows pgx.Rows) ([]TaskAssignment, error) {
	out := make([]TaskAssignment, 0)
	for rows.Next() {
		var a TaskAssignment
		var due, submitted pgtype.Timestamptz
		var respRaw, fieldsRaw []byte
		if err := rows.Scan(
			&a.ID, &a.TemplateID, &a.TeacherProfileID, &a.TeacherUserID,
			&a.Period, &a.Status, &a.IsLate, &a.AssignedAt, &due, &submitted, &respRaw,
			&a.Title, &a.Description, &fieldsRaw,
		); err != nil {
			return nil, err
		}
		if due.Valid {
			a.DueAt = &due.Time
		}
		if submitted.Valid {
			a.SubmittedAt = &submitted.Time
		}
		_ = json.Unmarshal(respRaw, &a.Responses)
		if a.Responses == nil {
			a.Responses = []TaskFieldResponse{}
		}
		_ = json.Unmarshal(fieldsRaw, &a.Fields)
		if a.Fields == nil {
			a.Fields = []TaskFormField{}
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (s *Store) SubmitTaskAssignment(ctx context.Context, assignmentID, userID string, responses []TaskFieldResponse) (TaskAssignment, error) {
	if err := s.requireDB(); err != nil {
		return TaskAssignment{}, err
	}
	respJSON, _ := json.Marshal(responses)
	// ponytail: late flag from pre-submit status; ceiling = no separate LATE status enum
	tag, err := s.pool.Exec(ctx, `
		UPDATE task_assignments
		SET status = 'SUBMITTED',
		    is_late = (status = 'OVERDUE'),
		    submitted_at = NOW(),
		    responses = $3::jsonb
		WHERE id = $1::uuid AND teacher_user_id = $2::uuid AND status IN ('PENDING', 'OVERDUE')`,
		assignmentID, userID, respJSON)
	if err != nil {
		return TaskAssignment{}, err
	}
	if tag.RowsAffected() == 0 {
		return TaskAssignment{}, ErrNotFound
	}
	list, err := s.ListMyTaskAssignments(ctx, userID)
	if err != nil {
		return TaskAssignment{}, err
	}
	for _, a := range list {
		if a.ID == assignmentID {
			return a, nil
		}
	}
	return TaskAssignment{}, ErrNotFound
}
