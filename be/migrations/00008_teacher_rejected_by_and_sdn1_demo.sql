-- +goose Up
-- Jejak siapa menolak (VALIDATOR vs ADMIN) + reset demo SDN 1 untuk alur kepsek.

ALTER TABLE teacher_profiles
    ADD COLUMN IF NOT EXISTS rejected_by TEXT
    CHECK (rejected_by IS NULL OR rejected_by IN ('VALIDATOR', 'ADMIN'));

COMMENT ON COLUMN teacher_profiles.rejected_by IS
    'Diisi saat status REJECTED: VALIDATOR = ditolak kepala sekolah, ADMIN = ditolak yayasan.';

-- Guru A: antrian kepsek SDN 1 (PENDING_VALIDATION)
UPDATE teacher_profiles SET
    full_name = 'Guru Ani (A)',
    status = 'PENDING_VALIDATION'::application_status,
    is_published = FALSE,
    rejected_by = NULL,
    updated_at = NOW()
WHERE id = '33333333-3333-3333-3333-333333333302';

-- Guru B: sudah diterima final yayasan (APPROVED)
UPDATE teacher_profiles SET
    full_name = 'Guru Budi (B)',
    status = 'APPROVED'::application_status,
    is_published = TRUE,
    rejected_by = NULL,
    updated_at = NOW()
WHERE id = '33333333-3333-3333-3333-333333333301';

-- +goose Down
ALTER TABLE teacher_profiles DROP COLUMN IF EXISTS rejected_by;

UPDATE teacher_profiles SET
    full_name = 'Ibu Ani',
    status = 'PENDING_VALIDATION'::application_status,
    is_published = FALSE
WHERE id = '33333333-3333-3333-3333-333333333302';

UPDATE teacher_profiles SET
    full_name = 'Ibu Guru Budi',
    status = 'APPROVED'::application_status,
    is_published = TRUE
WHERE id = '33333333-3333-3333-3333-333333333301';
