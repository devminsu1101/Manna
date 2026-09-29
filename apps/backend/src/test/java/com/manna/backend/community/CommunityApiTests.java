package com.manna.backend.community;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
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
 * Community 1차(생성·목록·대문)와 권한 규칙. 로컬 도커 DB에 붙어 돌고, 테스트마다 롤백한다.
 * 사전 조건: apps/에서 docker compose up -d.
 */
@SpringBootTest(properties = {"GOOGLE_CLIENT_ID=test", "GOOGLE_CLIENT_SECRET=test"})
@AutoConfigureMockMvc
@Transactional
class CommunityApiTests {

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

    private int create(String sub, String name) throws Exception {
        String body =
            mvc.perform(
                    post("/api/v1/communities")
                        .with(as(sub))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.inviteCode").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return JsonPath.read(body, "$.id");
    }

    @Test
    void 생성자는_리더로_들어가고_목록과_대문에_리더_필드가_있다() throws Exception {
        user("leader");
        int id = create("leader", "만나 개발팀");

        mvc.perform(get("/api/v1/communities").with(as("leader")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.communities[0].status").value("active"))
            .andExpect(jsonPath("$.communities[0].memberCount").value(1))
            .andExpect(jsonPath("$.communities[0].role").value("leader"))
            .andExpect(jsonPath("$.communities[0].pendingCount").value(0));

        mvc.perform(get("/api/v1/communities/" + id).with(as("leader")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.myRole").value("leader"))
            .andExpect(jsonPath("$.inviteCode").isString())
            .andExpect(jsonPath("$.prayerPartner").isEmpty())
            .andExpect(jsonPath("$.members.length()").value(1))
            .andExpect(jsonPath("$.pendingMembers").isArray());
    }

    @Test
    void 대기자는_이름만_보이고_대문은_404_비멤버는_403() throws Exception {
        user("leader");
        User waiting = user("waiting");
        user("outsider");
        int id = create("leader", "만나 개발팀");
        Community c = communities.findById(id).orElseThrow();
        members.save(
            new CommunityMember(c, waiting, CommunityMember.MEMBER, CommunityMember.PENDING));

        mvc.perform(get("/api/v1/communities").with(as("waiting")))
            .andExpect(jsonPath("$.communities[0].status").value("pending"))
            .andExpect(jsonPath("$.communities[0].memberCount").doesNotExist());
        mvc.perform(get("/api/v1/communities/" + id).with(as("waiting")))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/communities/" + id).with(as("outsider")))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/communities/999999").with(as("outsider")))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));

        // 리더에게는 대기자가 보인다
        mvc.perform(get("/api/v1/communities/" + id).with(as("leader")))
            .andExpect(jsonPath("$.pendingMembers[0].name").value("waiting"))
            .andExpect(jsonPath("$.members.length()").value(1));
    }

    @Test
    void 일반_멤버에게는_리더_전용_필드가_없다() throws Exception {
        user("leader");
        User member = user("member");
        int id = create("leader", "만나 개발팀");
        Community c = communities.findById(id).orElseThrow();
        members.save(
            new CommunityMember(c, member, CommunityMember.MEMBER, CommunityMember.ACTIVE));

        mvc.perform(get("/api/v1/communities/" + id).with(as("member")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.myRole").value("member"))
            .andExpect(jsonPath("$.inviteCode").doesNotExist())
            .andExpect(jsonPath("$.pendingMembers").doesNotExist())
            .andExpect(jsonPath("$.members.length()").value(2));
        mvc.perform(get("/api/v1/communities").with(as("member")))
            .andExpect(jsonPath("$.communities[0].memberCount").value(2))
            .andExpect(jsonPath("$.communities[0].role").doesNotExist());
    }

    @Test
    void 빈_이름은_400_비로그인은_401() throws Exception {
        user("leader");
        mvc.perform(
                post("/api/v1/communities")
                    .with(as("leader"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"  \"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
        mvc.perform(get("/api/v1/communities")).andExpect(status().isUnauthorized());
    }
}
