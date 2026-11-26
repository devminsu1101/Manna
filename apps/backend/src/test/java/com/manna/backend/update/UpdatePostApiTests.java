package com.manna.backend.update;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.jayway.jsonpath.JsonPath;
import com.manna.backend.domain.User;
import com.manna.backend.domain.UserIdentity;
import com.manna.backend.notification.PushDeliveryService;
import com.manna.backend.repository.UserIdentityRepository;
import com.manna.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = {"GOOGLE_CLIENT_ID=test", "GOOGLE_CLIENT_SECRET=test"})
@AutoConfigureMockMvc
@Transactional
class UpdatePostApiTests {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired UserIdentityRepository identities;
    @Autowired JdbcTemplate jdbc;
    @MockitoBean PushDeliveryService push;

    private User user(String name, boolean admin) {
        User user = new User(name, null);
        user.setAdmin(admin);
        users.saveAndFlush(user);
        identities.saveAndFlush(new UserIdentity(user, "google", name, null));
        return user;
    }
    private int draft() throws Exception {
        user("update-admin", true);
        String body = mvc.perform(post("/api/v1/admin/updates").with(oidcLogin().idToken(t -> t.subject("update-admin"))).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"새 소식\",\"body\":\"본문\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.publishedAt").isEmpty())
            .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.id");
    }

    @Test void draft_is_private_and_only_admin_can_write() throws Exception {
        int id = draft();
        user("update-member", false);
        mvc.perform(get("/api/v1/updates/" + id)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/updates")).andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.id == " + id + ")]").isEmpty());
        mvc.perform(get("/api/v1/admin/updates").with(oidcLogin().idToken(t -> t.subject("update-member"))))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/admin/updates/" + id + "/publish").with(oidcLogin().idToken(t -> t.subject("update-member"))).with(csrf()))
            .andExpect(status().isForbidden());
        mvc.perform(patch("/api/v1/admin/updates/" + id).with(oidcLogin().idToken(t -> t.subject("update-member"))).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"수정\",\"body\":\"수정\"}"))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/admin/updates/" + id + "/publish").with(oidcLogin().idToken(t -> t.subject("update-admin"))))
            .andExpect(status().isForbidden());
        verifyNoInteractions(push);
    }

    @Test void publish_notifies_once_and_edit_does_not_notify() throws Exception {
        int id = draft();
        user("update-reader", false);
        for (int i = 0; i < 2; i++) {
            mvc.perform(post("/api/v1/admin/updates/" + id + "/publish").with(oidcLogin().idToken(t -> t.subject("update-admin"))).with(csrf()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.publishedAt").isString());
        }
        mvc.perform(patch("/api/v1/admin/updates/" + id).with(oidcLogin().idToken(t -> t.subject("update-admin"))).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"수정된 소식\",\"body\":\"수정된 본문\"}"))
            .andExpect(status().isOk());
        mvc.perform(get("/api/v1/updates/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.title").value("수정된 소식"));
        long recipients = users.count();
        assertEquals(recipients, jdbc.queryForObject("select count(*) from notifications where type='update_published' and link_path=?", Long.class, "/mypage/updates/" + id));
        verify(push, times((int) recipients)).enqueue(any());
    }

    @Test void rejects_blank_content_and_external_photo() throws Exception {
        int id = draft();
        mvc.perform(patch("/api/v1/admin/updates/" + id).with(oidcLogin().idToken(t -> t.subject("update-admin"))).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"   \",\"body\":\"본문\"}"))
            .andExpect(status().isBadRequest());
        mvc.perform(patch("/api/v1/admin/updates/" + id + "/photo").with(oidcLogin().idToken(t -> t.subject("update-admin"))).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"photoUrl\":\"https://example.com/image.jpg\"}"))
            .andExpect(status().isBadRequest());
        mvc.perform(patch("/api/v1/admin/updates/" + id + "/photo").with(oidcLogin().idToken(t -> t.subject("update-admin"))).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"photoUrl\":\"https://test.public.blob.vercel-storage.com/updates/photo.jpg\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.photoUrl").isString());
        verifyNoInteractions(push);
    }
}
