package com.manna.backend.notification;

import com.manna.backend.common.ApiException;
import com.manna.backend.prayer.PrayerLogRepository;
import com.manna.backend.prayer.PrayerService;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 앱 안 알림과 푸시 발송 작업. 알림 행이 기준이며 푸시 실패는 원래 행에 영향이 없다.
 *
 * - **보내는 쪽이 부른다.** 가입 신청 · 승인 · 마니또 시작은 `CommunityService`, 새 나눔은 `SharingService`.
 *   이 서비스는 다른 서비스에 기대지 않는다 — 그래야 어디에 주입해도 순환이 생기지 않는다.
 * - **기도 소식만 읽을 때 만든다.** 스케줄러가 없어서다(기도마니또 주간 배정 `ensureThisWeek`와 같은 패턴).
 *   어제 날 위해 기도한 사람이 있고, 오늘(KST) 아직 안 만들었으면 하나. 0명이면 만들지 않는다(D-1705).
 * - 보관은 30일. 지난 것은 지우지 않고 목록 · 점에서만 뺀다.
 */
@Service
public class NotificationService {

    static final int KEEP_DAYS = 30;

    private final NotificationRepository notifications;
    private final PrayerLogRepository logs;
    private final PushDeliveryService push;
    private final JdbcTemplate jdbc;

    public NotificationService(NotificationRepository notifications, PrayerLogRepository logs,
            PushDeliveryService push, JdbcTemplate jdbc) {
        this.notifications = notifications;
        this.logs = logs;
        this.push = push;
        this.jdbc = jdbc;
    }

    public record Item(
            Integer id, String type, String body, String linkPath, boolean read, OffsetDateTime createdAt) {}

    public record ListResponse(List<Item> notifications) {}

    public record UnreadCount(long count) {}

    /** 여러 사람에게 같은 알림. 같은 사람이 두 번 들어와도 하나만 만든다. */
    @Transactional
    public void notify(Collection<Integer> userIds, String type, String body, String linkPath) {
        List<Notification> saved = notifications.saveAllAndFlush(
            new LinkedHashSet<>(userIds).stream()
                .map(id -> new Notification(id, type, body, linkPath))
                .toList());
        saved.forEach(push::enqueue);
    }

    @Transactional
    public Notification adminTest(Integer userId, String body) {
        Notification saved = notifications.saveAndFlush(
            new Notification(userId, Notification.ADMIN_TEST, body, "/mypage"));
        push.enqueue(saved);
        return saved;
    }

    @Transactional
    public ListResponse list(Integer me) {
        ensurePrayedForYou(me);
        return new ListResponse(
            notifications
                .findTop50ByUserIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDescIdDesc(me, keepFrom())
                .stream()
                .map(
                    n ->
                        new Item(
                            n.getId(),
                            n.getType(),
                            n.getBody(),
                            n.getLinkPath(),
                            n.isRead(),
                            n.getCreatedAt().atZoneSameInstant(PrayerService.KST).toOffsetDateTime()))
                .toList());
    }

    @Transactional
    public UnreadCount unreadCount(Integer me) {
        ensurePrayedForYou(me);
        return new UnreadCount(
            notifications.countByUserIdAndReadAtIsNullAndCreatedAtGreaterThanEqual(me, keepFrom()));
    }

    /** 벨을 여는 순간, 보관 기간·목록 개수와 무관하게 전부 읽는다. */
    @Transactional
    public ListResponse readAll(Integer me) {
        ensurePrayedForYou(me);
        notifications.markAllRead(me);
        return list(me);
    }

    /** 옛 개별 읽음 API는 호환을 위해 남긴다. 벨 화면은 readAll을 사용한다. */
    @Transactional
    public void read(Integer me, Integer id) {
        notifications
            .findByIdAndUserId(id, me)
            .orElseThrow(() -> ApiException.notFound("없는 알림입니다."))
            .markRead();
    }

    private void ensurePrayedForYou(Integer me) {
        LocalDate today = LocalDate.now(PrayerService.KST);
        LocalDate prayerDate = today.minusDays(1);
        if (notifications.findByUserIdAndTypeAndPrayerDate(me, Notification.PRAYED_FOR_YOU, prayerDate).isEmpty()) {
            ensureDailyPrayer(me, prayerDate, logs.countByPrayedFor_IdAndPrayedOn(me, prayerDate), false);
        }
    }

    /** 자정 이후 벨 조회와 오전 6시 배치가 같은 행을 공유한다. */
    @Transactional
    public void ensureDailyPrayer(Integer userId, LocalDate prayerDate, long count, boolean sendPush) {
        if (count <= 0) return;
        jdbc.update("INSERT INTO notifications(user_id, type, body, link_path, prayer_date) "
                + "VALUES (?, 'prayed_for_you', ?, '/prayer', ?) ON CONFLICT DO NOTHING",
            userId, "날 위해 " + count + "명이 기도하고 있어요", prayerDate);
        Notification n = notifications.findByUserIdAndTypeAndPrayerDate(
            userId, Notification.PRAYED_FOR_YOU, prayerDate).orElseThrow();
        if (sendPush && !n.isRead()) push.enqueue(n);
    }

    private static OffsetDateTime keepFrom() {
        return OffsetDateTime.now().minusDays(KEEP_DAYS);
    }
}
