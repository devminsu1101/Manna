package com.manna.backend.update;

import com.manna.backend.auth.ProfilePhoto;
import com.manna.backend.common.ApiException;
import com.manna.backend.domain.User;
import com.manna.backend.notification.NotificationService;
import com.manna.backend.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UpdatePostService {
    private final UpdatePostRepository posts;
    private final UserRepository users;
    private final NotificationService notifications;

    public UpdatePostService(UpdatePostRepository posts, UserRepository users, NotificationService notifications) {
        this.posts = posts; this.users = users; this.notifications = notifications;
    }

    public void requireAdmin(Integer me) {
        if (!users.findById(me).orElseThrow(() -> ApiException.forbidden("관리자만 사용할 수 있어요.")).isAdmin())
            throw ApiException.forbidden("관리자만 사용할 수 있어요.");
    }

    @Transactional(readOnly = true)
    public List<UpdatePost> list() { return posts.findByPublishedAtIsNotNullOrderByPublishedAtDescIdDesc(); }

    @Transactional(readOnly = true)
    public UpdatePost get(Integer id) {
        return posts.findById(id).filter(p -> p.getPublishedAt() != null)
            .orElseThrow(() -> ApiException.notFound("없는 업데이트 소식이에요."));
    }

    @Transactional(readOnly = true)
    public List<UpdatePost> adminList(Integer me) { requireAdmin(me); return posts.findAllByOrderByCreatedAtDescIdDesc(); }

    @Transactional(readOnly = true)
    public UpdatePost adminGet(Integer me, Integer id) {
        requireAdmin(me);
        return posts.findById(id).orElseThrow(() -> ApiException.notFound("없는 업데이트 소식이에요."));
    }

    public UpdatePost create(Integer me, String title, String body) {
        requireAdmin(me);
        return posts.saveAndFlush(new UpdatePost(title.trim(), body.trim()));
    }

    public UpdatePost edit(Integer me, Integer id, String title, String body) {
        requireAdmin(me);
        UpdatePost post = locked(id);
        post.edit(title.trim(), body.trim());
        return post;
    }

    public UpdatePost photo(Integer me, Integer id, String url) {
        requireAdmin(me);
        if (url != null && !ProfilePhoto.isUploaded(url)) throw ApiException.badRequest("사진 주소를 확인해 주세요.");
        UpdatePost post = locked(id);
        post.setPhotoUrl(url);
        return post;
    }

    public UpdatePost publish(Integer me, Integer id) {
        requireAdmin(me);
        UpdatePost post = locked(id);
        // 중복 클릭·재시도에도 게시 알림은 한 번만 저장한다.
        if (post.getPublishedAt() == null) {
            post.publish();
            // shortcut: 전체 수신자를 한 번에 읽는다. 회원 규모가 커지면 배치 생성으로 전환한다.
            notifications.notify(users.findAll().stream().map(User::getId).toList(),
                "update_published", "업데이트 소식: " + post.getTitle(), "/mypage/updates/" + id);
        }
        return post;
    }

    private UpdatePost locked(Integer id) {
        return posts.findForUpdate(id).orElseThrow(() -> ApiException.notFound("없는 업데이트 소식이에요."));
    }
}
