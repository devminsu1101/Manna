package com.manna.backend.community;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.manna.backend.auth.ProfilePhoto;
import com.manna.backend.common.ApiException;
import com.manna.backend.domain.User;
import com.manna.backend.prayer.PrayerPartnerService;
import com.manna.backend.repository.UserRepository;
import com.manna.backend.sharing.SharingRepository;
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
    private final PrayerPartnerService partners;
    private final SharingRepository sharings;

    public CommunityService(
            CommunityRepository communities,
            CommunityMemberRepository members,
            UserRepository users,
            PrayerPartnerService partners,
            SharingRepository sharings) {
        this.communities = communities;
        this.members = members;
        this.users = users;
        this.partners = partners;
        this.sharings = sharings;
    }

    // ── 응답 ─────────────────────────────────────────────────────────────
    // 리더에게만 가는 필드는 NON_NULL로 멤버 응답에서 필드째 뺀다(명세: "필드 자체가 없다").
    // prayerPartner는 null이어도 내보낸다 — 화면이 "아직 배정 전"으로 읽는 값이다.
    // partnersStarted는 리더의 "기도마니또 시작하기" 버튼을 숨길지 정한다.

    public record Created(Integer id, String name, String inviteCode) {}

    /** color · coverImageUrl은 active에게만 — pending은 방 이름 말고 아무것도 못 본다(D-1707). */
    public record Summary(
            Integer id,
            String name,
            String status,
            @JsonInclude(JsonInclude.Include.NON_NULL) String color,
            @JsonInclude(JsonInclude.Include.NON_NULL) String coverImageUrl,
            @JsonInclude(JsonInclude.Include.NON_NULL) Long memberCount,
            @JsonInclude(JsonInclude.Include.NON_NULL) String role,
            @JsonInclude(JsonInclude.Include.NON_NULL) Long pendingCount) {}

    public record ListResponse(List<Summary> communities) {}

    public record Member(Integer userId, String name, String profileImageUrl, String role) {}

    public record PendingMember(Integer userId, String name, String profileImageUrl) {}

    /**
     * 카드는 사진 · 이름을 보여 주고 누르면 기도실로 간다(D-3622). 기도제목이 없어도 기도실에서 기도할 수
     * 있으므로(D-903) 예전의 hasRequest는 뺐다.
     */
    public record PrayerPartner(Integer userId, String name, String profileImageUrl) {}

    public record Detail(
            Integer id,
            String name,
            String color,
            String coverImageUrl,
            Integer myUserId,
            String myRole,
            @JsonInclude(JsonInclude.Include.NON_NULL) String inviteCode,
            PrayerPartner prayerPartner,
            boolean partnersStarted,
            List<Member> members,
            @JsonInclude(JsonInclude.Include.NON_NULL) List<PendingMember> pendingMembers) {}

    // ── POST /communities ────────────────────────────────────────────────

    /** color는 고르지 않았으면 null — 기본 yellow(DB DEFAULT와 같다). */
    @Transactional
    public Created create(Integer userId, String name, String color) {
        User me = users.getReferenceById(userId);
        Community c = new Community(name.strip(), me, newInviteCode());
        if (color != null) c.setColor(requireColor(color));
        communities.save(c);
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
                                c.getId(), c.getName(), m.getStatus(), null, null, null, null, null);
                        }
                        Map<String, Long> byStatus = counts.getOrDefault(c.getId(), Map.of());
                        long active = byStatus.getOrDefault(CommunityMember.ACTIVE, 0L);
                        if (!m.isLeader()) {
                            return new Summary(
                                c.getId(),
                                c.getName(),
                                m.getStatus(),
                                c.getColor(),
                                c.getCoverImageUrl(),
                                active,
                                null,
                                null);
                        }
                        return new Summary(
                            c.getId(),
                            c.getName(),
                            m.getStatus(),
                            c.getColor(),
                            c.getCoverImageUrl(),
                            active,
                            m.getRole(),
                            byStatus.getOrDefault(CommunityMember.PENDING, 0L));
                    })
                .toList();
        return new ListResponse(result);
    }

    // ── GET /communities/{id} ────────────────────────────────────────────

    // 쓰기 트랜잭션: 이번 주 기도마니또가 없으면 여기서 만든다(D-3603).
    @Transactional
    public Detail detail(Integer userId, Integer communityId) {
        CommunityMember me = requireActiveMember(communityId, userId);
        partners.ensureThisWeek(List.of(communityId));
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
                    .map(
                        m ->
                            new PendingMember(
                                m.getUser().getId(),
                                m.getUser().getName(),
                                m.getUser().getProfileImageUrl()))
                    .toList()
                : null;

        // 내가 이 방에서 맡은 사람. 주 중간에 나간 사람이면 숨긴다(active 목록에 없다).
        Integer partnerId = partners.myPartners(userId).get(communityId);
        PrayerPartner partner =
            active.stream()
                .filter(m -> m.userId().equals(partnerId))
                .findFirst()
                .map(m -> new PrayerPartner(m.userId(), m.name(), m.profileImageUrl()))
                .orElse(null);

        return new Detail(
            c.getId(),
            c.getName(),
            c.getColor(),
            c.getCoverImageUrl(),
            userId,
            me.getRole(),
            leader ? c.getInviteCode() : null,
            partner,
            partners.started(communityId),
            active,
            pending);
    }

    // ── PATCH /communities/{id} ──────────────────────────────────────────

    /**
     * 목록 카드 꾸미기(리더, D-3624). 보낸 칸만 바꾼다 — `PATCH /me`와 같은 규칙.
     * 커버는 프론트 `POST /api/v1/community-cover`가 Blob에 올린 뒤 그 주소로 부른다. Blob 주소만 받는다.
     */
    @Transactional
    public void update(Integer userId, Integer communityId, String color, String coverImageUrl) {
        if (color == null && coverImageUrl == null) {
            throw ApiException.badRequest("바꿀 값이 없어요.");
        }
        CommunityMember me = requireActiveMember(communityId, userId);
        if (!me.isLeader()) {
            throw ApiException.forbidden("리더만 할 수 있습니다.");
        }
        Community c = me.getCommunity();
        if (color != null) c.setColor(requireColor(color));
        if (coverImageUrl != null) {
            if (!ProfilePhoto.isUploaded(coverImageUrl)) {
                throw ApiException.badRequest("올린 사진 주소가 아니에요.");
            }
            c.setCoverImageUrl(coverImageUrl);
        }
    }

    private static String requireColor(String color) {
        if (!Community.COLORS.contains(color)) {
            throw ApiException.badRequest("고를 수 없는 색이에요.");
        }
        return color;
    }

    // ── POST /communities/{id}/partners ──────────────────────────────────

    /** 기도마니또 시작(리더, D-3602). 방을 만들고 멤버를 다 받은 뒤 한꺼번에 시작한다. */
    @Transactional
    public void startPartners(Integer userId, Integer communityId) {
        requireLeader(communityId, userId);
        partners.start(communityId);
    }

    // ── DELETE /communities/{id} ─────────────────────────────────────────

    /**
     * 공동체 삭제(리더). 리더에게는 나가기가 없고 이것이 방을 떠나는 길이다(D-3621).
     * 멤버 · 기도마니또 · 나눔 링크는 CASCADE로 따라가지만 나눔 행은 남으므로 먼저 지운다 —
     * 방마다 글이 따로라(D-3507) 이 방의 글은 이 방에만 걸려 있다. 기도제목은 방과 엮이지 않는다(D-3401).
     */
    @Transactional
    public void delete(Integer userId, Integer communityId) {
        requireLeader(communityId, userId);
        sharings.deleteOnlyIn(communityId);
        communities.deleteWithCascade(communityId);
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
    public CommunityMember requireActiveMember(Integer communityId, Integer userId) {
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
