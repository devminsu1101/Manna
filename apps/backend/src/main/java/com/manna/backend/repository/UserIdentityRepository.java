package com.manna.backend.repository;

import com.manna.backend.domain.UserIdentity;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserIdentityRepository extends JpaRepository<UserIdentity, Integer> {

    /**
     * 재로그인 시 이 조회로 기존 사용자를 찾는다. 없으면 새로 만든다(find-or-create).
     *
     * `user`를 함께 가져온다(@EntityGraph). 부르는 쪽 둘 다 곧바로 User를 읽는데
     * (MeController는 name·사진, OAuthUserService는 find-or-create 판정) `open-in-view=false`라
     * 컨트롤러엔 영속성 컨텍스트가 없어 LAZY 프록시를 건드리면 LazyInitializationException이 난다.
     * 연관을 EAGER로 바꾸지 않는 이유: 그건 이 엔티티를 읽는 모든 쿼리에 조인을 강제한다.
     * 필요한 이 조회에서만 켠다.
     */
    @EntityGraph(attributePaths = "user")
    Optional<UserIdentity> findByProviderAndProviderUid(String provider, String providerUid);
}
