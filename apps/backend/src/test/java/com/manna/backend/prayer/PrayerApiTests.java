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
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

/**
 * Pray API — 볼 수 있는 사람 규칙, 기도제목 작성, 기도했어요, 요약.
 * 로컬 도커 DB에 붙어 돌고, 테스트마다 롤백한다. 사전 조건: apps/에서 docker compose up -d.
 */
@SpringBootTest(properties = {"GOOGLE_CLIENT_ID=test", "GOOGLE_CLIENT_SECRET=test"})
@AutoConfigureMockMvc
@Transactional
class PrayerApiTests {

    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired UserIdentityRepository identities;
    @Autowired CommunityRepository communities;
    @Autowired CommunityMemberRepository members;
    @Autowired PrayerLogRepository logs;

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

    private void write(String sub, String body) throws Exception {
        mvc.perform(
                post("/api/v1/pray/requests/me")
                    .with(as(sub))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"body\":\"" + body + "\"}"))
            .andExpect(status().isCreated());
    }

    @Test
    void 같은_방_active끼리만_보인다() throws Exception {
        User a = user("a");
        User b = user("b");
        User c = user("c");
        User p = user("p");
        Community ab = room("A방", a, b);
        room("C방", c);
        members.save(new CommunityMember(ab, p, CommunityMember.MEMBER, CommunityMember.PENDING));

        // a에게는 b 한 명. 나 · 다른 방 · pending은 없다
        mvc.perform(get("/api/v1/pray/room").with(as("a")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.partners.length()").value(0))
            .andExpect(jsonPath("$.members.length()").value(1))
            .andExpect(jsonPath("$.members[0].userId").value(b.getId()))
            .andExpect(jsonPath("$.members[0].communities[0].name").value("A방"))
            .andExpect(jsonPath("$.members[0].request").isEmpty())
            .andExpect(jsonPath("$.members[0].partnerIn").doesNotExist());

        // pending은 아무도 못 본다
        mvc.perform(get("/api/v1/pray/room").with(as("p")))
            .andExpect(jsonPath("$.members.length()").value(0));

        for (User other : new User[] {a, c, p}) {
            mvc.perform(get("/api/v1/pray/requests/" + other.getId()).with(as("a")))
                .andExpect(status().isNotFound());
        }
        mvc.perform(post("/api/v1/pray/" + c.getId()).with(as("a")).with(csrf()))
            .andExpect(status().isNotFound());
    }

    @Test
    void 기도제목은_공동체_없이도_쌓이고_같은_방에_들어오면_보인다() throws Exception {
        User a = user("a");
        User b = user("b");

        // 방이 없어도 저장된다(D-3401)
        write("b", "첫 기도제목");
        write("b", "  둘째 기도제목  ");
        mvc.perform(get("/api/v1/pray/requests/me").with(as("b")))
            .andExpect(jsonPath("$.requests.length()").value(2))
            .andExpect(jsonPath("$.requests[0].body").value("둘째 기도제목"))
            .andExpect(jsonPath("$.requests[0].createdAt").isString())
            .andExpect(jsonPath("$.requests[0].communities").doesNotExist());

        mvc.perform(get("/api/v1/pray/requests/" + b.getId()).with(as("a")))
            .andExpect(status().isNotFound());

        // 같은 방이 되면 최신 하나가 보인다
        room("A방", a, b);
        mvc.perform(get("/api/v1/pray/requests/" + b.getId()).with(as("a")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("b"))
            .andExpect(jsonPath("$.request.body").value("둘째 기도제목"))
            .andExpect(jsonPath("$.request.daysAgo").value(0))
            .andExpect(jsonPath("$.prayedByMeToday").value(false));

        // 빈 본문은 400
        mvc.perform(
                post("/api/v1/pray/requests/me")
                    .with(as("b"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"body\":\"  \"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void 기도했어요는_멱등이고_자신은_400() throws Exception {
        User a = user("a");
        User b = user("b");
        room("A방", a, b);
        String pray = "/api/v1/pray/" + b.getId();

        mvc.perform(post(pray).with(as("a")).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(post(pray).with(as("a")).with(csrf())).andExpect(status().isNoContent());
        assertThat(logs.countByPrayedFor_IdAndPrayedOn(b.getId(), PrayerService.today()))
            .isEqualTo(1);

        mvc.perform(get("/api/v1/pray/requests/" + b.getId()).with(as("a")))
            .andExpect(jsonPath("$.prayedByMeToday").value(true));
        mvc.perform(post("/api/v1/pray/" + a.getId()).with(as("a")).with(csrf()))
            .andExpect(status().isBadRequest());
    }

    @Test
    void 중보기도실_정렬() throws Exception {
        User me = user("me");
        User prayed = user("prayed");     // 기도제목 있음, 오늘 이미 기도함 → 맨 뒤
        User noRequest = user("none");    // 기도제목 없음 → 기도제목 있는 사람 뒤
        User older = user("older");       // 기도제목 있음, 먼저 씀
        User newer = user("newer");       // 기도제목 있음, 나중에 씀 → 맨 앞
        room("A방", me, prayed, noRequest, older, newer);
        write("prayed", "p");
        write("older", "o");
        write("newer", "n");
        mvc.perform(post("/api/v1/pray/" + prayed.getId()).with(as("me")).with(csrf()));

        mvc.perform(get("/api/v1/pray/room").with(as("me")))
            .andExpect(jsonPath("$.members[0].userId").value(newer.getId()))
            .andExpect(jsonPath("$.members[1].userId").value(older.getId()))
            .andExpect(jsonPath("$.members[2].userId").value(noRequest.getId()))
            .andExpect(jsonPath("$.members[3].userId").value(prayed.getId()))
            .andExpect(jsonPath("$.members[3].prayedByMeToday").value(true));
    }

    @Test
    void 요약은_어제_기도한_사람_수() throws Exception {
        User me = user("me");
        User a = user("a");
        User b = user("b");
        logs.save(new PrayerLog(me, a, PrayerService.today().minusDays(1)));
        logs.save(new PrayerLog(me, b, PrayerService.today().minusDays(1)));
        logs.save(new PrayerLog(me, a, PrayerService.today())); // 오늘 것은 세지 않는다(D-901)

        mvc.perform(get("/api/v1/pray/summary").with(as("me")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.yesterdayCount").value(2))
            .andExpect(jsonPath("$.partner").isEmpty())
            .andExpect(jsonPath("$.partnerTotal").value(0));
        mvc.perform(get("/api/v1/pray/summary")).andExpect(status().isUnauthorized());
    }
}
