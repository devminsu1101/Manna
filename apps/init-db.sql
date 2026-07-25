-- 데이터베이스 초기화
--
-- docker-compose가 /docker-entrypoint-initdb.d/init.sql로 마운트한다.
-- 주의: 이 스크립트는 데이터 볼륨이 비어 있을 때만 실행된다. 이미 뜬 적 있는 DB에
-- 스키마 변경을 반영하려면 `docker compose down -v`로 볼륨을 지우고 다시 올려야 한다.
--
-- 본문 적재는 여기서 하지 않는다. apps/frontend/scripts/build-bible-sql.mjs가 내는
-- bible-seed.sql을 psql로 부어 넣는다. 그쪽 파일 머리말 참고.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Books 테이블 (성경 권)
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    abbreviation VARCHAR(10) NOT NULL UNIQUE,
    -- 정경 순서 1~66. API의 book.order다.
    -- id로 대신하지 않는 이유: id는 SERIAL이라 적재 순서에 따라 달라지는 대리 키다.
    -- 정경 순서는 도메인 값이고, 이전/다음 권 이동(getPrevBook/getNextBook)이 여기 의존한다.
    -- 이름이 order가 아닌 이유: ORDER는 SQL 예약어라 쓸 때마다 큰따옴표를 달아야 한다.
    canonical_order INT NOT NULL UNIQUE,
    total_chapters INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chapters 테이블 (장)
CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    book_id INT NOT NULL REFERENCES books(id),
    chapter_num INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (book_id, chapter_num)
);

-- Verses 테이블 (절)
CREATE TABLE IF NOT EXISTS verses (
    id SERIAL PRIMARY KEY,
    chapter_id INT NOT NULL REFERENCES chapters(id),
    -- 절 번호. 묶인 절이면 시작 번호다.
    --
    -- 장 안에서 1..N으로 이어진다고 가정하면 안 된다. 개역개정은 번호를 건너뛴다 —
    -- 사도행전 24장은 6절 다음이 8절이고(6하반~8상반을 들어냈다, 본문이 직접 밝힌다),
    -- 전 성경에서 이 한 곳뿐이지만 실재한다. 배열 인덱스로 번호를 유도하면 그 장이 통째로 밀린다.
    verse_num INT NOT NULL,
    -- 개역개정이 여러 절을 한 단락으로 묶은 곳의 끝 번호. 묶이지 않았으면 NULL.
    -- 예: 신 6:18-19 → verse_num 18, end_verse_num 19. 전체 31,088절 중 11곳뿐이다.
    end_verse_num INT,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (chapter_id, verse_num),
    CONSTRAINT verses_end_after_start CHECK (end_verse_num IS NULL OR end_verse_num > verse_num)
);

