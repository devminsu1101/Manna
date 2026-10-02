package com.manna.backend.community;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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

    // ── 2차: 초대 · 승인 ─────────────────────────────────────────────────

    private String inviteCode(int id) {
        return communities.findById(id).orElseThrow().getInviteCode();
    }

    @Test
    void 초대_미리보기_신청_승인_흐름() throws Exception {
        user("leader");
        User joiner = user("joiner");
        int id = create("leader", "만나 개발팀");
        String code = inviteCode(id);

        // 비로그인 — 이름만
        mvc.perform(get("/api/v1/invites/" + code))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.communityName").value("만나 개발팀"))
            .andExpect(jsonPath("$.communityId").doesNotExist())
            .andExpect(jsonPath("$.myStatus").doesNotExist());
        mvc.perform(get("/api/v1/invites/nope")).andExpect(status().isNotFound());

        // 신청 → pending, 중복 409, 대문은 404
        mvc.perform(post("/api/v1/invites/" + code + "/requests").with(as("joiner")).with(csrf()))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.communityId").value(id))
            .andExpect(jsonPath("$.status").value("pending"));
        mvc.perform(post("/api/v1/invites/" + code + "/requests").with(as("joiner")).with(csrf()))
            .andExpect(status().isConflict());
        mvc.perform(get("/api/v1/invites/" + code).with(as("joiner")))
            .andExpect(jsonPath("$.myStatus").value("pending"))
            .andExpect(jsonPath("$.communityId").doesNotExist());
        mvc.perform(get("/api/v1/communities/" + id).with(as("joiner")))
            .andExpect(status().isNotFound());

        // 신청자는 스스로 승인 못 한다(대문조차 못 보는 pending)
        String approve = "/api/v1/communities/" + id + "/members/" + joiner.getId() + "/approve";
        mvc.perform(post(approve).with(as("joiner")).with(csrf()))
            .andExpect(status().isNotFound());

        // 리더 승인 → 대문 200, 재승인 409, 미리보기는 active + id
        mvc.perform(post(approve).with(as("leader")).with(csrf()))
            .andExpect(status().isNoContent());
        mvc.perform(post(approve).with(as("leader")).with(csrf()))
            .andExpect(status().isConflict());
        mvc.perform(get("/api/v1/communities/" + id).with(as("joiner")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.inviteCode").doesNotExist());
        mvc.perform(get("/api/v1/invites/" + code).with(as("joiner")))
            .andExpect(jsonPath("$.myStatus").value("active"))
            .andExpect(jsonPath("$.communityId").value(id));
    }

    @Test
    void 거절은_리더나_본인만_리더는_못_나간다() throws Exception {
        User leader = user("leader");
        User a = user("a");
        User b = user("b");
        int id = create("leader", "만나 개발팀");
        Community c = communities.findById(id).orElseThrow();
        members.save(new CommunityMember(c, a, CommunityMember.MEMBER, CommunityMember.ACTIVE));
        members.save(new CommunityMember(c, b, CommunityMember.MEMBER, CommunityMember.PENDING));
        String base = "/api/v1/communities/" + id + "/members/";

        // 일반 멤버는 남을 못 지운다
        mvc.perform(delete(base + b.getId()).with(as("a")).with(csrf()))
            .andExpect(status().isForbidden());
        // 리더의 거절
        mvc.perform(delete(base + b.getId()).with(as("leader")).with(csrf()))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/communities").with(as("b")))
            .andExpect(jsonPath("$.communities.length()").value(0));
        // 본인 나가기
        mvc.perform(delete(base + a.getId()).with(as("a")).with(csrf()))
            .andExpect(status().isNoContent());
        // 리더는 못 나간다 — 승인할 사람이 없어진다
        mvc.perform(delete(base + leader.getId()).with(as("leader")).with(csrf()))
            .andExpect(status().isConflict());
    }
}
