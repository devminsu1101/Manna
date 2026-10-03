package com.manna.backend.prayer;

import com.manna.backend.auth.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 기도 API. 명세는 docs/03_API_SPEC.md의 Pray 절. 로그인 필수(SecurityConfig).
 *
 * room · summary · requests는 {userId} 자리의 예약어다 — 고정 경로가 변수 경로보다 먼저 매칭된다.
 */
@RestController
@RequestMapping("/api/v1/pray")
public class PrayerController {

    private final PrayerService service;
    private final CurrentUser currentUser;

    public PrayerController(PrayerService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    public record CreateRequest(@NotBlank(message = "기도제목을 입력해 주세요.") String body) {}

    @GetMapping("/room")                                        // 중보기도실 — 정렬까지 서버가 한다
    public PrayerService.Room room(@AuthenticationPrincipal OidcUser principal) {
        return service.room(currentUser.id(principal));
    }

    @GetMapping("/summary")                                     // 홈의 "어제 N명이 기도했어요"
    public PrayerService.Summary summary(@AuthenticationPrincipal OidcUser principal) {
        return service.summary(currentUser.id(principal));
    }

    @GetMapping("/requests/me")                                 // 내 기도제목 이력
    public PrayerService.MyRequests myRequests(@AuthenticationPrincipal OidcUser principal) {
        return service.myRequests(currentUser.id(principal));
    }

    @PostMapping("/requests/me")                                // 새 기도제목 (쌓기만 한다)
    @ResponseStatus(HttpStatus.CREATED)
    public PrayerService.MyRequest create(
            @AuthenticationPrincipal OidcUser principal,
            @Valid @RequestBody CreateRequest req) {
        return service.createRequest(currentUser.id(principal), req.body());
    }

    @GetMapping("/requests/{userId}")                           // 한 사람의 기도 상세
    public PrayerService.Person person(
            @AuthenticationPrincipal OidcUser principal,
            @PathVariable Integer userId) {
        return service.person(currentUser.id(principal), userId);
    }

    @PostMapping("/{userId}")                                   // 기도했어요 — 멱등
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void pray(
            @AuthenticationPrincipal OidcUser principal,
            @PathVariable Integer userId) {
        service.pray(currentUser.id(principal), userId);
    }
}
