package com.manna.backend.sharing;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
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
    void 홈_소식은_내_방_사람들의_나눔_기도제목이고_내_것은_없다() throws Exception {
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

        // 최신순: b의 기도제목 → b의 나눔(두 방이지만 한 번). 내 글 · 다른 방 글은 없다
        mvc.perform(get("/api/v1/sharings/feed").with(as("a")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items.length()").value(2))
            .andExpect(jsonPath("$.items[0].kind").value("prayer"))
            .andExpect(jsonPath("$.items[0].userId").value(b.getId()))
            .andExpect(jsonPath("$.items[0].firstLine").value("첫 줄"))
            .andExpect(jsonPath("$.items[1].kind").value("sharing"))
            .andExpect(jsonPath("$.items[1].name").value("b"))
            .andExpect(jsonPath("$.items[1].firstLine").value("두 방에 같은 글"));
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
}
