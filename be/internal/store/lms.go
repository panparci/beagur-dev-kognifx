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

type LmsLesson struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Type        string `json:"type"` // video | article
	YoutubeID   string `json:"youtubeId,omitempty"`
	ArticleBody string `json:"articleBody,omitempty"`
	DurationMin int    `json:"durationMin,omitempty"`
}

type LmsQuizQuestion struct {
	ID            string   `json:"id"`
	Prompt        string   `json:"prompt"`
	Options       []string `json:"options"`
	CorrectIndex  int      `json:"correctIndex"`
}

type LmsCourse struct {
	ID          string            `json:"id"`
	Title       string            `json:"title"`
	Description string            `json:"description"`
	CoverURL    string            `json:"coverUrl"`
	Category    string            `json:"category"`
	Lessons     []LmsLesson       `json:"lessons"`
	Quiz        []LmsQuizQuestion `json:"quiz"`
	PassScore   int               `json:"passScore"`
	IsPublished bool              `json:"isPublished"`
	CreatedAt   time.Time         `json:"createdAt"`
}

type LmsProgress struct {
	ID                 string     `json:"id"`
	UserID             string     `json:"userId"`
	CourseID           string     `json:"courseId"`
	CompletedLessonIDs []string   `json:"completedLessonIds"`
	QuizScore          *int       `json:"quizScore,omitempty"`
	QuizAttempts       int        `json:"quizAttempts"`
	CompletedAt        *time.Time `json:"completedAt,omitempty"`
	CertificateNumber  string     `json:"certificateNumber"`
}

type LiveSession struct {
	ID                 string    `json:"id"`
	Title              string    `json:"title"`
	Host               string    `json:"host"`
	Description        string    `json:"description"`
	ScheduledAt        time.Time `json:"scheduledAt"`
	DurationMin        int       `json:"durationMin"`
	MeetingURL         string    `json:"meetingUrl"`
	Capacity           int       `json:"capacity"`
	RegisteredUserIDs  []string  `json:"registeredUserIds"`
	RegisteredCount    int       `json:"registeredCount"`
}

type UpsertLmsCourseInput struct {
	Title       string            `json:"title"`
	Description string            `json:"description"`
	CoverURL    string            `json:"coverUrl"`
	Category    string            `json:"category"`
	Lessons     []LmsLesson       `json:"lessons"`
	Quiz        []LmsQuizQuestion `json:"quiz"`
	PassScore   int               `json:"passScore"`
	IsPublished bool              `json:"isPublished"`
}

type SaveLmsProgressInput struct {
	CompletedLessonIDs []string `json:"completedLessonIds"`
	QuizScore          *int     `json:"quizScore"`
}

func (s *Store) ListLmsCourses(ctx context.Context, publishedOnly bool) ([]LmsCourse, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	q := `
		SELECT id::text, title, description, cover_url, category, lessons, quiz,
		       pass_score, is_published, created_at
		FROM lms_courses`
	if publishedOnly {
		q += ` WHERE is_published = TRUE`
	}
	q += ` ORDER BY created_at DESC`
	rows, err := s.pool.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanLmsCourses(rows)
}

func (s *Store) GetLmsCourse(ctx context.Context, id string) (LmsCourse, error) {
	if err := s.requireDB(); err != nil {
		return LmsCourse{}, err
	}
	row := s.pool.QueryRow(ctx, `
		SELECT id::text, title, description, cover_url, category, lessons, quiz,
		       pass_score, is_published, created_at
		FROM lms_courses WHERE id = $1::uuid`, id)
	return scanLmsCourse(row)
}

