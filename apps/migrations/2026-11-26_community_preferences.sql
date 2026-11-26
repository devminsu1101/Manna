-- 사용자별 공동체 고정 및 나눔 목록 확인 시각.
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS sharings_read_at TIMESTAMPTZ;
