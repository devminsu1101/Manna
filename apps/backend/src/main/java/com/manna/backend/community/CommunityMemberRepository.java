package com.manna.backend.community;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CommunityMemberRepository extends JpaRepository<CommunityMember, Integer> {

    /** 내 목록. 방 이름을 곧바로 읽으므로 community를 함께 가져온다. */
    @EntityGraph(attributePaths = "community")
    List<CommunityMember> findByUser_IdOrderByJoinedAtAsc(Integer userId);

    /** 이 방에서의 내 멤버십. 없으면 멤버가 아니다. */
    Optional<CommunityMember> findByCommunity_IdAndUser_Id(Integer communityId, Integer userId);

    /** 대문의 멤버 목록. 이름·사진을 곧바로 읽으므로 user를 함께 가져온다. */
    @EntityGraph(attributePaths = "user")
    List<CommunityMember> findByCommunity_IdOrderByJoinedAtAsc(Integer communityId);

    /** 방별·상태별 인원 수. 목록에서 방마다 따로 세지 않으려고 한 쿼리로 묶는다. */
    @Query(
        "select m.community.id, m.status, count(m) from CommunityMember m"
            + " where m.community.id in :communityIds group by m.community.id, m.status")
    List<Object[]> countByStatus(Collection<Integer> communityIds);

    // ── 중보기도실이 쓰는 "볼 수 있는 사람" 규칙 ─────────────────────────
    // 나와 active로 같은 방에 있는 active 멤버(나 제외). 한쪽이라도 pending이면 서로 안 보인다.

    String SHARED_WITH_ME =
        "m.status = 'active' and m.user.id <> :me and m.community.id in"
            + " (select x.community.id from CommunityMember x"
            + " where x.user.id = :me and x.status = 'active')";

    /** 중보기도실. 한 사람이 방 수만큼 여러 행으로 온다 — 서비스가 사람 단위로 묶는다(D-905). */
    @EntityGraph(attributePaths = {"user", "community"})
    @Query("select m from CommunityMember m where " + SHARED_WITH_ME + " order by m.joinedAt")
    List<CommunityMember> findSharedWith(Integer me);

    /** 한 사람의 기도 상세. 비어 있으면 볼 수 없는 사람이다. */
    @EntityGraph(attributePaths = {"user", "community"})
    @Query(
        "select m from CommunityMember m where m.user.id = :other and " + SHARED_WITH_ME
            + " order by m.joinedAt")
    List<CommunityMember> findSharedWith(Integer me, Integer other);

    @Query("select count(m) > 0 from CommunityMember m where m.user.id = :other and " + SHARED_WITH_ME)
    boolean existsSharedWith(Integer me, Integer other);
}
