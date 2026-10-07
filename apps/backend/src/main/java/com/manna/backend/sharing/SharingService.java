package com.manna.backend.sharing;

import com.manna.backend.common.ApiException;
import com.manna.backend.community.CommunityService;
import com.manna.backend.domain.User;
import com.manna.backend.prayer.PrayerService;
import com.manna.backend.repository.UserRepository;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 나눔 API의 규칙. 응답 모양은 docs/03_API_SPEC.md의 Sharing 절 그대로다.
 *
 * <p>나눔은 방에 거는 글이다 — 공동체 없이는 올릴 수 없다(D-3501). 기도제목(D-3401)과 반대다.
 * 보는 규칙은 "이 나눔이 걸린 방 중 하나에라도 내가 active"이고, 작성자는 언제나 자기 글을 본다.
 * type='prayer'는 이 경로에 없는 것으로 친다(404) — 기도제목은 /pray 아래다.
 */
@Service
public class SharingService {

    private final SharingRepository sharings;
    private final CommunityService communities;
    private final UserRepository users;

    public SharingService(
            SharingRepository sharings, CommunityService communities, UserRepository users) {
        this.sharings = sharings;
        this.communities = communities;
        this.users = users;
    }

    // ── 응답 ─────────────────────────────────────────────────────────────

    public record Author(Integer userId, String name, String profileImageUrl) {}

    public record Item(
            Integer id,
            String type,
            String body,
            Author author,
            OffsetDateTime createdAt,
            boolean mine) {}

    public record ListResponse(List<Item> sharings) {}

    public record Created(Integer id) {}

    // ── POST /sharings ───────────────────────────────────────────────────

    @Transactional
    public Created create(Integer userId, String type, String body, List<Integer> communityIds) {
        if (!Sharing.DAILY.equals(type) && !Sharing.SCRIPTURE.equals(type)) {
            throw ApiException.badRequest("나눔 종류는 daily 또는 scripture입니다.");
        }
        Set<Integer> ids = new LinkedHashSet<>(communityIds);
        // 같은 규칙으로 막는다: 없는 방·pending 404, 비멤버 403.
        ids.forEach(id -> communities.requireActiveMember(id, userId));

        Sharing s =
            sharings.save(
                new Sharing(users.getReferenceById(userId), type, Sharing.PUBLIC, body.strip()));
        ids.forEach(id -> sharings.shareTo(s.getId(), id));
        return new Created(s.getId());
    }

    // ── GET /sharings?communityId= ───────────────────────────────────────

    // ponytail: 페이징 없음(D-3505). 한 방의 나눔이 수백 건을 넘으면 커서 페이징을 붙인다.
    @Transactional(readOnly = true)
    public ListResponse list(Integer userId, Integer communityId) {
        communities.requireActiveMember(communityId, userId);
        List<Sharing> found = sharings.findByCommunity(communityId);
        // 작성자를 한 번에 올려 둔다 — 아래 getAuthor()가 줄마다 쿼리하지 않게.
        users.findAllById(found.stream().map(s -> s.getAuthor().getId()).distinct().toList());
        return new ListResponse(found.stream().map(s -> toItem(s, userId)).toList());
    }

    // ── GET /sharings/{id} ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Item detail(Integer userId, Integer sharingId) {
        Sharing s = find(sharingId);
        if (!isMine(s, userId) && !sharings.isVisibleTo(sharingId, userId)) {
            throw notFound();
        }
        return toItem(s, userId);
    }

    // ── PATCH /sharings/{id} ─────────────────────────────────────────────

    @Transactional
    public void update(Integer userId, Integer sharingId, String body) {
        requireMine(userId, sharingId).updateBody(body.strip());
    }

    // ── DELETE /sharings/{id} ────────────────────────────────────────────

    @Transactional
    public void delete(Integer userId, Integer sharingId) {
        // sharing_communities는 ON DELETE CASCADE로 함께 지워진다.
        sharings.delete(requireMine(userId, sharingId));
    }

    // ── 권한 ─────────────────────────────────────────────────────────────

    private Sharing find(Integer sharingId) {
        return sharings
            .findById(sharingId)
            .filter(s -> !Sharing.PRAYER.equals(s.getType()))
            .orElseThrow(SharingService::notFound);
    }

    /** 작성자만. 못 보는 글이면 404(존재를 알리지 않는다), 보이는 남의 글이면 403. */
    private Sharing requireMine(Integer userId, Integer sharingId) {
        Sharing s = find(sharingId);
        if (isMine(s, userId)) {
            return s;
        }
        if (sharings.isVisibleTo(sharingId, userId)) {
            throw ApiException.forbidden("작성자만 할 수 있습니다.");
        }
        throw notFound();
    }

    private static boolean isMine(Sharing s, Integer userId) {
        return s.getAuthor().getId().equals(userId);
    }

    private static ApiException notFound() {
        return ApiException.notFound("없는 나눔입니다.");
    }

    private static Item toItem(Sharing s, Integer userId) {
        User a = s.getAuthor();
        return new Item(
            s.getId(),
            s.getType(),
            s.getBody(),
            new Author(a.getId(), a.getName(), a.getProfileImageUrl()),
            // 응답 시각은 +09:00(D-3402) — 화면이 앞 10자를 날짜로 쓴다.
            s.getCreatedAt().atZoneSameInstant(PrayerService.KST).toOffsetDateTime(),
            isMine(s, userId));
    }
}
