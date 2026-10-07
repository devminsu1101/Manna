package com.manna.backend.prayer;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.manna.backend.common.ApiException;
import com.manna.backend.community.CommunityMember;
import com.manna.backend.community.CommunityMemberRepository;
import com.manna.backend.domain.User;
import com.manna.backend.repository.UserRepository;
import com.manna.backend.sharing.Sharing;
import com.manna.backend.sharing.SharingRepository;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 기도 API의 규칙. 응답 모양은 docs/03_API_SPEC.md의 Pray 절 그대로다.
 *
 * <p>볼 수 있는 사람 = 나와 active로 같은 방에 있는 active 멤버(나 제외). 그 사람의 기도제목은
 * 최신 공개 것 하나다 — 기도제목은 공동체와 엮지 않으므로(D-3401) 어느 방에 올렸는지는 묻지 않는다.
 *
 * <p>"오늘"·"어제"는 KST다(D-3402). DB의 CURRENT_DATE는 서버 타임존(Railway는 UTC)을 따라
 * 아침 9시에 날이 바뀌므로 쓰지 않고, 여기서 계산해 넘긴다.
 */
@Service
public class PrayerService {

    public static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final CommunityMemberRepository members;
    private final SharingRepository sharings;
    private final PrayerLogRepository logs;
    private final UserRepository users;

    public PrayerService(
            CommunityMemberRepository members,
            SharingRepository sharings,
            PrayerLogRepository logs,
            UserRepository users) {
        this.members = members;
        this.sharings = sharings;
        this.logs = logs;
        this.users = users;
    }

    static LocalDate today() {
        return LocalDate.now(KST);
    }

    // ── 응답 ─────────────────────────────────────────────────────────────

    public record CommunityRef(Integer id, String name) {}

    /** daysAgo는 서버가 KST로 센다 — 화면이 createdAt을 파싱하지 않게(명세). */
    public record Request(String body, OffsetDateTime createdAt, long daysAgo) {}

    /** 중보기도실 카드이자 기도 상세. partnerIn은 기도짝 구획에만 있다(Phase 3). */
    public record Person(
            Integer userId,
            String name,
            String profileImageUrl,
            List<CommunityRef> communities,
            @JsonInclude(JsonInclude.Include.NON_NULL) List<CommunityRef> partnerIn,
            Request request,
            boolean prayedByMeToday) {}

    public record Room(List<Person> partners, List<Person> members) {}

    public record Partner(Integer userId, String name, String communityName) {}

    /** partner는 null이어도 내보낸다 — 화면이 partnerTotal과 함께 세 상태로 읽는다(명세). */
    public record Summary(long yesterdayCount, Partner partner, int partnerTotal) {}

    public record MyRequest(Integer id, String body, OffsetDateTime createdAt) {}

    public record MyRequests(List<MyRequest> requests) {}

