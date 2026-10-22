package com.manna.backend.community;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface CommunityRepository extends JpaRepository<Community, Integer> {

    /** 초대 링크로 방 찾기. 재발급으로 바뀐 옛 코드는 안 잡힌다(D-1708). */
    Optional<Community> findByInviteCode(String inviteCode);

    /**
     * 방 삭제. 멤버 · 기도마니또 · 나눔 링크는 DB의 ON DELETE CASCADE가 지운다.
     * ⚠️ `deleteById`를 쓰지 않는다 — 권한 확인으로 읽어 둔 내 `CommunityMember`가 지워진 방을
     * 가리킨 채 남아 flush가 TransientPropertyValueException으로 터진다.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(nativeQuery = true, value = "DELETE FROM communities WHERE id = :id")
    void deleteWithCascade(Integer id);
}
