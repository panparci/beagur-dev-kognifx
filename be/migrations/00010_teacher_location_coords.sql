-- +goose Up
-- Koordinat lokasi mengajar guru (untuk peta landing page Indonesia).

ALTER TABLE teacher_profiles
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

UPDATE teacher_profiles SET latitude = -6.1751, longitude = 106.8650, region = 'Jakarta'
WHERE id = '33333333-3333-3333-3333-333333333301';

UPDATE teacher_profiles SET latitude = -6.2146, longitude = 106.8451, region = 'Jakarta'
WHERE id = '33333333-3333-3333-3333-333333333304';

UPDATE teacher_profiles SET latitude = -6.2297, longitude = 106.7974, region = 'Jakarta'
WHERE id = '33333333-3333-3333-3333-333333333305';

UPDATE teacher_profiles SET latitude = -6.9039, longitude = 107.6186, region = 'Bandung'
WHERE id = '33333333-3333-3333-3333-333333333306';

UPDATE teacher_profiles SET latitude = -6.9341, longitude = 107.6066, region = 'Bandung'
WHERE id = '33333333-3333-3333-3333-333333333307';

UPDATE teacher_profiles SET latitude = -7.2504, longitude = 112.7688, region = 'Surabaya'
WHERE id = '33333333-3333-3333-3333-333333333308';

UPDATE teacher_profiles SET latitude = -7.2653, longitude = 112.7428, region = 'Surabaya'
WHERE id = '33333333-3333-3333-3333-333333333309';

UPDATE teacher_profiles SET latitude = -6.1928, longitude = 106.8227, region = 'Jakarta'
WHERE id = '33333333-3333-3333-3333-333333333310';

UPDATE teacher_profiles SET latitude = -6.8881, longitude = 107.5959, region = 'Bandung'
WHERE id = '33333333-3333-3333-3333-333333333311';

UPDATE teacher_profiles SET latitude = -7.2831, longitude = 112.7328, region = 'Surabaya'
WHERE id = '33333333-3333-3333-3333-333333333312';

-- +goose Down
ALTER TABLE teacher_profiles
    DROP COLUMN IF EXISTS latitude,
    DROP COLUMN IF EXISTS longitude;
