package com.manna.backend.prayer;

import com.manna.backend.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

/**
 * "기도했어요" 한 번. init-db.sql의 prayer_logs 테이블.
 *
 * 단위는 사람이고 하루 하나다(D-303, UNIQUE). prayedOn은 KST 날짜다(PrayerService.today).
 * 쓰기는 PrayerLogRepository.record(멱등 INSERT)로만 한다 — 이 생성자는 테스트가 지난 날짜를 심을 때 쓴다.
 */
@Entity
@Table(name = "prayer_logs")
public class PrayerLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prayed_for_user_id", nullable = false)
    private User prayedFor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pray_by", nullable = false)
    private User prayBy;

    @Column(name = "prayed_on", nullable = false)
    private LocalDate prayedOn;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected PrayerLog() {} // JPA

    public PrayerLog(User prayedFor, User prayBy, LocalDate prayedOn) {
        this.prayedFor = prayedFor;
        this.prayBy = prayBy;
        this.prayedOn = prayedOn;
    }
}
