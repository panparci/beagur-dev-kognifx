-- +goose Up
CREATE TYPE application_status AS ENUM (
    'PENDING_VALIDATION',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED'
);

CREATE TYPE donation_type AS ENUM ('ONE_TIME', 'RECURRING');

CREATE TYPE report_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    validator_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS institutions_validator_user_id_idx ON institutions (validator_user_id);

CREATE TRIGGER institutions_set_updated_at
BEFORE UPDATE ON institutions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS teacher_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
    full_name TEXT NOT NULL,
    photo_url TEXT NOT NULL DEFAULT '',
    teaching_photo_url TEXT NOT NULL DEFAULT '',
    job_title TEXT NOT NULL,
    years_of_service INT NOT NULL DEFAULT 0 CHECK (years_of_service >= 0),
    age INT CHECK (age IS NULL OR age > 0),
    monthly_salary BIGINT NOT NULL DEFAULT 0 CHECK (monthly_salary >= 0),
    phone_number TEXT NOT NULL DEFAULT '',
    bank_name TEXT NOT NULL DEFAULT '',
    bank_account_number TEXT NOT NULL DEFAULT '',
    total_received_count INT NOT NULL DEFAULT 0 CHECK (total_received_count >= 0),
    total_received_amount BIGINT NOT NULL DEFAULT 0 CHECK (total_received_amount >= 0),
    region TEXT NOT NULL DEFAULT '',
    reason TEXT NOT NULL DEFAULT '',
    status application_status NOT NULL DEFAULT 'PENDING_VALIDATION',
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS teacher_profiles_status_idx ON teacher_profiles (status);
CREATE INDEX IF NOT EXISTS teacher_profiles_institution_id_idx ON teacher_profiles (institution_id);
CREATE INDEX IF NOT EXISTS teacher_profiles_is_published_idx ON teacher_profiles (is_published);

CREATE TRIGGER teacher_profiles_set_updated_at
BEFORE UPDATE ON teacher_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    teacher_profile_id UUID REFERENCES teacher_profiles(id) ON DELETE SET NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    type donation_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS donations_donor_user_id_idx ON donations (donor_user_id);
CREATE INDEX IF NOT EXISTS donations_teacher_profile_id_idx ON donations (teacher_profile_id);
CREATE INDEX IF NOT EXISTS donations_created_at_idx ON donations (created_at DESC);

CREATE TABLE IF NOT EXISTS monthly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL,
    status report_status NOT NULL DEFAULT 'PENDING',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS monthly_reports_teacher_user_id_idx ON monthly_reports (teacher_user_id);
CREATE INDEX IF NOT EXISTS monthly_reports_status_idx ON monthly_reports (status);

CREATE TRIGGER monthly_reports_set_updated_at
BEFORE UPDATE ON monthly_reports
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- +goose Down
DROP TABLE IF EXISTS monthly_reports;
DROP TABLE IF EXISTS donations;
DROP TABLE IF EXISTS teacher_profiles;
DROP TABLE IF EXISTS institutions;
DROP TYPE IF EXISTS report_status;
DROP TYPE IF EXISTS donation_type;
DROP TYPE IF EXISTS application_status;
