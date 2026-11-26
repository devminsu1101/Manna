package com.manna.backend.sharing;

import com.manna.backend.common.ApiException;
import com.manna.backend.notification.NotificationService;
import com.manna.backend.prayer.PrayerService;
import java.time.OffsetDateTime;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 대화는 글과 공동체의 쌍에 속한다. 글 작성자도 현재 active 멤버여야 읽고 참여한다. */
@Service
@Transactional
public class SharingDiscussionService {
    private final JdbcTemplate jdbc;
    private final NotificationService notifications;
    public SharingDiscussionService(JdbcTemplate jdbc, NotificationService notifications) {
        this.jdbc = jdbc;
        this.notifications = notifications;
    }
    public record Counts(long comments, long reactions, boolean hearted) {}
    public record Comment(int id, SharingService.Author author, String body, OffsetDateTime createdAt, boolean mine, boolean edited) {}
    public record Reaction(String key, long count, boolean mine) {}
    public record Discussion(List<Comment> comments, boolean hasMore, long commentCount, List<Reaction> reactions) {}
    private static final List<String> KEYS = List.of("heart");

    public boolean canParticipate(int me, int sharing, Integer room) {
        if (room == null) return false;
        return Boolean.TRUE.equals(jdbc.queryForObject("""
            SELECT EXISTS (SELECT 1 FROM sharing_communities sc
            JOIN sharings s ON s.id = sc.sharing_id
            JOIN community_members m ON m.community_id = sc.community_id
            WHERE sc.sharing_id = ? AND sc.community_id = ? AND s.type IN ('daily','scripture')
            AND m.user_id = ? AND m.status = 'active')
            """, Boolean.class, sharing, room, me));
    }
    private void requireAccess(int me, int sharing, int room) {
        if (!canParticipate(me, sharing, room)) throw ApiException.notFound("없는 나눔입니다.");
    }

    /** 목록에서는 방 전체 집계를 한 번만 조회한다. */
    @Transactional(readOnly = true)
    public Map<Integer, Counts> counts(int room, int me) {
        Map<Integer, Counts> result = new HashMap<>();
        jdbc.query("""
            SELECT sharing_id, sum(comments) AS comments, sum(reactions) AS reactions, bool_or(hearted) AS hearted FROM (
              SELECT sharing_id, count(*) AS comments, 0 AS reactions, false AS hearted FROM sharing_comments
              WHERE community_id = ? GROUP BY sharing_id
              UNION ALL
              SELECT sharing_id, 0, count(*), bool_or(user_id = ?) FROM sharing_reactions WHERE community_id = ? GROUP BY sharing_id
            ) c GROUP BY sharing_id
            """, rs -> { result.put(rs.getInt("sharing_id"), new Counts(rs.getLong("comments"), rs.getLong("reactions"), rs.getBoolean("hearted"))); }, room, me, room);
        return result;
    }

    @Transactional(readOnly = true)
    public Discussion read(int me, int sharing, int room, Integer before) {
        requireAccess(me, sharing, room);
        List<Comment> comments = new ArrayList<>(jdbc.query("""
            SELECT c.*, u.name, u.profile_image_url FROM sharing_comments c JOIN users u ON u.id = c.author_id
            WHERE c.sharing_id = ? AND c.community_id = ? AND c.id < ? ORDER BY c.id DESC LIMIT 51
            """, (rs, row) -> new Comment(rs.getInt("id"),
                new SharingService.Author(rs.getInt("author_id"), rs.getString("name"), rs.getString("profile_image_url")),
                rs.getString("body"), rs.getObject("created_at", OffsetDateTime.class)
                    .atZoneSameInstant(PrayerService.KST).toOffsetDateTime(), rs.getInt("author_id") == me, rs.getObject("updated_at") != null),
            sharing, room, before == null ? Integer.MAX_VALUE : before));
        boolean more = comments.size() > 50;
        if (more) comments.remove(comments.size() - 1);
        Collections.reverse(comments);
        long count = jdbc.queryForObject("SELECT count(*) FROM sharing_comments WHERE sharing_id = ? AND community_id = ?",
            Long.class, sharing, room);
        return new Discussion(comments, more, count, reactions(me, sharing, room));
    }

