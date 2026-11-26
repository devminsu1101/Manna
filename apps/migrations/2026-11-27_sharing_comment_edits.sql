-- 기존 댓글은 미수정 상태로 유지한다. 새 백엔드 배포 전에 적용.
ALTER TABLE sharing_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
