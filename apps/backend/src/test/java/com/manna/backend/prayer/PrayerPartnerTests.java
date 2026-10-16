package com.manna.backend.prayer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.manna.backend.community.Community;
import com.manna.backend.community.CommunityMember;
import com.manna.backend.community.CommunityMemberRepository;
import com.manna.backend.community.CommunityRepository;
import com.manna.backend.domain.User;
import com.manna.backend.domain.UserIdentity;
import com.manna.backend.repository.UserIdentityRepository;
import com.manna.backend.repository.UserRepository;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

/**
 * 기도마니또(기도마니또) — 리더가 시작, 원형 배정, 읽을 때 이번 주 생성.
 * 로컬 도커 DB에 붙어 돌고, 테스트마다 롤백한다. 사전 조건: apps/에서 docker compose up -d.
 */
@SpringBootTest(properties = {"GOOGLE_CLIENT_ID=test", "GOOGLE_CLIENT_SECRET=test"})
@AutoConfigureMockMvc
@Transactional
class PrayerPartnerTests {

    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired UserIdentityRepository identities;
    @Autowired CommunityRepository communities;
    @Autowired CommunityMemberRepository members;
    @Autowired DataSource dataSource;

    private User user(String sub) {
        User u = users.save(new User(sub, null));
        identities.save(new UserIdentity(u, "google", sub, null));
        return u;
    }

    private static RequestPostProcessor as(String sub) {
        return oidcLogin().idToken(t -> t.subject(sub));
    }

    /** 방을 만들고 사람들을 active로 넣는다. 첫 사람이 리더다. */
    private Community room(String name, User... people) {
        Community c = communities.save(new Community(name, people[0], name.substring(0, 1) + "code0000"));
        for (int i = 0; i < people.length; i++) {
            members.save(
                new CommunityMember(
                    c, people[i], i == 0 ? CommunityMember.LEADER : CommunityMember.MEMBER,
                    CommunityMember.ACTIVE));
        }
        return c;
    }

    private ResultActions start(String sub, Community c) throws Exception {
        return mvc.perform(post("/api/v1/communities/" + c.getId() + "/partners").with(as(sub)).with(csrf()));
    }

    /** 그 방 그 주의 (맡은 사람 → 맡겨진 사람). */
    private Map<Integer, Integer> pairs(Community c, LocalDate week) {
        List<Map<String, Object>> rows =
            JdbcClient.create(dataSource)
                .sql("SELECT user_id, partner_id FROM prayer_partners WHERE community_id = ? AND week_start = ?")
                .params(c.getId(), week)
                .query()
                .listOfRows();
        return rows.stream()
            .collect(
                Collectors.toMap(
                    r -> (Integer) r.get("user_id"), r -> (Integer) r.get("partner_id")));
    }

    private static LocalDate thisWeek() {
        return PrayerPartnerService.weekStart(PrayerService.today());
    }

    @Test
    void 홀수여도_모두_한_명을_맡고_한_명에게_맡겨진다() throws Exception {
        User[] five = {user("a"), user("b"), user("c"), user("d"), user("e")};
        Community c = room("A방", five);

        start("a", c).andExpect(status().isNoContent());

        Map<Integer, Integer> p = pairs(c, thisWeek());
        assertThat(p).hasSize(5);
        p.forEach((from, to) -> assertThat(from).isNotEqualTo(to));
        assertThat(new HashSet<>(p.values())).hasSize(5);

        // 원형이다 — 한 사람에서 출발해 다섯 번 따라가면 제자리로 온다
        Set<Integer> seen = new HashSet<>();
        Integer cur = five[0].getId();
        for (int i = 0; i < 5; i++) {
            seen.add(cur);
            cur = p.get(cur);
        }
        assertThat(cur).isEqualTo(five[0].getId());
        assertThat(seen).hasSize(5);
    }

    @Test
    void 리더만_한_번_두_명부터_시작한다() throws Exception {
        User a = user("a");
        User b = user("b");
        Community ab = room("A방", a, b);
        Community solo = room("S방", user("s"));

        // 시작 전에는 짝이 없고 버튼이 보인다
        mvc.perform(get("/api/v1/communities/" + ab.getId()).with(as("a")))
            .andExpect(jsonPath("$.prayerPartner").doesNotExist())
            .andExpect(jsonPath("$.partnersStarted").value(false));

        start("b", ab).andExpect(status().isForbidden());
        start("s", solo).andExpect(status().isBadRequest());
        start("a", ab).andExpect(status().isNoContent());
        start("a", ab).andExpect(status().isConflict());

        // 둘이면 서로 맡는다. 대문 · 요약 · 기도실이 같은 사람을 가리킨다
        mvc.perform(get("/api/v1/communities/" + ab.getId()).with(as("a")))
            .andExpect(jsonPath("$.prayerPartner.userId").value(b.getId()))
            .andExpect(jsonPath("$.partnersStarted").value(true));
        mvc.perform(get("/api/v1/pray/summary").with(as("a")))
            .andExpect(jsonPath("$.partner.userId").value(b.getId()))
            .andExpect(jsonPath("$.partner.communityName").value("A방"))
            .andExpect(jsonPath("$.partnerTotal").value(1));
        mvc.perform(get("/api/v1/pray/room").with(as("a")))
            .andExpect(jsonPath("$.partners.length()").value(1))
            .andExpect(jsonPath("$.partners[0].userId").value(b.getId()))
            .andExpect(jsonPath("$.partners[0].partnerIn[0].id").value(ab.getId()))
            .andExpect(jsonPath("$.members.length()").value(0));
    }

    @Test
    void 새_주에_처음_읽으면_이번_주_짝을_만든다() throws Exception {
        User a = user("a");
        User b = user("b");
        User c = user("c");
        Community abc = room("A방", a, b, c);
        LocalDate lastWeek = thisWeek().minusWeeks(1);
        // 지난주에 시작한 방 — 이번 주 행은 아직 없다
        JdbcClient jdbc = JdbcClient.create(dataSource);
        int[][] ring = {{a.getId(), b.getId()}, {b.getId(), c.getId()}, {c.getId(), a.getId()}};
        for (int[] r : ring) {
            jdbc.sql(
                    "INSERT INTO prayer_partners (community_id, week_start, user_id, partner_id)"
                        + " VALUES (?, ?, ?, ?)")
                .params(abc.getId(), lastWeek, r[0], r[1])
                .update();
        }
        assertThat(pairs(abc, thisWeek())).isEmpty();

        mvc.perform(get("/api/v1/pray/summary").with(as("b")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.partnerTotal").value(1));

        assertThat(pairs(abc, thisWeek())).hasSize(3);
    }
}
