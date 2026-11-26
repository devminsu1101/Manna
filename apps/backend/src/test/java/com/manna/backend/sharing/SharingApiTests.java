package com.manna.backend.sharing;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
import com.manna.backend.repository.UserIdentityRepository;
import com.manna.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

/**
 * Sharing API — 공동체 필수, active만 보기, 작성자만 수정·삭제.
 * 로컬 도커 DB에 붙어 돌고, 테스트마다 롤백한다. 사전 조건: apps/에서 docker compose up -d.
 */
@SpringBootTest(properties = {"GOOGLE_CLIENT_ID=test", "GOOGLE_CLIENT_SECRET=test"})
@AutoConfigureMockMvc
@Transactional
class SharingApiTests {

    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired UserIdentityRepository identities;
    @Autowired CommunityRepository communities;
    @Autowired CommunityMemberRepository members;

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

    private ResultActions share(String sub, String json) throws Exception {
        return mvc.perform(
            post("/api/v1/sharings")
                .with(as(sub))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    private int shareTo(String sub, String body, Community... rooms) throws Exception {
        StringBuilder ids = new StringBuilder();
        for (Community c : rooms) {
            ids.append(ids.isEmpty() ? "" : ",").append(c.getId());
        }
        String res =
            share(sub, "{\"type\":\"daily\",\"body\":\"" + body + "\",\"communityIds\":[" + ids + "]}")
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return JsonPath.read(res, "$.id");
    }

    @Test
    void 공동체_없이는_못_올리고_내_방에만_올린다() throws Exception {
        User a = user("a");
        User c = user("c");
        Community ab = room("A방", a);
        Community cc = room("C방", c);
        User p = user("p");
        members.save(new CommunityMember(ab, p, CommunityMember.MEMBER, CommunityMember.PENDING));

        share("a", "{\"type\":\"daily\",\"body\":\"안녕\",\"communityIds\":[]}")
            .andExpect(status().isBadRequest());
        share("a", "{\"type\":\"prayer\",\"body\":\"안녕\",\"communityIds\":[" + ab.getId() + "]}")
            .andExpect(status().isBadRequest());
        share("a", "{\"type\":\"daily\",\"body\":\"안녕\",\"communityIds\":[" + cc.getId() + "]}")
            .andExpect(status().isForbidden());
        // pending은 방이 없는 것처럼
        share("p", "{\"type\":\"daily\",\"body\":\"안녕\",\"communityIds\":[" + ab.getId() + "]}")
            .andExpect(status().isNotFound());
    }

    @Test
    void 걸린_방의_active만_본다() throws Exception {
        User a = user("a");
        User b = user("b");
        User c = user("c");
        User p = user("p");
        Community ab = room("A방", a, b);
        Community cc = room("C방", c);
        members.save(new CommunityMember(ab, p, CommunityMember.MEMBER, CommunityMember.PENDING));

        int first = shareTo("a", "첫 나눔", ab);
        int second = shareTo("a", "  둘째 나눔  ", ab, ab);

        mvc.perform(get("/api/v1/sharings").param("communityId", "" + ab.getId()).with(as("b")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.sharings.length()").value(2))
            .andExpect(jsonPath("$.sharings[0].id").value(second))
            .andExpect(jsonPath("$.sharings[0].body").value("둘째 나눔"))
            .andExpect(jsonPath("$.sharings[0].author.name").value("a"))
            .andExpect(jsonPath("$.sharings[0].mine").value(false));
        mvc.perform(get("/api/v1/sharings").param("communityId", "" + cc.getId()).with(as("c")))
            .andExpect(jsonPath("$.sharings.length()").value(0));

        mvc.perform(get("/api/v1/sharings/" + first).with(as("a")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.mine").value(true))
            .andExpect(jsonPath("$.communityId").value(ab.getId()));
        mvc.perform(get("/api/v1/sharings/" + first).with(as("b")))
            .andExpect(status().isOk());

        // 다른 방 · pending은 목록도 상세도 못 본다
        mvc.perform(get("/api/v1/sharings").param("communityId", "" + ab.getId()).with(as("p")))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/sharings").param("communityId", "" + ab.getId()).with(as("c")))
            .andExpect(status().isForbidden());
        for (String sub : new String[] {"c", "p"}) {
            mvc.perform(get("/api/v1/sharings/" + first).with(as(sub)))
                .andExpect(status().isNotFound());
        }
    }

    @Test
    void 작성자만_고치고_지운다() throws Exception {
        User a = user("a");
        User b = user("b");
        user("c");
        Community ab = room("A방", a, b);
        int id = shareTo("a", "원래 글", ab);

        String edit = "{\"body\":\"고친 글\"}";
        mvc.perform(patch("/api/v1/sharings/" + id).with(as("b")).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(edit))
            .andExpect(status().isForbidden());
        mvc.perform(patch("/api/v1/sharings/" + id).with(as("c")).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(edit))
            .andExpect(status().isNotFound());
        mvc.perform(patch("/api/v1/sharings/" + id).with(as("a")).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(edit))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/sharings/" + id).with(as("b")))
            .andExpect(jsonPath("$.body").value("고친 글"));

        mvc.perform(delete("/api/v1/sharings/" + id).with(as("b")).with(csrf()))
            .andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/sharings/" + id).with(as("a")).with(csrf()))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/sharings/" + id).with(as("a")))
            .andExpect(status().isNotFound());
    }

    @Test
    void 홈_소식은_내_방_사람들의_나눔이고_기도제목과_내_것은_없다() throws Exception {
        User a = user("a");
        User b = user("b");
        User c = user("c");
        Community r1 = room("1방", a, b);
        Community r2 = room("2방", b, a);
        Community rc = room("C방", c);

        shareTo("b", "두 방에 같은 글", r1, r2);
        shareTo("a", "내 글", r1);
        shareTo("c", "다른 방 글", rc);
        mvc.perform(post("/api/v1/pray/requests/me").with(as("b")).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"첫 줄\\n둘째 줄\"}"))
            .andExpect(status().isCreated());

        // b의 나눔만(두 방이지만 한 번). 기도제목 · 내 글 · 다른 방 글은 없다
        mvc.perform(get("/api/v1/sharings/feed").with(as("a")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items.length()").value(1))
            .andExpect(jsonPath("$.items[0].userId").value(b.getId()))
            .andExpect(jsonPath("$.items[0].name").value("b"))
            .andExpect(jsonPath("$.items[0].firstLine").value("두 방에 같은 글"));
    }

    @Test
    void 여러_방에_올리면_방마다_따로_고치고_지운다() throws Exception {
        User a = user("a");
        Community ra = room("A방", a);
        Community rb = room("B방", a);
        int inA = shareTo("a", "같은 글", ra, rb);

        String listB =
            mvc.perform(get("/api/v1/sharings").param("communityId", "" + rb.getId()).with(as("a")))
                .andExpect(jsonPath("$.sharings.length()").value(1))
                .andReturn()
                .getResponse()
                .getContentAsString();
        int inB = JsonPath.read(listB, "$.sharings[0].id");
        assertNotEquals(inA, inB);

        mvc.perform(patch("/api/v1/sharings/" + inA).with(as("a")).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"A만 고침\"}"))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/sharings/" + inB).with(as("a")))
            .andExpect(jsonPath("$.body").value("같은 글"));

        mvc.perform(delete("/api/v1/sharings/" + inA).with(as("a")).with(csrf()))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/sharings").param("communityId", "" + ra.getId()).with(as("a")))
            .andExpect(jsonPath("$.sharings.length()").value(0));
        mvc.perform(get("/api/v1/sharings").param("communityId", "" + rb.getId()).with(as("a")))
            .andExpect(jsonPath("$.sharings[0].id").value(inB));
    }

    private ResultActions comment(String sub, int id, int room, String body, String request) throws Exception {
        return mvc.perform(post("/api/v1/sharings/" + id + "/comments").param("communityId", "" + room)
            .with(as(sub)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"body\":\"" + body + "\",\"requestId\":\"" + request + "\"}"));
    }
    private ResultActions discussion(String sub, int id, int room) throws Exception {
        return mvc.perform(get("/api/v1/sharings/" + id + "/discussion").param("communityId", "" + room).with(as(sub)));
    }
    private ResultActions react(String sub, int id, int room, String key) throws Exception {
        return mvc.perform(put("/api/v1/sharings/" + id + "/reaction").param("communityId", "" + room)
            .with(as(sub)).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"key\":\"" + key + "\"}"));
    }

    @Test
    void 댓글_재시도는_한번만_저장하고_작성자에게만_알린다() throws Exception {
        User a = user("a"), b = user("b"), c = user("c");
        Community room = room("A방", a, b, c);
        int id = shareTo("a", "나눔", room);
        jdbc.update("INSERT INTO push_subscriptions(user_id, endpoint, p256dh, auth) VALUES (?, ?, 'test', 'test')",
            a.getId(), "https://example.invalid/comment-test/" + a.getId());
        String request = java.util.UUID.randomUUID().toString();
        int commentId = JsonPath.read(comment("b", id, room.getId(), "  응원해요  ", request)
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id");
        comment("b", id, room.getId(), "  응원해요  ", request).andExpect(jsonPath("$.id").value(commentId));
        discussion("b", id, room.getId()).andExpect(jsonPath("$.commentCount").value(1))
            .andExpect(jsonPath("$.comments[0].body").value("응원해요"))
            .andExpect(jsonPath("$.comments[0].mine").value(true));
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM notifications WHERE type = 'sharing_comment' AND user_id = ?", Integer.class, a.getId()));
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM notifications WHERE type = 'sharing_comment' AND user_id IN (?, ?)", Integer.class, b.getId(), c.getId()));
        assertEquals("/sharings/" + id + "?communityId=" + room.getId() + "#comments",
            jdbc.queryForObject("SELECT link_path FROM notifications WHERE type = 'sharing_comment' AND user_id = ?", String.class, a.getId()));
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM push_deliveries d JOIN notifications n ON n.id = d.notification_id WHERE n.type = 'sharing_comment' AND n.user_id = ?", Integer.class, a.getId()));
        comment("a", id, room.getId(), "고마워요", java.util.UUID.randomUUID().toString()).andExpect(status().isCreated());
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM notifications WHERE type = 'sharing_comment' AND user_id = ?", Integer.class, a.getId()));
        mvc.perform(delete("/api/v1/sharings/" + id + "/comments/" + commentId).param("communityId", "" + room.getId()).with(as("a")).with(csrf()))
            .andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/sharings/" + id + "/comments/" + commentId).param("communityId", "" + room.getId()).with(as("b")).with(csrf()))
            .andExpect(status().isNoContent());
        discussion("b", id, room.getId()).andExpect(jsonPath("$.commentCount").value(1));
    }

    @Test
    void 예전_다중연결_글도_방별로_분리하고_탈퇴자는_차단한다() throws Exception {
        User a = user("a"), b = user("b"), c = user("c"), p = user("p");
        Community first = room("A방", a, b), second = room("B방", a, c);
        members.saveAndFlush(new CommunityMember(first, p, CommunityMember.MEMBER, CommunityMember.PENDING));
        int id = shareTo("a", "나눔", first);
        jdbc.update("INSERT INTO sharing_communities VALUES (?, ?)", id, second.getId());
        comment("b", id, first.getId(), "A에서만", java.util.UUID.randomUUID().toString()).andExpect(status().isCreated());
        react("b", id, first.getId(), "heart").andExpect(status().isOk());
        discussion("a", id, second.getId()).andExpect(jsonPath("$.commentCount").value(0))
            .andExpect(jsonPath("$.reactions[0].count").value(0));
        for (String sub : new String[]{"c", "p"}) {
            discussion(sub, id, first.getId()).andExpect(status().isNotFound());
            comment(sub, id, first.getId(), "안됨", java.util.UUID.randomUUID().toString()).andExpect(status().isNotFound());
            react(sub, id, first.getId(), "heart").andExpect(status().isNotFound());
        }
        mvc.perform(get("/api/v1/sharings/" + id).param("communityId", "" + first.getId()).with(as("a")))
            .andExpect(jsonPath("$.commentCount").value(1)).andExpect(jsonPath("$.reactionCount").value(1));
        mvc.perform(get("/api/v1/sharings/" + id).param("communityId", "" + second.getId()).with(as("a")))
            .andExpect(jsonPath("$.commentCount").value(0));
        jdbc.update("DELETE FROM community_members WHERE community_id = ? AND user_id = ?", first.getId(), a.getId());
        discussion("a", id, first.getId()).andExpect(status().isNotFound());
        comment("b", id, first.getId(), "탈퇴 후", java.util.UUID.randomUUID().toString()).andExpect(status().isCreated());
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM notifications WHERE type = 'sharing_comment' AND user_id = ?", Integer.class, a.getId()));
    }

    @Test
    void 하트는_멱등하게_선택_취소하고_글삭제시_대화도_삭제한다() throws Exception {
        User a = user("a"), b = user("b");
        Community room = room("A방", a, b);
        int id = shareTo("a", "나눔", room);
        react("b", id, room.getId(), "heart").andExpect(jsonPath("$[0].count").value(1));
        mvc.perform(get("/api/v1/sharings").param("communityId", "" + room.getId()).with(as("b")))
            .andExpect(jsonPath("$.sharings[0].hearted").value(true))
            .andExpect(jsonPath("$.sharings[0].reactionCount").value(1));
        mvc.perform(get("/api/v1/sharings").param("communityId", "" + room.getId()).with(as("a")))
            .andExpect(jsonPath("$.sharings[0].hearted").value(false))
            .andExpect(jsonPath("$.sharings[0].reactionCount").value(1));

        react("b", id, room.getId(), "heart").andExpect(jsonPath("$[0].count").value(1));
        react("b", id, room.getId(), "heart").andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].count").value(1)).andExpect(jsonPath("$[0].mine").value(true));
        mvc.perform(delete("/api/v1/sharings/" + id + "/reaction").param("communityId", "" + room.getId()).with(as("b")).with(csrf()))
            .andExpect(jsonPath("$[0].count").value(0));
        react("b", id, room.getId(), "invalid").andExpect(status().isBadRequest());
        react("b", id, room.getId(), "warm").andExpect(status().isBadRequest());
        comment("b", id, room.getId(), " ", java.util.UUID.randomUUID().toString()).andExpect(status().isBadRequest());
        comment("b", id, room.getId(), "가".repeat(1001), java.util.UUID.randomUUID().toString()).andExpect(status().isBadRequest());
        comment("b", id, room.getId(), "좋아요", java.util.UUID.randomUUID().toString()).andExpect(status().isCreated());
        react("b", id, room.getId(), "heart");
        mvc.perform(delete("/api/v1/sharings/" + id).with(as("a")).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/sharings/" + id).with(as("a"))).andExpect(status().isNotFound());
        // 테스트 트랜잭션은 요청 간 유지되므로 명시적으로 flush한다.
        entities.flush();
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM sharing_comments WHERE sharing_id = ?", Integer.class, id));
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM sharing_reactions WHERE sharing_id = ?", Integer.class, id));
    }
    @Autowired jakarta.persistence.EntityManager entities;

    @Test
    void 댓글은_최신50건을_오래된순으로_보여주고_이전페이지와_겹치지_않는다() throws Exception {
        User a = user("a"); Community room = room("A방", a);
        int id = shareTo("a", "나눔", room);
        for (int i = 0; i < 55; i++) jdbc.update("INSERT INTO sharing_comments(sharing_id, community_id, author_id, body, request_id) VALUES (?, ?, ?, ?, ?)",
            id, room.getId(), a.getId(), "댓글" + i, java.util.UUID.randomUUID());
        String response = discussion("a", id, room.getId()).andExpect(jsonPath("$.comments.length()").value(50))
            .andExpect(jsonPath("$.comments[0].body").value("댓글5"))
            .andExpect(jsonPath("$.comments[49].body").value("댓글54"))
            .andExpect(jsonPath("$.hasMore").value(true)).andReturn().getResponse().getContentAsString();
        int cursor = JsonPath.read(response, "$.comments[0].id");
        mvc.perform(get("/api/v1/sharings/" + id + "/discussion").param("communityId", "" + room.getId()).param("before", "" + cursor).with(as("a")))
            .andExpect(jsonPath("$.comments.length()").value(5)).andExpect(jsonPath("$.hasMore").value(false))
            .andExpect(jsonPath("$.comments[0].body").value("댓글0"));
    }

    @Test
    void 인증과_csrf가_필수이고_기도제목에는_대화를_붙일수없다() throws Exception {
        User a = user("a"); Community room = room("A방", a);
        int id = shareTo("a", "나눔", room);
        mvc.perform(get("/api/v1/sharings/" + id + "/discussion").param("communityId", "" + room.getId()))
            .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/sharings/" + id + "/comments").param("communityId", "" + room.getId()).with(as("a"))
            .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"안녕\",\"requestId\":\"" + java.util.UUID.randomUUID() + "\"}"))
            .andExpect(status().isForbidden());
        jdbc.update("UPDATE sharings SET type = 'prayer' WHERE id = ?", id);
        discussion("a", id, room.getId()).andExpect(status().isNotFound());
        comment("a", id, room.getId(), "안됨", java.util.UUID.randomUUID().toString()).andExpect(status().isNotFound());
        react("a", id, room.getId(), "heart").andExpect(status().isNotFound());
    }

    @Test
    void 공동체_연결삭제는_해당방의_대화만_지운다() throws Exception {
        User a = user("a"); Community first = room("A방", a), second = room("B방", a);
        int id = shareTo("a", "나눔", first);
        jdbc.update("INSERT INTO sharing_communities VALUES (?, ?)", id, second.getId());
        comment("a", id, first.getId(), "첫방", java.util.UUID.randomUUID().toString());
        comment("a", id, second.getId(), "둘째방", java.util.UUID.randomUUID().toString());
        react("a", id, first.getId(), "heart");
        jdbc.update("DELETE FROM sharing_communities WHERE sharing_id = ? AND community_id = ?", id, first.getId());
        discussion("a", id, first.getId()).andExpect(status().isNotFound());
        discussion("a", id, second.getId()).andExpect(jsonPath("$.commentCount").value(1));
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM sharing_reactions WHERE sharing_id = ? AND community_id = ?", Integer.class, id, first.getId()));
    }

    @Test
    void 댓글은_본인만_수정하고_수정표시는_조회에도_유지되며_재알림하지않는다() throws Exception {
        User a = user("a"), b = user("b"), c = user("c");
        Community room = room("A방", a, b), other = room("B방", c);
        int id = shareTo("a", "나눔", room);
        int cid = JsonPath.read(comment("b", id, room.getId(), "원문", java.util.UUID.randomUUID().toString())
            .andExpect(jsonPath("$.edited").value(false)).andReturn().getResponse().getContentAsString(), "$.id");
        String path = "/api/v1/sharings/" + id + "/comments/" + cid;
        for (String sub : new String[]{"a", "c"}) {
            mvc.perform(patch(path).param("communityId", "" + room.getId()).with(as(sub)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"변경\"}"))
                .andExpect(sub.equals("a") ? status().isForbidden() : status().isNotFound());
        }
        mvc.perform(patch(path).param("communityId", "" + other.getId()).with(as("b")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"변경\"}")).andExpect(status().isNotFound());
        mvc.perform(patch(path).param("communityId", "" + room.getId()).with(as("b"))
            .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"변경\"}")).andExpect(status().isForbidden());
        mvc.perform(patch(path).param("communityId", "" + room.getId()).with(as("b")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"원문\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.edited").value(false));
        for (String body : new String[]{" ", "가".repeat(1001)}) {
            mvc.perform(patch(path).param("communityId", "" + room.getId()).with(as("b")).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"" + body + "\"}"))
                .andExpect(status().isBadRequest());
        }
        mvc.perform(patch(path).param("communityId", "" + room.getId()).with(as("b")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"수정한 댓글\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.body").value("수정한 댓글")).andExpect(jsonPath("$.edited").value(true));
        discussion("a", id, room.getId()).andExpect(jsonPath("$.comments[0].edited").value(true))
            .andExpect(jsonPath("$.comments[0].body").value("수정한 댓글"));
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM notifications WHERE type = 'sharing_comment' AND user_id = ?", Integer.class, a.getId()));
        jdbc.update("DELETE FROM community_members WHERE community_id = ? AND user_id = ?", room.getId(), b.getId());
        mvc.perform(patch(path).param("communityId", "" + room.getId()).with(as("b")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"탈퇴 후\"}")).andExpect(status().isNotFound());
    }
}
