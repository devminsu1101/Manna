package com.manna.backend.notification;

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

/** 상단 벨(D-3627). 명세는 03_API_SPEC. */
@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService service;
    private final CurrentUser currentUser;

    public NotificationController(NotificationService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping                                                 // 최근 30일, 최신순 50개
    public NotificationService.ListResponse list(@AuthenticationPrincipal OidcUser principal) {
        return service.list(currentUser.id(principal));
    }

    @GetMapping("/unread-count")                                // 빨간 점
    public NotificationService.UnreadCount unreadCount(@AuthenticationPrincipal OidcUser principal) {
        return service.unreadCount(currentUser.id(principal));
    }

    @PostMapping("/{id}/read")                                  // 하나 읽음
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void read(@AuthenticationPrincipal OidcUser principal, @PathVariable Integer id) {
        service.read(currentUser.id(principal), id);
    }
}
