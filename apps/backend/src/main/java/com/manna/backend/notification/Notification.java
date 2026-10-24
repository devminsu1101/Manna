package com.manna.backend.notification;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

/**
 * 앱 안 알림(D-3627). init-db.sql의 notifications 테이블. `read_at`이 NULL이면 안 읽음 = 상단 벨의 빨간 점.
 *
 * 받는 사람은 id로만 든다 — 알림을 그리는 데 사용자 행이 필요 없고, 보내는 쪽이 여러 명에게 한꺼번에 만든다.
 */
@Entity
@Table(name = "notifications")
public class Notification {

    public static final String JOIN_REQUEST = "join_request";
    public static final String JOIN_APPROVED = "join_approved";
    public static final String NEW_SHARING = "new_sharing";
    public static final String PARTNERS_STARTED = "partners_started";
    public static final String PRAYED_FOR_YOU = "prayed_for_you";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(nullable = false)
    private String body;

    @Column(name = "link_path")
    private String linkPath;

    @Column(name = "read_at")
    private OffsetDateTime readAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected Notification() {} // JPA

    public Notification(Integer userId, String type, String body, String linkPath) {
        this.userId = userId;
        this.type = type;
        this.body = body;
        this.linkPath = linkPath;
    }

    public Integer getId() {
        return id;
    }

    public Integer getUserId() {
        return userId;
    }

    public String getType() {
        return type;
    }

    public String getBody() {
        return body;
    }

    public String getLinkPath() {
        return linkPath;
    }

    public boolean isRead() {
        return readAt != null;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    /** 이미 읽었으면 처음 읽은 시각을 그대로 둔다. */
    public void markRead() {
        if (readAt == null) readAt = OffsetDateTime.now();
    }
}
