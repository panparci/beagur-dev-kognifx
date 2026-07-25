-- +goose Up
-- Rekonsiliasi rekening koran, tugas/reminder guru, LMS pelatihan.

CREATE TABLE IF NOT EXISTS donor_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL DEFAULT '',
    account_number TEXT NOT NULL,
    account_holder TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (donor_user_id, account_number)
);

CREATE TABLE IF NOT EXISTS bank_statement_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('INCOMING', 'OUTGOING')),
    uploaded_by_user_id UUID NOT NULL REFERENCES users(id),
    total_lines INT NOT NULL DEFAULT 0,
    matched_count INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'REVIEW_NEEDED' CHECK (status IN ('REVIEW_NEEDED', 'COMPLETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bank_transaction_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID NOT NULL REFERENCES bank_statement_uploads(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('INCOMING', 'OUTGOING')),
    transaction_date DATE NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    counterparty_name TEXT NOT NULL DEFAULT '',
    counterparty_account TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    match_status TEXT NOT NULL DEFAULT 'UNMATCHED'
        CHECK (match_status IN ('UNMATCHED', 'SUGGESTED', 'MATCHED', 'IGNORED')),
    matched_donation_id UUID REFERENCES donations(id) ON DELETE SET NULL,
    matched_ledger_id UUID REFERENCES ledger_entries(id) ON DELETE SET NULL,
    suggested_donation_id UUID REFERENCES donations(id) ON DELETE SET NULL,
    suggested_ledger_id UUID REFERENCES ledger_entries(id) ON DELETE SET NULL,
    reviewed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_lines_upload ON bank_transaction_lines(upload_id);
CREATE INDEX IF NOT EXISTS idx_bank_lines_status ON bank_transaction_lines(match_status);

CREATE TABLE IF NOT EXISTS task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL CHECK (type IN ('ROUTINE', 'ADHOC')),
    recurrence TEXT NOT NULL DEFAULT '' CHECK (recurrence IN ('', 'MONTHLY')),
    target_mode TEXT NOT NULL CHECK (target_mode IN ('ALL_TEACHERS', 'SPECIFIC_INSTITUTIONS', 'SPECIFIC_TEACHERS')),
    target_institution_ids UUID[] NOT NULL DEFAULT '{}',
    target_teacher_profile_ids UUID[] NOT NULL DEFAULT '{}',
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    due_date TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER task_templates_set_updated_at
BEFORE UPDATE ON task_templates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
    teacher_profile_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
    teacher_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUBMITTED', 'OVERDUE')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    responses JSONB NOT NULL DEFAULT '[]'::jsonb,
    UNIQUE (template_id, teacher_profile_id, period)
);

CREATE INDEX IF NOT EXISTS idx_task_assignments_teacher ON task_assignments(teacher_user_id);

CREATE TABLE IF NOT EXISTS lms_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    cover_url TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Umum',
    lessons JSONB NOT NULL DEFAULT '[]'::jsonb,
    quiz JSONB NOT NULL DEFAULT '[]'::jsonb,
    pass_score INT NOT NULL DEFAULT 70,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER lms_courses_set_updated_at
BEFORE UPDATE ON lms_courses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS lms_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
    completed_lesson_ids TEXT[] NOT NULL DEFAULT '{}',
    quiz_score INT,
    quiz_attempts INT NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    certificate_number TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS live_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    host TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_min INT NOT NULL DEFAULT 60,
    meeting_url TEXT NOT NULL DEFAULT '',
    capacity INT NOT NULL DEFAULT 50,
    registered_user_ids UUID[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO permissions (code, name, description) VALUES
    ('reconciliation:read', 'Lihat Rekonsiliasi', 'Melihat upload dan baris rekening koran.'),
    ('reconciliation:write', 'Kelola Rekonsiliasi', 'Upload dan review matching rekening koran.'),
    ('tasks:read', 'Lihat Tugas Guru', 'Melihat template dan assignment tugas.'),
    ('tasks:write', 'Kelola Tugas Guru', 'Membuat tugas dan generate assignment.'),
    ('tasks:submit', 'Kirim Tugas Guru', 'Guru mengumpulkan respons tugas.'),
    ('lms:read', 'Lihat Pelatihan', 'Mengakses katalog kursus dan sesi live.'),
    ('lms:write', 'Kelola Pelatihan', 'CRUD kursus LMS dan sesi live.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.code IN (
    'reconciliation:read', 'reconciliation:write',
    'tasks:read', 'tasks:write',
    'lms:read', 'lms:write'
)
WHERE r.code = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.code IN ('tasks:read', 'tasks:submit', 'lms:read')
WHERE r.code = 'TEACHER'
ON CONFLICT DO NOTHING;

-- Seed 1 published course so teacher tab is usable after migrate.
INSERT INTO lms_courses (title, description, category, lessons, quiz, pass_score, is_published)
SELECT
  'Dasar Pedagogi Kelas Honorer',
  'Modul singkat teknik mengajar efektif di sekolah dengan fasilitas terbatas.',
  'Pedagogi',
  '[{"id":"l1","title":"Membuka kelas dengan hangat","type":"article","articleBody":"Sapa siswa, jelaskan tujuan hari ini dalam 2 menit, lalu mulai aktivitas.","durationMin":8},{"id":"l2","title":"Manajemen kelas sederhana","type":"article","articleBody":"Gunakan aturan kelas yang sedikit tetapi konsisten. Libatkan siswa sebagai penanggung jawab harian.","durationMin":10}]'::jsonb,
  '[{"id":"q1","prompt":"Langkah pertama membuka kelas yang baik?","options":["Langsung ujian","Sapa dan jelaskan tujuan","Memberi PR","Meninggalkan kelas"],"correctIndex":1}]'::jsonb,
  70,
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM lms_courses LIMIT 1);

-- +goose Down
DELETE FROM role_permissions WHERE permission_id IN (
    SELECT id FROM permissions WHERE code IN (
        'reconciliation:read', 'reconciliation:write',
        'tasks:read', 'tasks:write', 'tasks:submit',
        'lms:read', 'lms:write'
    )
);
DELETE FROM permissions WHERE code IN (
    'reconciliation:read', 'reconciliation:write',
    'tasks:read', 'tasks:write', 'tasks:submit',
    'lms:read', 'lms:write'
);
DROP TABLE IF EXISTS live_sessions;
DROP TABLE IF EXISTS lms_progress;
DROP TABLE IF EXISTS lms_courses;
DROP TABLE IF EXISTS task_assignments;
DROP TABLE IF EXISTS task_templates;
DROP TABLE IF EXISTS bank_transaction_lines;
DROP TABLE IF EXISTS bank_statement_uploads;
DROP TABLE IF EXISTS donor_bank_accounts;
