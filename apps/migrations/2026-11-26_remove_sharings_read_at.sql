-- 읽음 추적을 제거한 백엔드 배포 후 적용한다. 기존 읽음 기록만 삭제한다.
ALTER TABLE community_members DROP COLUMN IF EXISTS sharings_read_at;
