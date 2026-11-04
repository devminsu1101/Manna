package com.manna.backend.notification;

import com.manna.backend.common.ApiException;
import java.net.URI;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PushSubscriptionService {
    private final PushSubscriptionRepository subscriptions;
    private final String publicKey;
    private final String privateKey;

    public PushSubscriptionService(
            PushSubscriptionRepository subscriptions,
            @Value("${push.vapid.public-key:}") String publicKey,
            @Value("${push.vapid.private-key:}") String privateKey) {
        this.subscriptions = subscriptions;
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }

    public record Keys(String p256dh, String auth) {}
    public record Request(String endpoint, Keys keys) {}
    public record Endpoint(String endpoint) {}
    public record PublicKey(String publicKey) {}

    public PublicKey publicKey() {
        if (publicKey.isBlank() || privateKey.isBlank()) {
            throw new ApiException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                "푸시 알림 설정이 아직 준비되지 않았어요.");
        }
        return new PublicKey(publicKey);
    }

    @Transactional
    public void register(Integer userId, Request request) {
        publicKey();
        if (request == null || request.keys() == null || !validEndpoint(request.endpoint())
                || !validBase64(request.keys().p256dh(), 65)
                || !validBase64(request.keys().auth(), 16)) {
            throw ApiException.badRequest("올바른 알림 구독 정보가 아니에요.");
        }
        subscriptions.findByEndpoint(request.endpoint()).ifPresentOrElse(
            existing -> existing.update(userId, request.keys().p256dh(), request.keys().auth()),
            () -> subscriptions.save(new PushSubscription(
                userId, request.endpoint(), request.keys().p256dh(), request.keys().auth())));
    }

    @Transactional
    public void unregister(Integer userId, Endpoint request) {
        if (request == null || request.endpoint() == null) return;
        subscriptions.findByEndpoint(request.endpoint())
            .filter(s -> s.getUserId().equals(userId))
            .ifPresent(subscriptions::delete);
    }

    private static boolean validEndpoint(String endpoint) {
        if (endpoint == null || endpoint.length() > 2048) return false;
        try {
            URI uri = URI.create(endpoint);
            String host = uri.getHost();
            return "https".equals(uri.getScheme()) && host != null && host.contains(".")
                && !host.matches("[0-9.]+") && !host.contains(":")
                && !host.endsWith(".local") && !host.endsWith(".internal")
                && !host.endsWith(".localhost") && uri.getPort() == -1
                && uri.getUserInfo() == null && uri.getFragment() == null;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private static boolean validBase64(String value, int length) {
        if (value == null || value.length() > 256) return false;
        try {
            return Base64.getUrlDecoder().decode(value).length == length;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
