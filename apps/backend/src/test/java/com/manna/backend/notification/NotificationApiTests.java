package com.manna.backend.notification;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
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
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

/**
 * 앱 안 알림(D-3627) — 누가 언제 받는지, 읽음, 30일.
 * 로컬 도커 DB에 붙어 돌고, 테스트마다 롤백한다. 사전 조건: apps/에서 docker compose up -d.
 */
@SpringBootTest(properties = {"GOOGLE_CLIENT_ID=test", "GOOGLE_CLIENT_SECRET=test"})
@AutoConfigureMockMvc
@Transactional
class NotificationApiTests {

    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired UserIdentityRepository identities;
    @Autowired CommunityRepository communities;
    @Autowired CommunityMemberRepository members;
    @Autowired PrayerLogRepository logs;
    @Autowired NotificationRepository notifications;
    @Autowired JdbcTemplate jdbc;

    private User user(String sub) {
        User u = users.save(new User(sub, null));
        identities.save(new UserIdentity(u, "google", sub, null));
        return u;
    }

    private static RequestPostProcessor as(String sub) {
        return oidcLogin().idToken(t -> t.subject(sub));
    }

    /** 방을 만들고 사람들을 active로 넣는다. 첫 사람이 리더다. */
    private Community room(String name, String code, User... people) {
        Community c = communities.save(new Community(name, people[0], code));
        for (int i = 0; i < people.length; i++) {
            members.save(
                new CommunityMember(
                    c, people[i], i == 0 ? CommunityMember.LEADER : CommunityMember.MEMBER,
                    CommunityMember.ACTIVE));
        }
        return c;
    }

    private ResultActions list(String sub) throws Exception {
        return mvc.perform(get("/api/v1/notifications").with(as(sub))).andExpect(status().isOk());
    }

    private ResultActions unread(String sub) throws Exception {
        return mvc.perform(get("/api/v1/notifications/unread-count").with(as(sub)))
            .andExpect(status().isOk());
    }

    @Test
    void 가입_신청은_리더에게_승인은_신청자에게() throws Exception {
        User leader = user("leader");
        User a = user("a");
        User applicant = user("applicant");
        Community c = room("만나방", "mannaroom01", leader, a);

        mvc.perform(post("/api/v1/invites/mannaroom01/requests").with(as("applicant")).with(csrf()))
            .andExpect(status().isCreated());

        list("leader")
            .andExpect(jsonPath("$.notifications.length()").value(1))
            .andExpect(jsonPath("$.notifications[0].type").value("join_request"))
            .andExpect(jsonPath("$.notifications[0].body").value("applicant님이 만나방에 가입을 신청했어요"))
            .andExpect(jsonPath("$.notifications[0].linkPath").value("/communities/" + c.getId()))
            .andExpect(jsonPath("$.notifications[0].read").value(false));
        unread("leader").andExpect(jsonPath("$.count").value(1));
        list("a").andExpect(jsonPath("$.notifications.length()").value(0));

        mvc.perform(post("/api/v1/communities/" + c.getId() + "/members/" + applicant.getId() + "/approve")
                .with(as("leader")).with(csrf()))
            .andExpect(status().isNoContent());
        list("applicant")
            .andExpect(jsonPath("$.notifications[0].type").value("join_approved"))
            .andExpect(jsonPath("$.notifications[0].body").value("만나방에 함께하게 됐어요"));
    }

    @Test
    void 새_나눔은_작성자를_빼고_겹치는_사람은_한_번만() throws Exception {
        User me = user("me");
        User both = user("both");
        User onlyY = user("onlyY");
        Community x = room("X방", "xroom000001", me, both);
        Community y = room("Y방", "yroom000001", me, both, onlyY);

        mvc.perform(post("/api/v1/sharings").with(as("me")).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"daily\",\"body\":\"오늘 나눔\",\"communityIds\":["
                    + x.getId() + "," + y.getId() + "]}"))
            .andExpect(status().isCreated());

        list("me").andExpect(jsonPath("$.notifications.length()").value(0));
        list("both")
            .andExpect(jsonPath("$.notifications.length()").value(1))
            .andExpect(jsonPath("$.notifications[0].body").value("me님이 X방에 나눔을 올렸어요"));
        // Y방에만 있는 사람은 Y방 글로 간다 — 그 방 글이라야 열린다.
        String body = list("onlyY")
            .andExpect(jsonPath("$.notifications[0].body").value("me님이 Y방에 나눔을 올렸어요"))
            .andReturn().getResponse().getContentAsString();
        String link = JsonPath.read(body, "$.notifications[0].linkPath");
        mvc.perform(get("/api/v1" + link).with(as("onlyY"))).andExpect(status().isOk());
    }

    @Test
    void 기도마니또를_시작하면_리더를_뺀_멤버에게() throws Exception {
        User leader = user("leader");
        User a = user("a");
        Community c = room("만나방", "mannaroom02", leader, a);

        mvc.perform(post("/api/v1/communities/" + c.getId() + "/partners").with(as("leader")).with(csrf()))
            .andExpect(status().isNoContent());

        list("a").andExpect(jsonPath("$.notifications[0].type").value("partners_started"));
        list("leader").andExpect(jsonPath("$.notifications.length()").value(0));
    }

    @Test
    void 기도_소식은_어제_기도가_있을_때_하루_한_번() throws Exception {
        User me = user("me");
        User a = user("a");
        User b = user("b");
        user("nobody");
        LocalDate yesterday = LocalDate.now(PrayerService.KST).minusDays(1);
        logs.save(new PrayerLog(me, a, yesterday));
        logs.save(new PrayerLog(me, b, yesterday));

        list("me")
            .andExpect(jsonPath("$.notifications.length()").value(1))
            .andExpect(jsonPath("$.notifications[0].body").value("날 위해 2명이 기도하고 있어요"));
        unread("me").andExpect(jsonPath("$.count").value(1));
        list("me").andExpect(jsonPath("$.notifications.length()").value(1));

        // 0명이면 만들지 않는다(D-1705).
        list("nobody").andExpect(jsonPath("$.notifications.length()").value(0));
    }

    @Test
    void 하나씩_읽고_남의_것은_404_30일_지난_것은_안_보인다() throws Exception {
        User me = user("me");
        user("other");
        Notification mine = notifications.save(new Notification(me.getId(), "join_approved", "새 알림", "/"));
        Notification old = notifications.save(new Notification(me.getId(), "join_approved", "옛 알림", "/"));
        notifications.flush();
        jdbc.update("UPDATE notifications SET created_at = now() - interval '31 days' WHERE id = ?", old.getId());

        list("me")
            .andExpect(jsonPath("$.notifications.length()").value(1))
            .andExpect(jsonPath("$.notifications[0].body").value("새 알림"));
        unread("me").andExpect(jsonPath("$.count").value(1));

        mvc.perform(post("/api/v1/notifications/" + mine.getId() + "/read").with(as("other")).with(csrf()))
            .andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/notifications/" + mine.getId() + "/read").with(as("me")).with(csrf()))
            .andExpect(status().isNoContent());
        unread("me").andExpect(jsonPath("$.count").value(0));
        list("me").andExpect(jsonPath("$.notifications[0].read").value(true));
    }
}
