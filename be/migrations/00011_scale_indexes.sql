-- +goose Up
-- Indexes for public lists & validator queues under concurrent load

CREATE INDEX IF NOT EXISTS teacher_profiles_status_published_idx
  ON teacher_profiles (status, is_published)
  WHERE is_published = TRUE;

CREATE INDEX IF NOT EXISTS teacher_profiles_status_institution_idx
  ON teacher_profiles (status, institution_id);

CREATE INDEX IF NOT EXISTS teacher_profiles_institution_updated_idx
  ON teacher_profiles (institution_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS monthly_reports_submitted_at_idx
  ON monthly_reports (submitted_at DESC);

-- +goose Down
DROP INDEX IF EXISTS monthly_reports_submitted_at_idx;
DROP INDEX IF EXISTS teacher_profiles_institution_updated_idx;
DROP INDEX IF EXISTS teacher_profiles_status_institution_idx;
DROP INDEX IF EXISTS teacher_profiles_status_published_idx;
