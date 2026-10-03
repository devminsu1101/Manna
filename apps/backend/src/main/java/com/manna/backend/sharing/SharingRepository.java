package com.manna.backend.sharing;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
