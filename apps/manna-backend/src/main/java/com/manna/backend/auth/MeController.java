package com.manna.backend.auth;

import com.manna.backend.domain.User;
import com.manna.backend.repository.UserIdentityRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 현재 로그인한 사용자. 프론트가 이걸 fetch해서 로그인 상태를 판정한다.
 *
 * 미인증이면 SecurityConfig가 먼저 401을 준다(여기 도달하지 않는다). 세션의 principal은
 * OIDC 사용자(Google sub·이름·사진)라, 우리 내부 user를 sub로 되찾아 {id,name,사진}으로 준다.
 */
@RestController
public class MeController {

    private final UserIdentityRepository identities;

    public MeController(UserIdentityRepository identities) {
        this.identities = identities;
    }

    public record MeResponse(Integer id, String name, String profileImageUrl) {}

    @GetMapping("/api/v1/me")
    public ResponseEntity<MeResponse> me(@AuthenticationPrincipal OidcUser principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        // v1은 Google만. provider가 늘면 principal에 registrationId를 실어 여기서 함께 조회해야 한다.
        return identities
            .findByProviderAndProviderUid("google", principal.getSubject())
            .map(
                identity -> {
                    User u = identity.getUser();
                    return ResponseEntity.ok(
                        new MeResponse(u.getId(), u.getName(), u.getProfileImageUrl()));
                })
            .orElseGet(() -> ResponseEntity.status(401).build());
    }
}
