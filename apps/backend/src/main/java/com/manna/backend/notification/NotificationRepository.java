package com.manna.backend.notification;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    /** 벨 시트의 목록 — 보관 기간 안에서 최신순 50개. */
    List<Notification> findTop50ByUserIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDescIdDesc(
        Integer userId, OffsetDateTime from);

    /** 빨간 점. `idx_notifications_unread`(read_at IS NULL 부분 인덱스)를 탄다. */
    long countByUserIdAndReadAtIsNullAndCreatedAtGreaterThanEqual(Integer userId, OffsetDateTime from);

    /** 기도 소식을 오늘 이미 만들었는지. */
    boolean existsByUserIdAndTypeAndCreatedAtGreaterThanEqual(
        Integer userId, String type, OffsetDateTime from);

    Optional<Notification> findByIdAndUserId(Integer id, Integer userId);
}
