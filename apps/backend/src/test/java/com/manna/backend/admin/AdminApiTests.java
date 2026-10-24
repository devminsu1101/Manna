package com.manna.backend.admin;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import com.manna.backend.sharing.Sharing;
import com.manna.backend.sharing.SharingRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

/** 읽기 전용 관리자(D-3625). 로컬 도커 DB에 붙어 돌고, 테스트마다 롤백한다. */
@SpringBootTest(properties = {"GOOGLE_CLIENT_ID=test", "GOOGLE_CLIENT_SECRET=test"})
@AutoConfigureMockMvc
@Transactional
class AdminApiTests {

    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired UserIdentityRepository identities;
    @Autowired CommunityRepository communities;
    @Autowired CommunityMemberRepository members;
    @Autowired SharingRepository sharings;

    private User user(String sub) {
        User u = users.save(new User(sub, null));
        identities.save(new UserIdentity(u, "google", sub, null));
        return u;
    }

    private static RequestPostProcessor as(String sub) {
        return oidcLogin().idToken(t -> t.subject(sub));
    }

    @Test
    void 관리자는_속하지_않은_방과_남의_익명_기도제목까지_본다_일반은_403() throws Exception {
        User admin = user("admin");
        admin.setAdmin(true);
        User leader = user("leader");
        Community c = communities.save(new Community("남의 방", leader, "adm1code00"));
        members.save(new CommunityMember(c, leader, CommunityMember.LEADER, CommunityMember.ACTIVE));
        sharings.save(new Sharing(leader, Sharing.PRAYER, "anonymous", "몰래 기도해 주세요"));

        mvc.perform(get("/api/v1/me").with(as("admin"))).andExpect(jsonPath("$.isAdmin").value(true));
        mvc.perform(get("/api/v1/me").with(as("leader"))).andExpect(jsonPath("$.isAdmin").value(false));

        mvc.perform(get("/api/v1/admin/communities").with(as("admin")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.id == " + c.getId() + ")].leaderName").value("leader"));
        mvc.perform(get("/api/v1/admin/communities/" + c.getId()).with(as("admin")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.members[0].role").value("leader"));
        mvc.perform(get("/api/v1/admin/users/" + leader.getId()).with(as("admin")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.requests[0].body").value("몰래 기도해 주세요"))
            .andExpect(jsonPath("$.requests[0].visibility").value("anonymous"));

        mvc.perform(get("/api/v1/admin/users").with(as("leader"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/admin/communities").with(as("leader")))
            .andExpect(status().isForbidden());
    }
}
