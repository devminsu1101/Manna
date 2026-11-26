-- 새 백엔드를 배포하기 전에 적용한다. 소식을 자동 게시하거나 알림을 생성하지 않는다.
CREATE TABLE IF NOT EXISTS update_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL CHECK (length(trim(title)) > 0),
    body TEXT NOT NULL CHECK (length(trim(body)) > 0 AND length(body) <= 10000),
    photo_url TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
