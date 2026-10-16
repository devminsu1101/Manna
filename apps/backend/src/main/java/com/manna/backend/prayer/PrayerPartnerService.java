package com.manna.backend.prayer;

import com.manna.backend.common.ApiException;
import com.manna.backend.community.CommunityMember;
import com.manna.backend.community.CommunityMemberRepository;
import java.security.SecureRandom;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.sql.DataSource;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 기도마니또(D-3601). 한 방향이다 — A는 B를 위해 기도하고, B는 누가 자기를 맡았는지 모른다.
 * 섞은 순서로 원형(A→B→C→…→A)을 만들어, 홀수여도 모두가 한 명을 맡고 한 명에게 맡겨진다.
 *
 * <p>리더가 시작한다(D-3602). 그 주 토요일까지가 첫 주이고, 이후 매주 일요일(KST)에 새로 섞는다.
 * 스케줄러를 두지 않고 <b>읽을 때 만든다</b>(D-3603) — 시작한 방에 이번 주 행이 없으면 대문 · 요약 ·
 * 기도실 중 처음 읽는 쪽이 만든다. 서버가 그 시각에 떠 있지 않아도 빠지는 주가 없다.
 *
 * <p>{@code prayer_partners}는 엔티티 없이 SQL로만 다룬다(`sharing_communities`와 같은 판단).
 */
@Service
public class PrayerPartnerService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final JdbcClient jdbc;
    private final CommunityMemberRepository members;

    public PrayerPartnerService(DataSource dataSource, CommunityMemberRepository members) {
        // JPA 트랜잭션이 잡은 커넥션을 그대로 쓴다(DataSourceUtils).
        this.jdbc = JdbcClient.create(dataSource);
        this.members = members;
    }

    /** 그 주의 일요일. 주 식별자(`week_start`)다. */
    static LocalDate weekStart(LocalDate day) {
        return day.with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));
    }

    // ── 시작 (리더 권한은 CommunityService가 본다) ───────────────────────

    @Transactional
    public void start(Integer communityId) {
        lock(communityId);
        if (started(communityId)) {
            throw ApiException.conflict("이미 기도마니또를 시작했습니다.");
        }
        if (!assign(communityId, weekStart(PrayerService.today()))) {
            throw ApiException.badRequest("멤버가 두 명 이상이어야 시작할 수 있습니다.");
        }
    }

    public boolean started(Integer communityId) {
        return jdbc.sql("SELECT EXISTS (SELECT 1 FROM prayer_partners WHERE community_id = ?)")
            .param(communityId)
            .query(Boolean.class)
            .single();
    }

    // ── 읽을 때 만들기 ───────────────────────────────────────────────────

    /** 시작한 방 중 이번 주 행이 없는 방에 만든다. 읽는 쪽이 조회 전에 부른다. */
    @Transactional
    public void ensureThisWeek(Collection<Integer> communityIds) {
        if (communityIds.isEmpty()) {
            return;
        }
        LocalDate week = weekStart(PrayerService.today());
        List<Integer> stale =
            jdbc.sql(
                    "SELECT community_id FROM prayer_partners WHERE community_id IN (:ids)"
                        + " GROUP BY community_id HAVING max(week_start) < :week")
                .param("ids", communityIds)
                .param("week", week)
                .query(Integer.class)
                .list();
        for (Integer id : stale) {
            lock(id);
            // 기다리는 동안 다른 요청이 만들었을 수 있다
            if (!hasWeek(id, week)) {
                assign(id, week);
            }
        }
    }

    // ── 조회 ─────────────────────────────────────────────────────────────

    /**
     * 이번 주에 내가 맡은 사람, 방 id → 그 사람 id. 그 사람이 지금도 active인지는 보지 않는다 —
     * 부르는 쪽이 이미 active 멤버 목록을 들고 있어 거기서 거른다(주 중간에 나간 사람은 숨긴다).
     */
    public Map<Integer, Integer> myPartners(Integer me) {
        Map<Integer, Integer> result = new HashMap<>();
        jdbc.sql("SELECT community_id, partner_id FROM prayer_partners WHERE user_id = ? AND week_start = ?")
            .params(me, weekStart(PrayerService.today()))
            .query(rs -> {
                result.put(rs.getInt(1), rs.getInt(2));
            });
        return result;
    }

    // ── 배정 ─────────────────────────────────────────────────────────────

    /** 지금의 active 멤버로 원형을 만든다. 두 명 미만이면 만들지 않고 false. */
    private boolean assign(Integer communityId, LocalDate week) {
        List<Integer> ids = new ArrayList<>();
        for (CommunityMember m : members.findByCommunity_IdOrderByJoinedAtAsc(communityId)) {
            if (m.isActive()) {
                ids.add(m.getUser().getId());
            }
        }
        if (ids.size() < 2) {
            return false;
        }
        // ponytail: 매주 새로 섞기만 한다 — 지난주와 같은 상대가 나올 수 있다. 피하려면 지난주 행을 보고 다시 섞는다.
        Collections.shuffle(ids, RANDOM);
        for (int i = 0; i < ids.size(); i++) {
            jdbc.sql(
                    "INSERT INTO prayer_partners (community_id, week_start, user_id, partner_id)"
                        + " VALUES (?, ?, ?, ?)")
                .params(communityId, week, ids.get(i), ids.get((i + 1) % ids.size()))
                .update();
        }
        return true;
    }

    private boolean hasWeek(Integer communityId, LocalDate week) {
        return jdbc.sql(
                "SELECT EXISTS (SELECT 1 FROM prayer_partners WHERE community_id = ? AND week_start = ?)")
            .params(communityId, week)
            .query(Boolean.class)
            .single();
    }

    /**
     * 같은 방을 동시에 만드는 두 요청을 줄 세운다(트랜잭션 끝에 풀린다). UNIQUE만으로는 두 요청의
     * 서로 다른 섞기가 행마다 섞여 원형이 깨질 수 있다.
     */
    private void lock(Integer communityId) {
        jdbc.sql("SELECT pg_advisory_xact_lock(?)").param(communityId).query().listOfRows();
    }
}
