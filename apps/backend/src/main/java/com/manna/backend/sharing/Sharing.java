package com.manna.backend.sharing;

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
 * 나눔. init-db.sql의 sharings 테이블. 기도제목은 type='prayer'인 나눔이다(별도 테이블 없음).
 *
 * 지금은 기도제목만 쓴다. 성경 참조 4컬럼과 sharing_communities는 나눔 도메인(Phase 3)이
 * 필요할 때 매핑한다 — validate는 엔티티에 없는 컬럼을 문제 삼지 않는다.
 * 기도제목은 공동체와 엮지 않는다(D-3401): 그 사람의 것이고, 누가 보는지는 조회 시점의
 * "같은 방 active" 규칙이 정한다.
 */
@Entity
@Table(name = "sharings")
public class Sharing {

    public static final String PRAYER = "prayer";
    public static final String PUBLIC = "public";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false, length = 20)
    private String visibility;

    @Column(nullable = false)
    private String body;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected Sharing() {} // JPA

    public Sharing(User author, String type, String visibility, String body) {
        this.author = author;
        this.type = type;
        this.visibility = visibility;
        this.body = body;
    }

    public Integer getId() {
        return id;
    }

    public User getAuthor() {
        return author;
    }

    public String getBody() {
        return body;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
