package com.manna.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

/**
 * 소셜 로그인 연결. init-db.sql의 user_identities 테이블에 매핑.
 *
 * (provider, provider_uid)가 유니크 — 한 Google 계정(sub)은 한 사용자에 붙는다.
 * 한 사용자가 여러 provider를 연결할 수 있어 User와 N:1이다.
 */
@Entity
@Table(
    name = "user_identities",
    uniqueConstraints = @UniqueConstraint(columnNames = {"provider", "provider_uid"}))
public class UserIdentity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 20)
    private String provider; // google | kakao | naver

    @Column(name = "provider_uid", nullable = false)
    private String providerUid; // Google의 sub

    @Column private String email;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected UserIdentity() {} // JPA

    public UserIdentity(User user, String provider, String providerUid, String email) {
        this.user = user;
        this.provider = provider;
        this.providerUid = providerUid;
        this.email = email;
    }

    public Integer getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getProvider() {
        return provider;
    }

    public String getProviderUid() {
        return providerUid;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
