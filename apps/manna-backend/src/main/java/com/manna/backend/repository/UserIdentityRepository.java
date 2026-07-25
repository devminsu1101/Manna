package com.manna.backend.repository;

import com.manna.backend.domain.UserIdentity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserIdentityRepository extends JpaRepository<UserIdentity, Integer> {

    /** 재로그인 시 이 조회로 기존 사용자를 찾는다. 없으면 새로 만든다(find-or-create). */
    Optional<UserIdentity> findByProviderAndProviderUid(String provider, String providerUid);
}
