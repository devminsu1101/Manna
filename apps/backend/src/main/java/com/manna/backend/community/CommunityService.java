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

    // ── 권한 ─────────────────────────────────────────────────────────────

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
