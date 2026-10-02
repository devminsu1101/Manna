package com.manna.backend.community;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityRepository extends JpaRepository<Community, Integer> {

    /** 초대 링크로 방 찾기. 재발급으로 바뀐 옛 코드는 안 잡힌다(D-1708). */
    Optional<Community> findByInviteCode(String inviteCode);
}
