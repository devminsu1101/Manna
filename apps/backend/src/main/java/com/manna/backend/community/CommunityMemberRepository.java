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
}
