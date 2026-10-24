package com.manna.backend.admin;

import com.manna.backend.auth.CurrentUser;
import com.manna.backend.common.ApiException;
import com.manna.backend.community.Community;
import com.manna.backend.community.CommunityMember;
import com.manna.backend.community.CommunityMemberRepository;
import com.manna.backend.community.CommunityRepository;
import com.manna.backend.domain.User;
import com.manna.backend.repository.UserRepository;
import com.manna.backend.sharing.Sharing;
import com.manna.backend.sharing.SharingRepository;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 읽기 전용 관리자(D-3625). `users.is_admin`인 사람만 — 아니면 403. 방에 속하지 않아도 전부 본다.
 *
 * 기존 API의 권한 확인(멤버만 · 같은 방 사람만)은 건드리지 않고 **따로** 둔다. 기존 응답은 "나" 기준
 * (내 역할 · 내가 오늘 기도했는지 · 내 기도마니또)이라 관리자에게는 맞지 않는다.
 *
 * ponytail: 전부 메모리에서 모으는 N+1이다. 사용자 · 방이 수십 단위일 때까지는 충분하다 — 느려지면 집계 쿼리로.
 */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final CurrentUser currentUser;
    private final UserRepository users;
    private final CommunityRepository communities;
    private final CommunityMemberRepository members;
    private final SharingRepository sharings;

    public AdminController(
            CurrentUser currentUser,
            UserRepository users,
            CommunityRepository communities,
            CommunityMemberRepository members,
            SharingRepository sharings) {
        this.currentUser = currentUser;
        this.users = users;
        this.communities = communities;
        this.members = members;
        this.sharings = sharings;
    }

    // ── 응답 ─────────────────────────────────────────────────────────────

    public record CommunityRow(
            Integer id,
            String name,
            String color,
            String leaderName,
            long memberCount,
            long pendingCount,
            OffsetDateTime createdAt) {}

    public record Person(Integer userId, String name, String profileImageUrl) {}

    public record MemberRow(
            Integer userId, String name, String profileImageUrl, String role, String status) {}

    public record SharingRow(
            Integer id, String type, String authorName, String body, OffsetDateTime createdAt) {}

    public record CommunityDetail(
            Integer id, String name, String color, List<MemberRow> members, List<SharingRow> sharings) {}

    public record UserRow(
            Integer id,
            String name,
            String profileImageUrl,
            List<String> communities,
            String latestRequest,
            OffsetDateTime createdAt) {}

    /** visibility: public | anonymous — 관리자는 익명 기도제목도 본다. */
    public record Request(Integer id, String body, String visibility, OffsetDateTime createdAt) {}

    public record UserDetail(Person user, List<String> communities, List<Request> requests) {}

    // ── GET /admin/communities ───────────────────────────────────────────

    @GetMapping("/communities")
    @Transactional(readOnly = true)
    public List<CommunityRow> communities(@AuthenticationPrincipal OidcUser principal) {
        requireAdmin(principal);
        return communities.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
            .map(
                c -> {
                    List<CommunityMember> all = members.findByCommunity_IdOrderByJoinedAtAsc(c.getId());
                    return new CommunityRow(
                        c.getId(),
                        c.getName(),
                        c.getColor(),
                        all.stream()
                            .filter(CommunityMember::isLeader)
                            .map(m -> m.getUser().getName())
                            .findFirst()
                            .orElse(null),
                        all.stream().filter(CommunityMember::isActive).count(),
                        all.stream().filter(m -> !m.isActive()).count(),
                        c.getCreatedAt());
                })
            .toList();
    }

    // ── GET /admin/communities/{id} ──────────────────────────────────────

    @GetMapping("/communities/{id}")
    @Transactional(readOnly = true)
    public CommunityDetail community(
            @AuthenticationPrincipal OidcUser principal, @PathVariable Integer id) {
        requireAdmin(principal);
        Community c =
            communities.findById(id).orElseThrow(() -> ApiException.notFound("없는 공동체입니다."));
        List<MemberRow> rows =
            members.findByCommunity_IdOrderByJoinedAtAsc(id).stream()
                .map(
                    m ->
                        new MemberRow(
                            m.getUser().getId(),
                            m.getUser().getName(),
                            m.getUser().getProfileImageUrl(),
                            m.getRole(),
                            m.getStatus()))
                .toList();
        List<SharingRow> posts =
            sharings.findByCommunity(id).stream()
                .map(
                    s ->
                        new SharingRow(
                            s.getId(), s.getType(), s.getAuthor().getName(), s.getBody(), s.getCreatedAt()))
                .toList();
        return new CommunityDetail(c.getId(), c.getName(), c.getColor(), rows, posts);
    }

    // ── GET /admin/users ─────────────────────────────────────────────────

    @GetMapping("/users")
    @Transactional(readOnly = true)
    public List<UserRow> users(@AuthenticationPrincipal OidcUser principal) {
        requireAdmin(principal);
        return users.findAll().stream()
            .sorted(Comparator.comparing(User::getCreatedAt).reversed())
            .map(
                u ->
                    new UserRow(
                        u.getId(),
                        u.getName(),
                        u.getProfileImageUrl(),
                        communityNames(u.getId()),
                        prayers(u.getId()).stream().findFirst().map(Sharing::getBody).orElse(null),
                        u.getCreatedAt()))
            .toList();
    }

    // ── GET /admin/users/{id} ────────────────────────────────────────────

    @GetMapping("/users/{id}")
    @Transactional(readOnly = true)
    public UserDetail user(@AuthenticationPrincipal OidcUser principal, @PathVariable Integer id) {
        requireAdmin(principal);
        User u = users.findById(id).orElseThrow(() -> ApiException.notFound("없는 사용자입니다."));
        return new UserDetail(
            new Person(u.getId(), u.getName(), u.getProfileImageUrl()),
            communityNames(id),
            prayers(id).stream()
                .map(s -> new Request(s.getId(), s.getBody(), s.getVisibility(), s.getCreatedAt()))
                .toList());
    }

    // ── 공통 ─────────────────────────────────────────────────────────────

    private void requireAdmin(OidcUser principal) {
        User me = users.findById(currentUser.id(principal)).orElseThrow(ApiException::unauthorized);
        if (!me.isAdmin()) {
            throw ApiException.forbidden("관리자만 볼 수 있습니다.");
        }
    }

    /** 최신이 맨 위. 익명 포함 전부. */
    private List<Sharing> prayers(Integer userId) {
        return sharings.findByAuthor_IdAndTypeOrderByCreatedAtDesc(userId, Sharing.PRAYER);
    }

    /** 승인 대기인 방은 이름 뒤에 표시한다. */
    private List<String> communityNames(Integer userId) {
        return members.findByUser_IdOrderByJoinedAtAsc(userId).stream()
            .map(m -> m.getCommunity().getName() + (m.isActive() ? "" : " (대기)"))
            .toList();
    }
}
