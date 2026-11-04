BEGIN;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS prayer_date DATE;

-- 기존 조회 시 생성된 기도 소식의 집계 날짜를 보존한다.
WITH ranked AS (
    SELECT id, ((created_at AT TIME ZONE 'Asia/Seoul')::date - 1) AS day,
           row_number() OVER (
               PARTITION BY user_id, ((created_at AT TIME ZONE 'Asia/Seoul')::date - 1)
               ORDER BY id
           ) AS rank
    FROM notifications WHERE type = 'prayed_for_you' AND prayer_date IS NULL
)
UPDATE notifications n SET prayer_date = ranked.day
FROM ranked WHERE n.id = ranked.id AND ranked.rank = 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_prayer_day
    ON notifications(user_id, prayer_date)
    WHERE type = 'prayed_for_you' AND prayer_date IS NOT NULL;

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

CREATE TABLE IF NOT EXISTS push_deliveries (
    id BIGSERIAL PRIMARY KEY,
    notification_id INT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    subscription_id BIGINT NOT NULL REFERENCES push_subscriptions(id) ON DELETE CASCADE,
    attempts INT NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    claimed_until TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    last_error VARCHAR(255),
    UNIQUE(notification_id, subscription_id)
);
CREATE INDEX IF NOT EXISTS idx_push_deliveries_pending ON push_deliveries(next_attempt_at)
    WHERE sent_at IS NULL;

COMMIT;
