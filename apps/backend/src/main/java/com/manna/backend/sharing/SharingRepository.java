package com.manna.backend.sharing;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface SharingRepository extends JpaRepository<Sharing, Integer> {

    /** 내 기도제목 이력. 최신이 맨 위(D-1902). */
    List<Sharing> findByAuthor_IdAndTypeOrderByCreatedAtDesc(Integer authorId, String type);

    /**
     * 사람마다 최신 공개 기도제목 하나(D-1706). 기도제목이 없는 사람은 결과에 없다.
     * 비공개(anonymous)는 열람 구역이 생길 때까지 누구에게도 내보내지 않는다(D-906).
     */
    @Query(
        nativeQuery = true,
        value =
            "SELECT DISTINCT ON (author_id) * FROM sharings"
                + " WHERE type = 'prayer' AND visibility = 'public' AND author_id IN (:authorIds)"
                + " ORDER BY author_id, created_at DESC")
    List<Sharing> findLatestPublicPrayers(Collection<Integer> authorIds);

    // ── 나눔(daily · scripture) ↔ 공동체. sharing_communities는 엔티티가 없다 ──────

    @Modifying
    @Query(
        nativeQuery = true,
        value = "INSERT INTO sharing_communities (sharing_id, community_id) VALUES (:sharingId, :communityId)")
    void shareTo(Integer sharingId, Integer communityId);

    /** 한 방의 나눔, 최신이 맨 위. 기도제목은 방에 걸리지 않으므로(D-3401) 여기 섞이지 않는다. */
    @Query(
        nativeQuery = true,
        value =
            "SELECT s.* FROM sharings s JOIN sharing_communities sc ON sc.sharing_id = s.id"
                + " WHERE sc.community_id = :communityId ORDER BY s.created_at DESC")
    List<Sharing> findByCommunity(Integer communityId);

    /**
     * 홈 "지금 공동체에서는"(D-3604). 내 방 사람들의 최근 나눔 · 기도제목, 내 것은 뺀다.
     * - 나눔: 내가 active인 방에 걸린 것
     * - 기도제목: 나와 active로 같은 방에 있는 사람의 공개 것(중보기도실과 같은 범위, D-3401)
     * 여러 방에 따로 올라간 같은 글(D-3507)은 작성자 · 종류 · 본문이 같으면 하나로 친다.
     */
    @Query(
        nativeQuery = true,
        value =
            "SELECT * FROM ("
                + " SELECT DISTINCT ON (s.author_id, s.type, s.body) s.* FROM sharings s"
                + " WHERE s.author_id <> :me AND ("
                + "  (s.type <> 'prayer' AND EXISTS (SELECT 1 FROM sharing_communities sc"
                + "    JOIN community_members m ON m.community_id = sc.community_id"
                + "    WHERE sc.sharing_id = s.id AND m.user_id = :me AND m.status = 'active'))"
                + "  OR (s.type = 'prayer' AND s.visibility = 'public' AND EXISTS (SELECT 1"
                + "    FROM community_members a JOIN community_members b ON b.community_id = a.community_id"
                + "    WHERE a.user_id = :me AND a.status = 'active'"
                + "    AND b.user_id = s.author_id AND b.status = 'active')))"
                + " ORDER BY s.author_id, s.type, s.body, s.created_at DESC"
                + ") t ORDER BY created_at DESC LIMIT :limit")
    List<Sharing> findFeed(Integer me, int limit);

    /**
     * 이 나눔이 걸린 방. 글 하나는 방 하나다(D-3507). D-3507 이전에 여러 방에 걸린 글은 내가
     * active인 방을 먼저 고른다. 방이 지워졌으면 비어 있다.
     */
    @Query(
        nativeQuery = true,
        value =
            "SELECT sc.community_id FROM sharing_communities sc"
                + " LEFT JOIN community_members m ON m.community_id = sc.community_id"
                + " AND m.user_id = :me AND m.status = 'active'"
                + " WHERE sc.sharing_id = :sharingId"
                + " ORDER BY (m.user_id IS NULL), sc.community_id LIMIT 1")
    Integer findCommunityOf(Integer sharingId, Integer me);

    /** 이 나눔이 걸린 방 중 하나에라도 내가 active인지. */
    @Query(
        nativeQuery = true,
        value =
            "SELECT EXISTS (SELECT 1 FROM sharing_communities sc"
                + " JOIN community_members m ON m.community_id = sc.community_id"
                + " WHERE sc.sharing_id = :sharingId AND m.user_id = :userId AND m.status = 'active')")
    boolean isVisibleTo(Integer sharingId, Integer userId);

    /**
     * 그 시각부터 내가 올린 나눔 수. 여러 방에 따로 올라간 같은 글(D-3507)은 종류 · 본문이 같으면
     * 하나로 친다 — 홈 소식(D-3604)과 같은 셈법. 기도제목은 나눔이 아니다.
     */
    @Query(
        nativeQuery = true,
        value =
            "SELECT count(*) FROM (SELECT DISTINCT type, body FROM sharings"
                + " WHERE author_id = :authorId AND type <> 'prayer' AND created_at >= :from) t")
    long countMySharingsSince(Integer authorId, OffsetDateTime from);
}
