package com.manna.backend.community;

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
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

/**
 * 공동체 멤버십. init-db.sql의 community_members 테이블.
 *
 * role·status는 DB CHECK 제약의 소문자 문자열을 그대로 쓴다 — API 응답도 같은 값이라
 * enum으로 감쌌다가 다시 소문자로 푸는 변환이 필요 없다.
 */
@Entity
@Table(name = "community_members")
public class CommunityMember {

    public static final String LEADER = "leader";
    public static final String MEMBER = "member";
    public static final String PENDING = "pending";
    public static final String ACTIVE = "active";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "community_id", nullable = false)
    private Community community;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 20)
    private String role;

    @Column(nullable = false, length = 20)
    private String status;

    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private OffsetDateTime joinedAt;

    protected CommunityMember() {} // JPA

    public CommunityMember(Community community, User user, String role, String status) {
        this.community = community;
        this.user = user;
        this.role = role;
        this.status = status;
    }

    public Community getCommunity() {
        return community;
    }

    public User getUser() {
        return user;
    }

    public String getRole() {
        return role;
    }

    public String getStatus() {
        return status;
    }

    public boolean isLeader() {
        return LEADER.equals(role);
    }

    public boolean isActive() {
        return ACTIVE.equals(status);
    }
}
