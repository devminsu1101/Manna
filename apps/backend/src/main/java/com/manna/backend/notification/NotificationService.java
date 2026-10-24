package com.manna.backend.notification;

import com.manna.backend.common.ApiException;
import com.manna.backend.prayer.PrayerLogRepository;
import com.manna.backend.prayer.PrayerService;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 앱 안 알림(D-3627). 푸시는 아직 없다 — 붙일 때 `notify` 안에서 함께 보낸다.
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

    public NotificationService(NotificationRepository notifications, PrayerLogRepository logs) {
        this.notifications = notifications;
        this.logs = logs;
    }

    public record Item(
            Integer id, String type, String body, String linkPath, boolean read, OffsetDateTime createdAt) {}

    public record ListResponse(List<Item> notifications) {}

    public record UnreadCount(long count) {}

    /** 여러 사람에게 같은 알림. 같은 사람이 두 번 들어와도 하나만 만든다. */
    @Transactional
    public void notify(Collection<Integer> userIds, String type, String body, String linkPath) {
        notifications.saveAll(
            new LinkedHashSet<>(userIds).stream()
                .map(id -> new Notification(id, type, body, linkPath))
                .toList());
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

    /** 하나씩 눌러야 읽음(사용자 결정). 남의 알림은 없는 것과 같다. */
    @Transactional
    public void read(Integer me, Integer id) {
        notifications
            .findByIdAndUserId(id, me)
            .orElseThrow(() -> ApiException.notFound("없는 알림입니다."))
            .markRead();
    }

    private void ensurePrayedForYou(Integer me) {
        LocalDate today = LocalDate.now(PrayerService.KST);
        OffsetDateTime todayStart = today.atStartOfDay(PrayerService.KST).toOffsetDateTime();
        if (notifications.existsByUserIdAndTypeAndCreatedAtGreaterThanEqual(
                me, Notification.PRAYED_FOR_YOU, todayStart)) {
            return;
        }
        // 마이페이지 맨 위 칸(PrayedForMe)과 같은 숫자 · 같은 문장이다 — 어제 기준(D-901).
        long yesterday = logs.countByPrayedFor_IdAndPrayedOn(me, today.minusDays(1));
        if (yesterday > 0) {
            notifications.save(
                new Notification(
                    me, Notification.PRAYED_FOR_YOU, "날 위해 " + yesterday + "명이 기도하고 있어요", "/prayer"));
        }
    }

    private static OffsetDateTime keepFrom() {
        return OffsetDateTime.now().minusDays(KEEP_DAYS);
    }
}
