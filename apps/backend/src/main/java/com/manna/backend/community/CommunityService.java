package com.manna.backend.community;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.manna.backend.common.ApiException;
import com.manna.backend.domain.User;
import com.manna.backend.repository.UserRepository;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 공동체 API의 규칙. 응답 모양은 docs/03_API_SPEC.md의 Community 절 그대로다.
 *
 * 응답 DTO를 트랜잭션 안에서 만든다 — open-in-view=false라 컨트롤러로 나간 엔티티의
 * LAZY 연관을 건드리면 LazyInitializationException이 난다.
 */
@Service
public class CommunityService {

    private static final String INVITE_ALPHABET =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final int INVITE_LENGTH = 10;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CommunityRepository communities;
    private final CommunityMemberRepository members;
    private final UserRepository users;

    public CommunityService(
            CommunityRepository communities,
            CommunityMemberRepository members,
            UserRepository users) {
        this.communities = communities;
        this.members = members;
        this.users = users;
    }

    // ── 응답 ─────────────────────────────────────────────────────────────
    // 리더에게만 가는 필드는 NON_NULL로 멤버 응답에서 필드째 뺀다(명세: "필드 자체가 없다").
    // prayerPartner는 null이어도 내보낸다 — 화면이 "아직 배정 전"으로 읽는 값이다.

    public record Created(Integer id, String name, String inviteCode) {}

    public record Summary(
            Integer id,
            String name,
            String status,
            @JsonInclude(JsonInclude.Include.NON_NULL) Long memberCount,
            @JsonInclude(JsonInclude.Include.NON_NULL) String role,
            @JsonInclude(JsonInclude.Include.NON_NULL) Long pendingCount) {}

    public record ListResponse(List<Summary> communities) {}

    public record Member(Integer userId, String name, String profileImageUrl, String role) {}

    public record PendingMember(Integer userId, String name) {}

    public record PrayerPartner(Integer userId, String name) {}

    public record Detail(
            Integer id,
            String name,
            String myRole,
            @JsonInclude(JsonInclude.Include.NON_NULL) String inviteCode,
            PrayerPartner prayerPartner,
            List<Member> members,
            @JsonInclude(JsonInclude.Include.NON_NULL) List<PendingMember> pendingMembers) {}

    // ── POST /communities ────────────────────────────────────────────────

    @Transactional
    public Created create(Integer userId, String name) {
        User me = users.getReferenceById(userId);
        Community c = communities.save(new Community(name.strip(), me, newInviteCode()));
        // ⚠️ status DEFAULT가 'pending'이라 명시하지 않으면 생성자가 자기 방에 승인 대기로 갇힌다.
        members.save(
            new CommunityMember(c, me, CommunityMember.LEADER, CommunityMember.ACTIVE));
        return new Created(c.getId(), c.getName(), c.getInviteCode());
    }

    // ── GET /communities ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ListResponse list(Integer userId) {
        List<CommunityMember> mine = members.findByUser_IdOrderByJoinedAtAsc(userId);

        // communityId → (status → count)
        Map<Integer, Map<String, Long>> counts = new HashMap<>();
        if (!mine.isEmpty()) {
            List<Integer> ids = mine.stream().map(m -> m.getCommunity().getId()).toList();
            for (Object[] row : members.countByStatus(ids)) {
                counts.computeIfAbsent((Integer) row[0], k -> new HashMap<>())
                    .put((String) row[1], (Long) row[2]);
            }
        }