    // ── GET /pray/room ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Room room(Integer me) {
        // 기도짝은 스케줄러(Phase 3)가 생기기 전까지 비어 있다.
        return new Room(List.of(), people(me, members.findSharedWith(me)));
    }

    // ── GET /pray/requests/{userId} ──────────────────────────────────────

    /** 볼 수 없는 사람은 404 — 존재 자체를 드러내지 않는다(D-1707). 나 자신도 여기 걸린다. */
    @Transactional(readOnly = true)
    public Person person(Integer me, Integer userId) {
        List<Person> found = people(me, members.findSharedWith(me, userId));
        if (found.isEmpty()) {
            throw ApiException.notFound("볼 수 없는 사람입니다.");
        }
        return found.get(0);
    }

    // ── POST /pray/{userId} ──────────────────────────────────────────────

    @Transactional
    public void pray(Integer me, Integer userId) {
        if (me.equals(userId)) {
            throw ApiException.badRequest("자신을 위한 기도는 기록하지 않습니다.");
        }
        if (!members.existsSharedWith(me, userId)) {
            throw ApiException.notFound("볼 수 없는 사람입니다.");
        }
        logs.record(userId, me, today());
    }

    // ── GET /pray/summary ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Summary summary(Integer me) {
        long yesterday = logs.countByPrayedFor_IdAndPrayedOn(me, today().minusDays(1));
        return new Summary(yesterday, null, 0);
    }

    // ── GET·POST /pray/requests/me ───────────────────────────────────────

    @Transactional(readOnly = true)
    public MyRequests myRequests(Integer me) {
        return new MyRequests(
            sharings.findByAuthor_IdAndTypeOrderByCreatedAtDesc(me, Sharing.PRAYER).stream()
                .map(PrayerService::toMyRequest)
                .toList());
    }

    /**
     * 새 기도제목. 고치지 않고 쌓는다(D-1706). 공동체가 없어도 저장한다(D-3401).
     * 비공개는 열람 구역(D-906)이 생길 때까지 받지 않는다(D-3403).
     */
    @Transactional
    public MyRequest createRequest(Integer me, String body) {
        Sharing s =
            sharings.saveAndFlush(
                new Sharing(users.getReferenceById(me), Sharing.PRAYER, Sharing.PUBLIC, body.strip()));
        return toMyRequest(s);
    }

    // ── 사람 카드 만들기 ─────────────────────────────────────────────────

    /**
     * 멤버십 행(사람 × 방)을 사람 카드로 묶고 정렬한다(D-905, D-1909).
     *
     * 정렬: 오늘 내가 안 한 사람 먼저 → 최근 기도제목 올린 사람 먼저(없으면 뒤) → 내가 오래 전에
     * 기도한 사람 먼저(한 번도 안 했으면 맨 앞) → id. 페이징이 없어 메모리에서 정렬한다.
     */
    private List<Person> people(Integer me, List<CommunityMember> rows) {
        Map<Integer, User> people = new LinkedHashMap<>();
        Map<Integer, List<CommunityRef>> communities = new HashMap<>();
        for (CommunityMember m : rows) {
            User u = m.getUser();
            people.putIfAbsent(u.getId(), u);
            communities
                .computeIfAbsent(u.getId(), k -> new ArrayList<>())
                .add(new CommunityRef(m.getCommunity().getId(), m.getCommunity().getName()));
        }
        if (people.isEmpty()) {
            return List.of();
        }

        Map<Integer, Sharing> latest = new HashMap<>();
        for (Sharing s : sharings.findLatestPublicPrayers(people.keySet())) {
            latest.put(s.getAuthor().getId(), s);
        }
        Map<Integer, LocalDate> lastPrayed = new HashMap<>();
        for (Object[] row : logs.lastPrayedBy(me, people.keySet())) {
            lastPrayed.put((Integer) row[0], (LocalDate) row[1]);
        }

        LocalDate today = today();
        Comparator<Integer> order =
            Comparator.<Integer, Boolean>comparing(id -> today.equals(lastPrayed.get(id)))
                .thenComparing(
                    id -> latest.containsKey(id) ? latest.get(id).getCreatedAt() : null,
                    Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(lastPrayed::get, Comparator.nullsFirst(Comparator.naturalOrder()))
                .thenComparing(Comparator.naturalOrder());

        return people.keySet().stream()
            .sorted(order)
            .map(
                id -> {
                    User u = people.get(id);
                    Sharing s = latest.get(id);
                    return new Person(
                        id,
                        u.getName(),
                        u.getProfileImageUrl(),
                        communities.get(id),
                        null,
                        s == null ? null : toRequest(s, today),
                        today.equals(lastPrayed.get(id)));
                })
            .toList();
    }

    private static Request toRequest(Sharing s, LocalDate today) {
        LocalDate written = s.getCreatedAt().atZoneSameInstant(KST).toLocalDate();
        return new Request(s.getBody(), kst(s.getCreatedAt()), ChronoUnit.DAYS.between(written, today));
    }

    private static MyRequest toMyRequest(Sharing s) {
        return new MyRequest(s.getId(), s.getBody(), kst(s.getCreatedAt()));
    }

    /**
     * 응답의 시각은 +09:00으로 내린다. 이력 화면이 앞 10자를 날짜로 잘라 쓰는데, JVM 타임존을
     * 따르면 Railway(UTC)에서 새벽 기도제목이 전날로 찍힌다.
     */
    private static OffsetDateTime kst(OffsetDateTime t) {
        return t.atZoneSameInstant(KST).toOffsetDateTime();
    }
}
