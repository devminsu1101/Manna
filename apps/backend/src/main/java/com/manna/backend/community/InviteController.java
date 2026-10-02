package com.manna.backend.community;

import com.manna.backend.auth.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 초대 링크(`/invite/{code}`)가 부르는 API. 명세는 docs/03_API_SPEC.md의 Community 절.
 * 미리보기(GET)만 비로그인이다(SecurityConfig).
 */
@RestController
@RequestMapping("/api/v1/invites")
public class InviteController {

    private final CommunityService service;
    private final CurrentUser currentUser;

    public InviteController(CommunityService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping("/{code}")                                      // 방 이름 미리보기 — 비로그인도 된다
    public CommunityService.InvitePreview preview(
            @AuthenticationPrincipal OidcUser principal,        // 비로그인이면 null
            @PathVariable String code) {
        return service.invite(principal == null ? null : currentUser.id(principal), code);
    }

    @PostMapping("/{code}/requests")                            // 가입 신청 → pending
    @ResponseStatus(HttpStatus.CREATED)
    public CommunityService.JoinRequested request(
            @AuthenticationPrincipal OidcUser principal,
            @PathVariable String code) {
        return service.requestJoin(currentUser.id(principal), code);
    }
}