        List<Summary> result =
            mine.stream()
                .map(
                    m -> {
                        Community c = m.getCommunity();
                        // pending은 방 이름 말고는 아무것도 못 본다 — 인원 수도 방의 내용이다(D-1707).
                        if (!m.isActive()) {
                            return new Summary(
                                c.getId(), c.getName(), m.getStatus(), null, null, null);
                        }
                        Map<String, Long> byStatus = counts.getOrDefault(c.getId(), Map.of());
                        long active = byStatus.getOrDefault(CommunityMember.ACTIVE, 0L);
                        if (!m.isLeader()) {
                            return new Summary(
                                c.getId(), c.getName(), m.getStatus(), active, null, null);
                        }
                        return new Summary(
                            c.getId(),
                            c.getName(),
                            m.getStatus(),
                            active,
                            m.getRole(),
                            byStatus.getOrDefault(CommunityMember.PENDING, 0L));
                    })
                .toList();
        return new ListResponse(result);
    }

    // ── GET /communities/{id} ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Detail detail(Integer userId, Integer communityId) {
        CommunityMember me = requireActiveMember(communityId, userId);
        Community c = me.getCommunity();
        boolean leader = me.isLeader();

        List<CommunityMember> all = members.findByCommunity_IdOrderByJoinedAtAsc(communityId);
        List<Member> active =
            all.stream()
                .filter(CommunityMember::isActive)
                .map(
                    m ->
                        new Member(
                            m.getUser().getId(),
                            m.getUser().getName(),
                            m.getUser().getProfileImageUrl(),
                            m.getRole()))
                .toList();
        List<PendingMember> pending =
            leader
                ? all.stream()
                    .filter(m -> !m.isActive())
                    .map(m -> new PendingMember(m.getUser().getId(), m.getUser().getName()))
                    .toList()
                : null;

        return new Detail(
            c.getId(),
            c.getName(),
            me.getRole(),
            leader ? c.getInviteCode() : null,
            null, // 배정 스케줄러가 Phase 3이라 당분간 항상 null(명세)
            active,
            pending);
    }

    // ── GET /invites/{code} ──────────────────────────────────────────────

    /**
     * 비로그인에게는 방 이름만(D-1005). 로그인했고 이미 그 방 사람이면 상태를 덧붙여, 화면이
     * active는 대문으로 보내고 pending은 "승인 대기 중"을 보여 주게 한다.
     * communityId는 active에게만 — pending에게 방 주소를 줄 이유가 없다(D-1707).
     */
    public record InvitePreview(
            String communityName,
            @JsonInclude(JsonInclude.Include.NON_NULL) Integer communityId,
            @JsonInclude(JsonInclude.Include.NON_NULL) String myStatus) {}

    @Transactional(readOnly = true)
    public InvitePreview invite(Integer userId, String code) {
        Community c = byInviteCode(code);
        CommunityMember m =
            userId == null
                ? null
                : members.findByCommunity_IdAndUser_Id(c.getId(), userId).orElse(null);
        if (m == null) {
            return new InvitePreview(c.getName(), null, null);
        }
        return new InvitePreview(
            c.getName(), m.isActive() ? c.getId() : null, m.getStatus());
    }

    // ── POST /invites/{code}/requests ────────────────────────────────────

    public record JoinRequested(Integer communityId, String status) {}

    @Transactional
    public JoinRequested requestJoin(Integer userId, String code) {
        Community c = byInviteCode(code);
        if (members.findByCommunity_IdAndUser_Id(c.getId(), userId).isPresent()) {
            throw ApiException.conflict("이미 신청했거나 멤버입니다.");
        }
        members.save(
            new CommunityMember(
                c, users.getReferenceById(userId), CommunityMember.MEMBER, CommunityMember.PENDING));
        return new JoinRequested(c.getId(), CommunityMember.PENDING);
    }

    // ── POST /communities/{id}/members/{userId}/approve ──────────────────

    @Transactional
    public void approve(Integer userId, Integer communityId, Integer targetUserId) {
        requireLeader(communityId, userId);
        CommunityMember target = requireMember(communityId, targetUserId);
        if (target.isActive()) {
            throw ApiException.conflict("이미 멤버입니다.");
        }
        target.approve();
    }

    // ── DELETE /communities/{id}/members/{userId} ────────────────────────
    // 거절 · 강퇴 · 나가기가 한 곳이다 — 셋 다 그 행을 지우는 일이다(명세).

    @Transactional
    public void remove(Integer userId, Integer communityId, Integer targetUserId) {
        if (!userId.equals(targetUserId)) {
            requireLeader(communityId, userId);
        }
        CommunityMember target = requireMember(communityId, targetUserId);
        // ponytail: MVP는 방마다 리더가 한 명(위임 없음, D-1707)이라 "리더 = 마지막 리더"로 본다.
        // 복수 리더가 생기면 active 리더 수를 세서 막는다.
        if (target.isLeader()) {
            throw ApiException.conflict("리더는 나갈 수 없습니다.");
        }
        members.delete(target);
    }

    // ── 권한 ─────────────────────────────────────────────────────────────

    private Community byInviteCode(String code) {
        return communities
            .findByInviteCode(code)
            .orElseThrow(() -> ApiException.notFound("없는 초대 링크입니다."));
    }

    private void requireLeader(Integer communityId, Integer userId) {
        if (!requireActiveMember(communityId, userId).isLeader()) {
            throw ApiException.forbidden("리더만 할 수 있습니다.");
        }
    }

    /** 승인·삭제 대상. 상태는 묻지 않는다 — pending도 대상이다. */
    private CommunityMember requireMember(Integer communityId, Integer userId) {
        return members
            .findByCommunity_IdAndUser_Id(communityId, userId)
            .orElseThrow(() -> ApiException.notFound("이 공동체의 멤버가 아닙니다."));
    }

    /**
     * 이 방의 승인된 멤버인지. 모든 "방 내용" API가 여기를 거친다.
     *
     * - 없는 방 → 404
     * - 멤버가 아님 → 403
     * - pending → 404. 403은 "방이 있긴 하다"를 알려 주는데, 승인 전에는 존재도 노출하지
     *   않는 것이 D-1707의 취지다(명세 공통 규약).
     */
    CommunityMember requireActiveMember(Integer communityId, Integer userId) {
        if (!communities.existsById(communityId)) {
            throw ApiException.notFound("없는 공동체입니다.");
        }
        CommunityMember m =
            members
                .findByCommunity_IdAndUser_Id(communityId, userId)
                .orElseThrow(() -> ApiException.forbidden("이 공동체의 멤버가 아닙니다."));
        if (!m.isActive()) {
            throw ApiException.notFound("없는 공동체입니다.");
        }
        return m;
    }

    // ponytail: 62^10 공간이라 충돌 재시도는 두지 않는다. 드물게 겹치면 UNIQUE 제약이 500으로 막는다.
    private static String newInviteCode() {
        StringBuilder sb = new StringBuilder(INVITE_LENGTH);
        for (int i = 0; i < INVITE_LENGTH; i++) {
            sb.append(INVITE_ALPHABET.charAt(RANDOM.nextInt(INVITE_ALPHABET.length())));
        }
        return sb.toString();
    }
}
