package com.manna.backend.auth;

import com.manna.backend.domain.User;
import com.manna.backend.domain.UserIdentity;
import com.manna.backend.repository.UserIdentityRepository;
import com.manna.backend.repository.UserRepository;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Google 로그인 성공 시 사용자를 찾거나 만든다(find-or-create).
 *
 * Google은 OIDC라 ID 토큰에 sub(안정적 고유 id)·name·email·picture가 들어온다.
 * sub를 user_identities.provider_uid로 삼아 재로그인 시 같은 사용자에 붙인다.
 *
 * 기본 OidcUserService가 표준 OidcUser를 만들어 주고, 우리는 그걸 받아 DB에만 반영한다.
 * 반환값은 그대로 표준 OidcUser라 세션의 principal로 쓰인다.
 */
@Service
public class OAuthUserService extends OidcUserService {

    private final UserRepository users;
    private final UserIdentityRepository identities;

    public OAuthUserService(UserRepository users, UserIdentityRepository identities) {
        this.users = users;
        this.identities = identities;
    }

    @Override
    @Transactional
    public OidcUser loadUser(OidcUserRequest userRequest) {
        OidcUser oidcUser = super.loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId(); // "google"
        String sub = oidcUser.getSubject();
        String name = oidcUser.getFullName() != null ? oidcUser.getFullName() : "익명";
        String email = oidcUser.getEmail();
        String picture = oidcUser.getPicture();

        identities
            .findByProviderAndProviderUid(provider, sub)
            .ifPresentOrElse(
                identity -> {
                    // 이름은 처음 가입할 때만 Google 값을 쓴다 — 마이페이지에서 고친 이름이
                    // 다음 로그인에 되돌아가면 안 된다(D-3608). 사진은 직접 올린 적이 없을 때만
                    // Google을 따라간다(D-3618).
                    User u = identity.getUser();
                    if (!ProfilePhoto.isUploaded(u.getProfileImageUrl())) {
                        u.setProfileImageUrl(picture);
                    }
                    identity.setEmail(email);
                },
                () -> {
                    User u = users.save(new User(name, picture));
                    identities.save(new UserIdentity(u, provider, sub, email));
                });

        return oidcUser;
    }
}
