package com.manna.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

/**
 * 사용자. apps/init-db.sql의 users 테이블에 매핑한다.
 *
 * 스키마를 Hibernate가 만들지 않는다(ddl-auto=validate) — init-db.sql이 진실이고
 * 이 엔티티는 그 테이블과 정확히 맞아야 검증을 통과한다. 그래서 id는 SERIAL(int4)에
 * 맞춰 Integer, created_at은 TIMESTAMPTZ에 맞춰 OffsetDateTime이다.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // SERIAL
    private Integer id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected User() {} // JPA

    public User(String name, String profileImageUrl) {
        this.name = name;
        this.profileImageUrl = profileImageUrl;
    }

    public Integer getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
