package com.manna.backend.notification;

import com.manna.backend.prayer.PrayerService;
import java.sql.Date;
import java.time.LocalDate;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** 자정에는 모든 사용자에게 빠진 기도 소식 알림을 만들고 푸시한다. */
@Component
public class DailyPrayerNotificationJob {
    private final JdbcTemplate jdbc;
    private final NotificationService notifications;

    public DailyPrayerNotificationJob(JdbcTemplate jdbc, NotificationService notifications) {
        this.jdbc = jdbc;
        this.notifications = notifications;
    }

    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Seoul")
    public void midnight() {
        runFor(LocalDate.now(PrayerService.KST).minusDays(1));
    }

    /** 재시작 시 자정 작업을 복구한다. 고유 키로 재실행은 안전하다. */
    @EventListener(ApplicationReadyEvent.class)
    public void catchUp() {
        midnight();
    }

    public void runFor(LocalDate prayerDate) {
        var counts = jdbc.query("SELECT prayed_for_user_id, count(*) FROM prayer_logs WHERE prayed_on = ? "
                + "GROUP BY prayed_for_user_id",
            (rs, rowNum) -> new long[] {rs.getLong(1), rs.getLong(2)}, Date.valueOf(prayerDate));
        for (long[] count : counts) {
            notifications.ensureDailyPrayer((int) count[0], prayerDate, count[1], true);
        }
    }
}
