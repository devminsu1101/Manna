-- 새 백엔드 배포 전에 적용. 기존 나눔은 유지하며 공동체별 대화만 추가한다.
CREATE TABLE IF NOT EXISTS sharing_comments (
    id SERIAL PRIMARY KEY,
    sharing_id INT NOT NULL,
    community_id INT NOT NULL,
    author_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 1000),
    request_id UUID NOT NULL,
    updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (sharing_id, community_id) REFERENCES sharing_communities(sharing_id, community_id) ON DELETE CASCADE,
    UNIQUE (sharing_id, community_id, author_id, request_id)
);
CREATE INDEX IF NOT EXISTS idx_sharing_comments_thread ON sharing_comments(sharing_id, community_id, id);
CREATE TABLE IF NOT EXISTS sharing_reactions (
    sharing_id INT NOT NULL,
    community_id INT NOT NULL,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_key VARCHAR(20) NOT NULL CHECK (reaction_key IN ('heart')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (sharing_id, community_id, user_id),
    FOREIGN KEY (sharing_id, community_id) REFERENCES sharing_communities(sharing_id, community_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sharing_comments_community ON sharing_comments(community_id, sharing_id);
CREATE INDEX IF NOT EXISTS idx_sharing_reactions_community ON sharing_reactions(community_id, sharing_id);
