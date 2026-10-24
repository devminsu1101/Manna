package com.manna.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.manna.backend.community.Community;
import com.manna.backend.community.CommunityMember;
import com.manna.backend.community.CommunityMemberRepository;
import com.manna.backend.community.CommunityRepository;
import com.manna.backend.domain.User;
import com.manna.backend.domain.UserIdentity;
import com.manna.backend.prayer.PrayerLog;
import com.manna.backend.prayer.PrayerLogRepository;
import com.manna.backend.prayer.PrayerService;
import com.manna.backend.repository.UserIdentityRepository;
import com.manna.backend.repository.UserRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

/**
 * 마이페이지 API — 숫자(`GET /me/stats`), 이름 고치기(`PATCH /me`), 기도제목 이력의 공개/비공개.
 * 로컬 도커 DB에 붙어 돌고, 테스트마다 롤백한다. 사전 조건: apps/에서 docker compose up -d.
 */
@SpringBootTest(properties = {"GOOGLE_CLIENT_ID=test", "GOOGLE_CLIENT_SECRET=test"})
@AutoConfigureMockMvc
@Transactional
class MeApiTests {

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

    @Test
    void 이번_주_기도한_사람은_같은_사람_여러_날이어도_한_명() throws Exception {
        User me = user("me");
        User a = user("a");
        User b = user("b");
        LocalDate today = LocalDate.now(PrayerService.KST);
        LocalDate sunday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));
        // PrayerLog(기도받는 사람, 기도한 사람, 날)
        logs.save(new PrayerLog(a, me, today));
        logs.save(new PrayerLog(b, me, sunday.minusDays(1))); // 지난 토요일 = 지난주
        if (!sunday.equals(today)) {
            logs.save(new PrayerLog(a, me, sunday)); // 같은 사람, 이번 주 다른 날
        }

        mvc.perform(get("/api/v1/me/stats?period=week").with(as("me")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.period").value("week"))
            .andExpect(jsonPath("$.from").value(sunday.toString()))
            .andExpect(jsonPath("$.to").value(today.toString()))
            .andExpect(jsonPath("$.prayedPeople").value(1))
            .andExpect(jsonPath("$.prayedCount").value(sunday.equals(today) ? 1 : 2));

        // 최근 1일 = 오늘만
        mvc.perform(get("/api/v1/me/stats?period=days&days=1").with(as("me")))
            .andExpect(jsonPath("$.from").value(today.toString()))
            .andExpect(jsonPath("$.prayedCount").value(1));
        // 최근 30일이면 지난주 b도 들어온다
        mvc.perform(get("/api/v1/me/stats?period=days&days=30").with(as("me")))
            .andExpect(jsonPath("$.prayedPeople").value(2));
    }

    @Test
    void 잘못된_기간은_400() throws Exception {
        user("me");
        for (String q : new String[] {"", "?period=year", "?period=days", "?period=days&days=0", "?period=days&days=366"}) {
            mvc.perform(get("/api/v1/me/stats" + q).with(as("me"))).andExpect(status().isBadRequest());
        }
        mvc.perform(get("/api/v1/me/stats?period=week")).andExpect(status().isUnauthorized());
    }

    @Test
    void 여러_방에_올린_같은_나눔은_하나로_센다() throws Exception {
        User me = user("me");
        Community x = room("X방", me);
        Community y = room("Y방", me);
        mvc.perform(
                post("/api/v1/sharings")
                    .with(as("me"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{\"type\":\"daily\",\"body\":\"같은 글\",\"communityIds\":["
                            + x.getId() + "," + y.getId() + "]}"))
            .andExpect(status().isCreated());
        // 기도제목은 나눔이 아니다
        mvc.perform(
                post("/api/v1/pray/requests/me")
                    .with(as("me"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"body\":\"기도\"}"))
            .andExpect(status().isCreated());

        mvc.perform(get("/api/v1/me/stats?period=month").with(as("me")))
            .andExpect(jsonPath("$.sharings").value(1));
        // 기간 없이 전부 — 마이페이지 "내가 올린 나눔"
        mvc.perform(get("/api/v1/me/stats?period=all").with(as("me")))
            .andExpect(jsonPath("$.sharings").value(1));
    }

    @Test
    void 이름을_고친다() throws Exception {
        User me = user("me");
        mvc.perform(
                patch("/api/v1/me")
                    .with(as("me"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"  김민수  \"}"))
            .andExpect(status().isNoContent());
        assertThat(users.findById(me.getId()).orElseThrow().getName()).isEqualTo("김민수");

        for (String name : new String[] {"   ", "가".repeat(51)}) {
            mvc.perform(
                    patch("/api/v1/me")
                        .with(as("me"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\"}"))
                .andExpect(status().isBadRequest());
        }
        mvc.perform(
                patch("/api/v1/me")
                    .with(as("me"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"csrf 없음\"}"))
            .andExpect(status().isForbidden());
    }

    private static final String BLOB_PHOTO =
        "https://abc123.public.blob.vercel-storage.com/profiles/1-x.jpg";

    @Test
    void 올린_사진을_저장하고_이름만_보내면_사진은_그대로() throws Exception {
        User me = user("me");
        mvc.perform(
                patch("/api/v1/me")
                    .with(as("me"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"profileImageUrl\":\"" + BLOB_PHOTO + "\"}"))
            .andExpect(status().isNoContent());
        assertThat(users.findById(me.getId()).orElseThrow().getProfileImageUrl()).isEqualTo(BLOB_PHOTO);

        mvc.perform(
                patch("/api/v1/me")
                    .with(as("me"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"새 이름\"}"))
            .andExpect(status().isNoContent());
        User after = users.findById(me.getId()).orElseThrow();
        assertThat(after.getName()).isEqualTo("새 이름");
        assertThat(after.getProfileImageUrl()).isEqualTo(BLOB_PHOTO);
    }

    @Test
    void Blob이_아닌_사진_주소와_빈_요청은_400() throws Exception {
        user("me");
        for (String body : new String[] {
            "{}",
            "{\"profileImageUrl\":\"https://evil.example.com/a.jpg\"}",
            "{\"profileImageUrl\":\"http://abc.public.blob.vercel-storage.com/a.jpg\"}",
            "{\"profileImageUrl\":\"https://public.blob.vercel-storage.com.evil.com/a.jpg\"}",
        }) {
            mvc.perform(
                    patch("/api/v1/me")
                        .with(as("me"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
        }
    }

    @Test
    void 사진을_올렸는지_가린다() {
        assertThat(ProfilePhoto.isUploaded(BLOB_PHOTO)).isTrue();
        assertThat(ProfilePhoto.isUploaded("https://lh3.googleusercontent.com/a/xyz")).isFalse();
        assertThat(ProfilePhoto.isUploaded(null)).isFalse();
        assertThat(ProfilePhoto.isUploaded("not a url")).isFalse();
    }

    @Test
    void 기도제목_이력에_공개_여부가_온다() throws Exception {
        user("me");
        mvc.perform(
                post("/api/v1/pray/requests/me")
                    .with(as("me"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"body\":\"기도\"}"))
            .andExpect(status().isCreated());

        mvc.perform(get("/api/v1/pray/requests/me").with(as("me")))
            .andExpect(jsonPath("$.requests[0].visibility").value("public"));
    }
}