func scanLmsCourses(rows pgx.Rows) ([]LmsCourse, error) {
	out := make([]LmsCourse, 0)
	for rows.Next() {
		c, err := scanLmsCourse(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func scanLmsCourse(row pgx.Row) (LmsCourse, error) {
	var c LmsCourse
	var lessonsRaw, quizRaw []byte
	err := row.Scan(
		&c.ID, &c.Title, &c.Description, &c.CoverURL, &c.Category,
		&lessonsRaw, &quizRaw, &c.PassScore, &c.IsPublished, &c.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return LmsCourse{}, ErrNotFound
		}
		return LmsCourse{}, err
	}
	_ = json.Unmarshal(lessonsRaw, &c.Lessons)
	_ = json.Unmarshal(quizRaw, &c.Quiz)
	if c.Lessons == nil {
		c.Lessons = []LmsLesson{}
	}
	if c.Quiz == nil {
		c.Quiz = []LmsQuizQuestion{}
	}
	return c, nil
}

func (s *Store) CreateLmsCourse(ctx context.Context, in UpsertLmsCourseInput) (LmsCourse, error) {
	if err := s.requireDB(); err != nil {
		return LmsCourse{}, err
	}
	title := strings.TrimSpace(in.Title)
	if title == "" {
		return LmsCourse{}, fmt.Errorf("%w: title required", ErrInvalidState)
	}
	pass := in.PassScore
	if pass <= 0 {
		pass = 70
	}
	lessonsJSON, _ := json.Marshal(in.Lessons)
	quizJSON, _ := json.Marshal(in.Quiz)
	if in.Lessons == nil {
		lessonsJSON = []byte("[]")
	}
	if in.Quiz == nil {
		quizJSON = []byte("[]")
	}
	row := s.pool.QueryRow(ctx, `
		INSERT INTO lms_courses (title, description, cover_url, category, lessons, quiz, pass_score, is_published)
		VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8)
		RETURNING id::text, title, description, cover_url, category, lessons, quiz, pass_score, is_published, created_at`,
		title, strings.TrimSpace(in.Description), strings.TrimSpace(in.CoverURL),
		nullableCategory(in.Category), lessonsJSON, quizJSON, pass, in.IsPublished,
	)
	return scanLmsCourse(row)
}

func nullableCategory(c string) string {
	c = strings.TrimSpace(c)
	if c == "" {
		return "Umum"
	}
	return c
}

func (s *Store) UpdateLmsCourse(ctx context.Context, id string, in UpsertLmsCourseInput) (LmsCourse, error) {
	if err := s.requireDB(); err != nil {
		return LmsCourse{}, err
	}
	title := strings.TrimSpace(in.Title)
	if title == "" {
		return LmsCourse{}, fmt.Errorf("%w: title required", ErrInvalidState)
	}
	pass := in.PassScore
	if pass <= 0 {
		pass = 70
	}
	lessonsJSON, _ := json.Marshal(in.Lessons)
	quizJSON, _ := json.Marshal(in.Quiz)
	if in.Lessons == nil {
		lessonsJSON = []byte("[]")
	}
	if in.Quiz == nil {
		quizJSON = []byte("[]")
	}
	row := s.pool.QueryRow(ctx, `
		UPDATE lms_courses
		SET title = $2, description = $3, cover_url = $4, category = $5,
		    lessons = $6::jsonb, quiz = $7::jsonb, pass_score = $8, is_published = $9
		WHERE id = $1::uuid
		RETURNING id::text, title, description, cover_url, category, lessons, quiz, pass_score, is_published, created_at`,
		id, title, strings.TrimSpace(in.Description), strings.TrimSpace(in.CoverURL),
		nullableCategory(in.Category), lessonsJSON, quizJSON, pass, in.IsPublished,
	)
	return scanLmsCourse(row)
}

func (s *Store) ListMyLmsProgress(ctx context.Context, userID string) ([]LmsProgress, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `
		SELECT id::text, user_id::text, course_id::text,
		       COALESCE(array_to_json(completed_lesson_ids)::text, '[]'),
		       quiz_score, quiz_attempts, completed_at, certificate_number
		FROM lms_progress WHERE user_id = $1::uuid`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]LmsProgress, 0)
	for rows.Next() {
		p, err := scanLmsProgress(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func scanLmsProgress(row pgx.Row) (LmsProgress, error) {
	var p LmsProgress
	var lessonsJSON string
	var score pgtype.Int4
	var completed pgtype.Timestamptz
	err := row.Scan(
		&p.ID, &p.UserID, &p.CourseID, &lessonsJSON,
		&score, &p.QuizAttempts, &completed, &p.CertificateNumber,
	)
	if err != nil {
		return LmsProgress{}, err
	}
	_ = json.Unmarshal([]byte(lessonsJSON), &p.CompletedLessonIDs)
	if p.CompletedLessonIDs == nil {
		p.CompletedLessonIDs = []string{}
	}
	if score.Valid {
		v := int(score.Int32)
		p.QuizScore = &v
	}
	if completed.Valid {
		p.CompletedAt = &completed.Time
	}
	return p, nil
}

func (s *Store) SaveLmsProgress(ctx context.Context, userID, courseID string, in SaveLmsProgressInput) (LmsProgress, error) {
	if err := s.requireDB(); err != nil {
		return LmsProgress{}, err
	}
	course, err := s.GetLmsCourse(ctx, courseID)
	if err != nil {
		return LmsProgress{}, err
	}
	if !course.IsPublished {
		return LmsProgress{}, fmt.Errorf("%w: course not published", ErrInvalidState)
	}

	lessonIDs := in.CompletedLessonIDs
	if lessonIDs == nil {
		lessonIDs = []string{}
	}
	allLessonsDone := len(course.Lessons) > 0
	doneSet := map[string]struct{}{}
	for _, id := range lessonIDs {
		doneSet[id] = struct{}{}
	}
	for _, lesson := range course.Lessons {
		if _, ok := doneSet[lesson.ID]; !ok {
			allLessonsDone = false
			break
		}
	}
	if len(course.Lessons) == 0 {
		allLessonsDone = true
	}

	passed := false
	attemptsInc := 0
	if in.QuizScore != nil {
		attemptsInc = 1
		if *in.QuizScore >= course.PassScore {
			passed = true
		}
	}

	completed := allLessonsDone && (len(course.Quiz) == 0 || passed)
	cert := ""
	if completed {
		cert = fmt.Sprintf("CERT-BG-%s-%s", courseID[:8], userID[:8])
	}

	row := s.pool.QueryRow(ctx, `
		INSERT INTO lms_progress (
			user_id, course_id, completed_lesson_ids, quiz_score, quiz_attempts,
			completed_at, certificate_number
		) VALUES (
			$1::uuid, $2::uuid, $3::text[], $4, $5,
			CASE WHEN $6 THEN NOW() ELSE NULL END, $7
		)
		ON CONFLICT (user_id, course_id) DO UPDATE SET
			completed_lesson_ids = EXCLUDED.completed_lesson_ids,
			quiz_score = COALESCE(EXCLUDED.quiz_score, lms_progress.quiz_score),
			quiz_attempts = lms_progress.quiz_attempts + EXCLUDED.quiz_attempts,
			completed_at = CASE
				WHEN $6 THEN COALESCE(lms_progress.completed_at, NOW())
				ELSE lms_progress.completed_at
			END,
			certificate_number = CASE
				WHEN $6 AND lms_progress.certificate_number = '' THEN EXCLUDED.certificate_number
				ELSE lms_progress.certificate_number
			END,
			updated_at = NOW()
		RETURNING id::text, user_id::text, course_id::text,
		          COALESCE(array_to_json(completed_lesson_ids)::text, '[]'),
		          quiz_score, quiz_attempts, completed_at, certificate_number`,
		userID, courseID, lessonIDs, in.QuizScore, attemptsInc, completed, cert,
	)
	return scanLmsProgress(row)
}

func (s *Store) ListLiveSessions(ctx context.Context) ([]LiveSession, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `
		SELECT id::text, title, host, description, scheduled_at, duration_min, meeting_url, capacity,
		       COALESCE(array_to_json(registered_user_ids)::text, '[]')
		FROM live_sessions
		ORDER BY scheduled_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]LiveSession, 0)
	for rows.Next() {
		var sess LiveSession
		var regJSON string
		if err := rows.Scan(
			&sess.ID, &sess.Title, &sess.Host, &sess.Description, &sess.ScheduledAt,
			&sess.DurationMin, &sess.MeetingURL, &sess.Capacity, &regJSON,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal([]byte(regJSON), &sess.RegisteredUserIDs)
		if sess.RegisteredUserIDs == nil {
			sess.RegisteredUserIDs = []string{}
		}
		sess.RegisteredCount = len(sess.RegisteredUserIDs)
		out = append(out, sess)
	}
	return out, rows.Err()
}

type CreateLiveSessionInput struct {
	Title       string    `json:"title"`
	Host        string    `json:"host"`
	Description string    `json:"description"`
	ScheduledAt time.Time `json:"scheduledAt"`
	DurationMin int       `json:"durationMin"`
	MeetingURL  string    `json:"meetingUrl"`
	Capacity    int       `json:"capacity"`
}

func (s *Store) CreateLiveSession(ctx context.Context, in CreateLiveSessionInput) (LiveSession, error) {
	if err := s.requireDB(); err != nil {
		return LiveSession{}, err
	}
	title := strings.TrimSpace(in.Title)
	if title == "" {
		return LiveSession{}, fmt.Errorf("%w: title required", ErrInvalidState)
	}
	cap := in.Capacity
	if cap <= 0 {
		cap = 50
	}
	dur := in.DurationMin
	if dur <= 0 {
		dur = 60
	}
	var sess LiveSession
	var regJSON string
	err := s.pool.QueryRow(ctx, `
		INSERT INTO live_sessions (title, host, description, scheduled_at, duration_min, meeting_url, capacity)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id::text, title, host, description, scheduled_at, duration_min, meeting_url, capacity,
		          COALESCE(array_to_json(registered_user_ids)::text, '[]')`,
		title, strings.TrimSpace(in.Host), strings.TrimSpace(in.Description),
		in.ScheduledAt, dur, strings.TrimSpace(in.MeetingURL), cap,
	).Scan(
		&sess.ID, &sess.Title, &sess.Host, &sess.Description, &sess.ScheduledAt,
		&sess.DurationMin, &sess.MeetingURL, &sess.Capacity, &regJSON,
	)
	if err != nil {
		return LiveSession{}, err
	}
	_ = json.Unmarshal([]byte(regJSON), &sess.RegisteredUserIDs)
	if sess.RegisteredUserIDs == nil {
		sess.RegisteredUserIDs = []string{}
	}
	sess.RegisteredCount = 0
	return sess, nil
}

func (s *Store) RegisterLiveSession(ctx context.Context, sessionID, userID string) (LiveSession, error) {
	if err := s.requireDB(); err != nil {
		return LiveSession{}, err
	}
	tag, err := s.pool.Exec(ctx, `
		UPDATE live_sessions
		SET registered_user_ids = array_append(registered_user_ids, $2::uuid)
		WHERE id = $1::uuid
		  AND cardinality(registered_user_ids) < capacity
		  AND NOT ($2::uuid = ANY(registered_user_ids))`,
		sessionID, userID)
	if err != nil {
		return LiveSession{}, err
	}
	if tag.RowsAffected() == 0 {
		// either full, already registered, or missing
		sessions, listErr := s.ListLiveSessions(ctx)
		if listErr != nil {
			return LiveSession{}, listErr
		}
		for _, sess := range sessions {
			if sess.ID != sessionID {
				continue
			}
			for _, id := range sess.RegisteredUserIDs {
				if id == userID {
					return sess, nil // already registered = ok
				}
			}
			return LiveSession{}, fmt.Errorf("%w: session full or not found", ErrInvalidState)
		}
		return LiveSession{}, ErrNotFound
	}
	sessions, err := s.ListLiveSessions(ctx)
	if err != nil {
		return LiveSession{}, err
	}
	for _, sess := range sessions {
		if sess.ID == sessionID {
			return sess, nil
		}
	}
	return LiveSession{}, ErrNotFound
}