-- 인덱스
CREATE INDEX idx_books_abbreviation ON books(abbreviation);
CREATE INDEX idx_chapters_book_id ON chapters(book_id);
CREATE INDEX idx_verses_chapter_id ON verses(chapter_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 도메인 스키마 (docs/06_ERD.md 참고)
--
-- 화면: docs/design/screens/. 위 성경 3테이블과 달리 여기는 사용자 데이터라
-- TIMESTAMPTZ를 쓴다 — 특히 기도 "하루 기준" 집계가 타임존에 민감하다.
-- PK는 성경 테이블과 맞춰 SERIAL.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 사용자 / 인증 ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    profile_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 소셜 로그인(Google/Kakao/Naver). 한 사용자가 여러 provider를 연결할 수 있어
-- users와 1:N으로 뗀다. provider별 고유 id로 재로그인 시 사용자를 찾는다.
CREATE TABLE IF NOT EXISTS user_identities (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL,          -- google | kakao | naver
    provider_uid VARCHAR(255) NOT NULL,     -- provider가 주는 계정 고유 id
    email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_identities_provider_valid CHECK (provider IN ('google','kakao','naver')),
    UNIQUE (provider, provider_uid)
);

-- ── 공동체 ─────────────────────────────────────────────────────────────
-- 계층 없이 평평하다. 카톡 단톡방처럼 생성 시 이름을 짓고 모임장이 바꿀 수 있다.
-- "푸른교회 수도권지부" 같은 계층은 이름 문자열로만 표현한다. parent_id를 두지 않는 이유:
-- 교회-지부-반 3단계가 확정된 요구가 아니고, 나중에 필요하면 그때 추가하는 게 낫다.
CREATE TABLE IF NOT EXISTS communities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_by INT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_members (
    id SERIAL PRIMARY KEY,
    community_id INT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member',  -- leader | member
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT community_members_role_valid CHECK (role IN ('leader','member')),
    UNIQUE (community_id, user_id)
);

-- ── 나눔 ───────────────────────────────────────────────────────────────
-- 타입 3종. 성경 참조는 scripture에만, 공개/익명은 prayer에만 의미가 있다.
-- prayer 타입이 곧 기도제목이다 — 작성 화면이 나눔과 동일해 별도 테이블을 두지 않는다.
-- 기도 상세는 그 사람의 "최신" prayer 나눔만 보여준다(ORDER BY created_at DESC LIMIT 1).
-- append-only라 이력은 남고, "최신만"은 조회 시점의 규칙이다.
CREATE TABLE IF NOT EXISTS sharings (
    id SERIAL PRIMARY KEY,
    author_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,                       -- daily | scripture | prayer
    visibility VARCHAR(20) NOT NULL DEFAULT 'public', -- public | anonymous (prayer에만 의미)
    body TEXT NOT NULL,
    -- 성경 참조(scripture 타입만). 삼하 5:1-10 → book_id + 5 + 1 + 10.
    book_id INT REFERENCES books(id),
    chapter_num INT,
    verse_start INT,
    verse_end INT,                                   -- 단절 참조(요 3:16)면 NULL
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT sharings_type_valid CHECK (type IN ('daily','scripture','prayer')),
    CONSTRAINT sharings_visibility_valid CHECK (visibility IN ('public','anonymous')),
    -- 성경 참조는 전부 있거나 전부 없어야 한다(부분 참조 금지).
    CONSTRAINT sharings_scripture_ref CHECK (
        (book_id IS NULL AND chapter_num IS NULL AND verse_start IS NULL) OR
        (book_id IS NOT NULL AND chapter_num IS NOT NULL AND verse_start IS NOT NULL)
    ),
    CONSTRAINT sharings_verse_range CHECK (verse_end IS NULL OR verse_end >= verse_start)
);

-- 나눔↔공동체 다대다. 슬랙 크로스포스트처럼 한 나눔을 작성 시 고른 여러 방에 공유한다.
CREATE TABLE IF NOT EXISTS sharing_communities (
    sharing_id INT NOT NULL REFERENCES sharings(id) ON DELETE CASCADE,
    community_id INT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    PRIMARY KEY (sharing_id, community_id)
);

-- ── 기도 ───────────────────────────────────────────────────────────────
-- "기도했어요" 로그. 단위는 **사람**이다(기도제목이 아니다).
--
-- 기도 상세의 버튼은 사람 카드(예: 김현정)에 하나 붙어 있지 제목마다 있지 않다. 좋아요식
-- (제목 기준)이면 인기 제목에 기도가 몰리는데, 중보기도의 취지와 어긋난다. 그래서 키가
-- (기도받는 사람, 기도한 사람, 날짜)다. 한 사람을 하루 한 번, 매일 리셋.
--
-- 카운트("어제 N명이 날 위해 기도")는 여기서 파생한다:
--   SELECT count(*) FROM prayer_logs WHERE prayed_for_user_id = :me AND prayed_on = :yesterday
-- sharing_id를 두지 않는 이유: 어느 제목을 보고 눌렀는지 기록하지 않기로 했고(한 사람은
-- 최신 제목 하나만 노출), 집중모드 "이미 기도한 사람 건너뛰기"도 사람 단위라 이 키로 충분하다.
CREATE TABLE IF NOT EXISTS prayer_logs (
    id SERIAL PRIMARY KEY,
    prayed_for_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 기도받는 사람
    pray_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,             -- 기도한 사람
    prayed_on DATE NOT NULL,                         -- 하루 기준. 같은 날 중복 방지.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT prayer_logs_not_self CHECK (prayed_for_user_id <> pray_by),
    UNIQUE (prayed_for_user_id, pray_by, prayed_on)
);

-- 기도짝: 공동체 내에서 주간 단위로 사람-사람을 잇는다. 스케줄러가 주마다 생성한다.
-- 방향이 있는 관계다(user_id가 partner_id를 위해 기도). 상호 매칭이면 두 행을 넣는다.
CREATE TABLE IF NOT EXISTS prayer_partners (
    id SERIAL PRIMARY KEY,
    community_id INT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,                         -- 그 주의 시작일(주 식별자)
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT prayer_partners_not_self CHECK (user_id <> partner_id),
    -- 한 공동체에서 한 주에 한 사람은 기도짝 하나. 화면의 "이번주 기도짝은 ○○님".
    UNIQUE (community_id, week_start, user_id)
);

-- ── 알림 ───────────────────────────────────────────────────────────────
-- read_at이 NULL이면 안 읽음 = 상단 벨의 빨간 배지. 부분 인덱스로 안읽음만 빠르게 센다.
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,              -- prayer_partner | new_sharing | prayed_for_you ...
    body TEXT NOT NULL,
    link_path VARCHAR(255),                 -- 누르면 갈 앱 경로. 예: /prayer
    read_at TIMESTAMPTZ,                    -- NULL이면 안 읽음
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 도메인 인덱스 — 외래키 조회 경로에 건다.
CREATE INDEX idx_user_identities_user ON user_identities(user_id);
CREATE INDEX idx_community_members_user ON community_members(user_id);
CREATE INDEX idx_community_members_community ON community_members(community_id);
CREATE INDEX idx_sharings_author ON sharings(author_id);
-- 그 사람의 최신 prayer 나눔을 뽑는 경로(author + type + 최신순).
CREATE INDEX idx_sharings_author_type_recent ON sharings(author_id, type, created_at DESC);
CREATE INDEX idx_sharing_communities_community ON sharing_communities(community_id);
-- "어제 나를 위해 기도한 사람" 집계 경로.
CREATE INDEX idx_prayer_logs_target_day ON prayer_logs(prayed_for_user_id, prayed_on);
CREATE INDEX idx_prayer_partners_lookup ON prayer_partners(community_id, week_start);
-- 안읽은 알림만 빠르게(배지). 읽은 알림은 인덱스에서 빠진다.
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;
