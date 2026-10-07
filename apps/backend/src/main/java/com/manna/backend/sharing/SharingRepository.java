package com.manna.backend.sharing;

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

    /** 이 나눔이 걸린 방 중 하나에라도 내가 active인지. */
    @Query(
        nativeQuery = true,
        value =
            "SELECT EXISTS (SELECT 1 FROM sharing_communities sc"
                + " JOIN community_members m ON m.community_id = sc.community_id"
                + " WHERE sc.sharing_id = :sharingId AND m.user_id = :userId AND m.status = 'active')")
    boolean isVisibleTo(Integer sharingId, Integer userId);
}
