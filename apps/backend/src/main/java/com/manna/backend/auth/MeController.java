package com.manna.backend.auth;

import com.manna.backend.common.ApiException;
import com.manna.backend.domain.User;
import com.manna.backend.prayer.PrayerService;
import com.manna.backend.repository.UserIdentityRepository;
import com.manna.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 현재 로그인한 사용자. 프론트가 이걸 fetch해서 로그인 상태를 판정한다.
 *
 * 미인증이면 SecurityConfig가 먼저 401을 준다(여기 도달하지 않는다). 세션의 principal은
 * OIDC 사용자(Google sub·이름·사진)라, 우리 내부 user를 sub로 되찾아 {id,name,사진}으로 준다.
 */
@RestController
public class MeController {

    /** `users.name VARCHAR(50)`. */
    private static final int NAME_MAX = 50;

    private final UserIdentityRepository identities;
    private final UserRepository users;
    private final CurrentUser currentUser;
    private final PrayerService prayer;

    public MeController(
            UserIdentityRepository identities,
            UserRepository users,
            CurrentUser currentUser,
            PrayerService prayer) {
        this.identities = identities;
        this.users = users;
        this.currentUser = currentUser;
        this.prayer = prayer;
    }

    public record MeResponse(Integer id, String name, String profileImageUrl) {}

    /** 보낸 칸만 바꾼다. 둘 다 없으면 400. */
    public record UpdateMeRequest(String name, String profileImageUrl) {}

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

    /**
     * 이름 · 사진 고치기(D-3608 · D-3618). 로그인 때 Google 값으로 덮어쓰지 않으므로(OAuthUserService) 고친 값이 남는다.
     * 사진은 프론트 `POST /api/v1/me/photo`가 Vercel Blob에 올린 뒤 그 주소로 부른다 — Blob 주소만 받는다(ProfilePhoto).
     */
    @PatchMapping("/api/v1/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void update(@AuthenticationPrincipal OidcUser principal, @RequestBody UpdateMeRequest req) {
        if (req.name() == null && req.profileImageUrl() == null) {
            throw ApiException.badRequest("바꿀 값이 없어요.");
        }
        User u = users.findById(currentUser.id(principal)).orElseThrow(ApiException::unauthorized);
        if (req.name() != null) {
            String name = req.name().strip();
            if (name.isEmpty()) {
                throw ApiException.badRequest("이름을 입력해 주세요.");
            }
            if (name.length() > NAME_MAX) {
                throw ApiException.badRequest("이름은 " + NAME_MAX + "자까지예요.");
            }
            u.setName(name);
        }
        if (req.profileImageUrl() != null) {
            if (!ProfilePhoto.isUploaded(req.profileImageUrl())) {
                throw ApiException.badRequest("올린 사진 주소가 아니에요.");
            }
            u.setProfileImageUrl(req.profileImageUrl());
        }
        users.save(u);
    }

    /** 마이페이지 숫자. `period` = today · week · month · all · days(+ `days`). 명세는 03_API_SPEC. */
    @GetMapping("/api/v1/me/stats")
    public PrayerService.Stats stats(
            @AuthenticationPrincipal OidcUser principal,
            @RequestParam(required = false) String period,
            @RequestParam(required = false) Integer days) {
        return prayer.stats(currentUser.id(principal), period, days);
    }
}
