package com.manna.backend.notification;

import com.manna.backend.auth.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class PushSubscriptionController {
    private final PushSubscriptionService service;
    private final CurrentUser currentUser;

    public PushSubscriptionController(PushSubscriptionService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping("/push-key")
    public PushSubscriptionService.PublicKey publicKey() {
        return service.publicKey();
    }

    @PostMapping("/subscriptions")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void register(@AuthenticationPrincipal OidcUser principal,
            @RequestBody PushSubscriptionService.Request request) {
        service.register(currentUser.id(principal), request);
    }

    @DeleteMapping("/subscriptions")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unregister(@AuthenticationPrincipal OidcUser principal,
            @RequestBody PushSubscriptionService.Endpoint request) {
        service.unregister(currentUser.id(principal), request);
    }
}