    public Comment comment(int me, int sharing, int room, String body, UUID requestId) {
        requireAccess(me, sharing, room);
        if (body == null || body.isBlank() || body.length() > 1000) throw ApiException.badRequest("댓글은 1~1000자로 입력해 주세요.");
        List<Integer> inserted = jdbc.queryForList("""
            INSERT INTO sharing_comments(sharing_id, community_id, author_id, body, request_id) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (sharing_id, community_id, author_id, request_id) DO NOTHING RETURNING id
            """, Integer.class, sharing, room, me, body.strip(), requestId);
        if (!inserted.isEmpty()) {
            Integer author = jdbc.queryForObject("SELECT author_id FROM sharings WHERE id = ?", Integer.class, sharing);
            if (author != me && canParticipate(author, sharing, room)) {
                String name = jdbc.queryForObject("SELECT name FROM users WHERE id = ?", String.class, me);
                notifications.notify(List.of(author), "sharing_comment", name + "님이 나눔에 댓글을 남겼어요",
                    "/sharings/" + sharing + "?communityId=" + room + "#comments");
            }
        }
        return jdbc.queryForObject("""
            SELECT c.*, u.name, u.profile_image_url FROM sharing_comments c JOIN users u ON u.id = c.author_id
            WHERE sharing_id = ? AND community_id = ? AND author_id = ? AND request_id = ?
            """, (rs, row) -> new Comment(rs.getInt("id"), new SharingService.Author(me, rs.getString("name"), rs.getString("profile_image_url")),
                rs.getString("body"), rs.getObject("created_at", OffsetDateTime.class).atZoneSameInstant(PrayerService.KST).toOffsetDateTime(), true, rs.getObject("updated_at") != null),
            sharing, room, me, requestId);
    }

    public Comment update(int me, int sharing, int room, int comment, String body) {
        requireAccess(me, sharing, room);
        if (body == null || body.isBlank() || body.length() > 1000) throw ApiException.badRequest("댓글은 1~1000자로 입력해 주세요.");
        List<Integer> authors = jdbc.queryForList("SELECT author_id FROM sharing_comments WHERE id = ? AND sharing_id = ? AND community_id = ? FOR UPDATE",
            Integer.class, comment, sharing, room);
        if (authors.isEmpty()) throw ApiException.notFound("없는 댓글입니다.");
        if (authors.get(0) != me) throw ApiException.forbidden("본인 댓글만 수정할 수 있습니다.");
        // 동일 본문 재저장·재시도는 수정 시각을 바꾸지 않는다. 수정 알림도 보내지 않는다.
        jdbc.update("UPDATE sharing_comments SET body = ?, updated_at = now() WHERE id = ? AND body IS DISTINCT FROM ?",
            body.strip(), comment, body.strip());
        return jdbc.queryForObject("""
            SELECT c.*, u.name, u.profile_image_url FROM sharing_comments c JOIN users u ON u.id = c.author_id WHERE c.id = ?
            """, (rs, row) -> new Comment(rs.getInt("id"), new SharingService.Author(me, rs.getString("name"), rs.getString("profile_image_url")),
                rs.getString("body"), rs.getObject("created_at", OffsetDateTime.class).atZoneSameInstant(PrayerService.KST).toOffsetDateTime(),
                true, rs.getObject("updated_at") != null), comment);
    }

    public void delete(int me, int sharing, int room, int comment) {
        requireAccess(me, sharing, room);
        List<Integer> authors = jdbc.queryForList("SELECT author_id FROM sharing_comments WHERE id = ? AND sharing_id = ? AND community_id = ?",
            Integer.class, comment, sharing, room);
        if (authors.isEmpty()) return;
        if (authors.get(0) != me) throw ApiException.forbidden("본인 댓글만 삭제할 수 있습니다.");
        jdbc.update("DELETE FROM sharing_comments WHERE id = ? AND author_id = ?", comment, me);
    }

    public List<Reaction> react(int me, int sharing, int room, String key) {
        requireAccess(me, sharing, room);
        if (key == null) {
            jdbc.update("DELETE FROM sharing_reactions WHERE sharing_id = ? AND community_id = ? AND user_id = ?", sharing, room, me);
        } else {
            if (!KEYS.contains(key)) throw ApiException.badRequest("지원하지 않는 반응입니다.");
            jdbc.update("""
                INSERT INTO sharing_reactions(sharing_id, community_id, user_id, reaction_key) VALUES (?, ?, ?, ?)
                ON CONFLICT (sharing_id, community_id, user_id) DO UPDATE SET reaction_key = EXCLUDED.reaction_key
                """, sharing, room, me, key);
        }
        return reactions(me, sharing, room);
    }
    private List<Reaction> reactions(int me, int sharing, int room) {
        Map<String, Reaction> found = new HashMap<>();
        jdbc.query("""
            SELECT reaction_key, count(*) AS n, bool_or(user_id = ?) AS mine FROM sharing_reactions
            WHERE sharing_id = ? AND community_id = ? GROUP BY reaction_key
            """, rs -> { String key = rs.getString("reaction_key"); found.put(key, new Reaction(key, rs.getLong("n"), rs.getBoolean("mine"))); }, me, sharing, room);
        return KEYS.stream().map(key -> found.getOrDefault(key, new Reaction(key, 0, false))).toList();
    }
}
