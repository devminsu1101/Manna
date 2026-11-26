package com.manna.backend.update;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "update_posts")
@Getter
public class UpdatePost {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(nullable = false, length = 100)
    private String title;
    @Column(nullable = false)
    private String body;
    private String photoUrl;
    private OffsetDateTime publishedAt;
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected UpdatePost() {}

    public UpdatePost(String title, String body) { edit(title, body); }
    public void edit(String title, String body) { this.title = title; this.body = body; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public void publish() { publishedAt = OffsetDateTime.now(); }
}
