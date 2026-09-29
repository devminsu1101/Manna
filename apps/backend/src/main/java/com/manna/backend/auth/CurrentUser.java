package com.manna.backend.auth;

import com.manna.backend.common.ApiException;
import com.manna.backend.repository.UserIdentityRepository;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Component;

/**
 * 세션의 principal(Google OIDC 사용자) → 우리 users.id.
 *
 * 세션에는 Google sub만 있어서 매 요청 user_identities를 한 번 조회한다(MeController와 같은 방식).
 */
@Component
public class CurrentUser {

    private final UserIdentityRepository identities;

    public CurrentUser(UserIdentityRepository identities) {
        this.identities = identities;
    }

    public Integer id(OidcUser principal) {
        if (principal == null) {
            throw ApiException.unauthorized();
        }
        // v1은 Google만. provider가 늘면 MeController와 함께 바꾼다.
        return identities
            .findByProviderAndProviderUid("google", principal.getSubject())
            .map(identity -> identity.getUser().getId())
            .orElseThrow(ApiException::unauthorized);
    }
}
