package com.manna.backend.notification;

import java.security.Security;
import java.util.List;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Encoding;
import org.apache.http.util.EntityUtils;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@Service
public class PushDeliveryService {
    private static final Logger log = LoggerFactory.getLogger(PushDeliveryService.class);
    private final JdbcTemplate jdbc;
    private final PushSubscriptionRepository subscriptions;
    private final NotificationRepository notifications;
    private final ObjectMapper mapper;
    private final PushService push;

    public PushDeliveryService(JdbcTemplate jdbc, PushSubscriptionRepository subscriptions,
            NotificationRepository notifications, ObjectMapper mapper,
            @Value("${push.vapid.public-key:}") String publicKey,
            @Value("${push.vapid.private-key:}") String privateKey,
            @Value("${push.vapid.subject:mailto:admin@example.com}") String subject) throws Exception {
        this.jdbc = jdbc;
        this.subscriptions = subscriptions;
        this.notifications = notifications;
        this.mapper = mapper;
        if (publicKey.isBlank() || privateKey.isBlank()) {
            this.push = null;
        } else {
            if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
                Security.addProvider(new BouncyCastleProvider());
            }
            PushService service = new PushService();
            service.setPublicKey(publicKey);
            service.setPrivateKey(privateKey);
            service.setSubject(subject);
            this.push = service;
        }
    }

    public record Payload(String title, String body, String linkPath) {}
    private record Job(long id, int notificationId, long subscriptionId, int attempts) {}

    /** 호출자의 알림 저장 트랜잭션에 참여한다. 저장 실패 시 발송 작업도 함께 사라진다. */
    @Transactional
    public void enqueue(Notification notification) {
        jdbc.update("INSERT INTO push_deliveries(notification_id, subscription_id) "
                + "SELECT ?, id FROM push_subscriptions WHERE user_id = ? ON CONFLICT DO NOTHING",
            notification.getId(), notification.getUserId());
    }

    @Scheduled(fixedDelay = 5000)
    public void deliverPending() {
        if (push == null) return;
        for (int i = 0; i < 30; i++) {
            List<Job> jobs = jdbc.query("""
                UPDATE push_deliveries SET attempts = attempts + 1,
                    claimed_until = now() + interval '90 seconds'
                WHERE id = (
                    SELECT id FROM push_deliveries
                    WHERE sent_at IS NULL AND next_attempt_at <= now()
                      AND (claimed_until IS NULL OR claimed_until < now())
                    ORDER BY next_attempt_at, id FOR UPDATE SKIP LOCKED LIMIT 1
                ) RETURNING id, notification_id, subscription_id, attempts
                """, (rs, row) -> new Job(rs.getLong(1), rs.getInt(2), rs.getLong(3), rs.getInt(4)));
            if (jobs.isEmpty()) break;
            deliver(jobs.get(0));
        }
    }

    private void deliver(Job job) {
        var subscription = subscriptions.findById(job.subscriptionId());
        var notification = notifications.findById(job.notificationId());
        if (subscription.isEmpty() || notification.isEmpty()
                || !subscription.get().getUserId().equals(notification.get().getUserId())
                || notification.get().isRead()) {
            jdbc.update("DELETE FROM push_deliveries WHERE id = ?", job.id());
            return;
        }
        try {
            Notification n = notification.get();
            byte[] payload = mapper.writeValueAsBytes(new Payload("만나", n.getBody(), n.getLinkPath()));
            PushSubscription s = subscription.get();
            var message = new nl.martijndwars.webpush.Notification(
                s.getEndpoint(), s.getP256dh(), s.getAuth(), payload);
            var response = push.send(message, Encoding.AES128GCM);
            int status = response.getStatusLine().getStatusCode();
            EntityUtils.consumeQuietly(response.getEntity());
            if (status >= 200 && status < 300) {
                jdbc.update("UPDATE push_deliveries SET sent_at = now(), claimed_until = NULL, last_error = NULL WHERE id = ?", job.id());
            } else if (status == 404 || status == 410) {
                subscriptions.deleteById(s.getId());
                log.info("Expired push subscription removed: subscriptionId={}", s.getId());
            } else {
                retry(job, "Push service HTTP " + status);
            }
        } catch (Exception e) {
            retry(job, e.getClass().getSimpleName());
            log.warn("Push delivery failed: jobId={} reason={}", job.id(), e.getClass().getSimpleName());
        }
    }

    private void retry(Job job, String reason) {
        long delaySeconds = Math.min(3600, 15L * (1L << Math.min(job.attempts() - 1, 8)));
        jdbc.update("UPDATE push_deliveries SET next_attempt_at = now() + (? * interval '1 second'), "
                + "claimed_until = NULL, last_error = ? WHERE id = ?",
            delaySeconds, reason, job.id());
    }
}
