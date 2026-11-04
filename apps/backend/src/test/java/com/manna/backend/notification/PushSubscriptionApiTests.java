package com.manna.backend.notification;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.manna.backend.domain.User;
import com.manna.backend.domain.UserIdentity;
import com.manna.backend.repository.UserIdentityRepository;
import com.manna.backend.repository.UserRepository;
import java.util.Base64;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = {
    "GOOGLE_CLIENT_ID=test", "GOOGLE_CLIENT_SECRET=test",
    "push.vapid.public-key=BOH8nTQA5iZhl23-NCzGG9prvOZ5BE0MJXBW-GUkQIvRVTVB32JxmX0V1j6z0r7rnT7-bgi6f2g5fMPpAh5brqM",
    "push.vapid.private-key=TRlY_7yQzvqcLpgHQTxiU5fVzAAvAw_cdSh5kLFLNqg"
})
@AutoConfigureMockMvc
@Transactional
class PushSubscriptionApiTests {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired UserIdentityRepository identities;
    @Autowired PushSubscriptionRepository subscriptions;

    private User user(String sub) {
        User u = users.save(new User(sub, null));
        identities.save(new UserIdentity(u, "google", sub, null));
        return u;
    }

    private static RequestPostProcessor as(String sub) {
        return oidcLogin().idToken(t -> t.subject(sub));
    }

    @Test
    void 등록은_본인_기기로_연결하고_계정_전환과_해제를_처리한다() throws Exception {
        User first = user("first");
        User second = user("second");
        String endpoint = "https://web.push.apple.com/test-subscription";
        String p256dh = Base64.getUrlEncoder().withoutPadding().encodeToString(new byte[65]);
        String auth = Base64.getUrlEncoder().withoutPadding().encodeToString(new byte[16]);
        String body = "{\"endpoint\":\"" + endpoint + "\",\"keys\":{\"p256dh\":\""
            + p256dh + "\",\"auth\":\"" + auth + "\"}}";

        mvc.perform(get("/api/v1/notifications/push-key").with(as("first")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.publicKey").isNotEmpty());
        mvc.perform(post("/api/v1/notifications/subscriptions").with(as("first"))
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isForbidden()); // CSRF
        mvc.perform(post("/api/v1/notifications/subscriptions").with(as("first")).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isNoContent());
        org.junit.jupiter.api.Assertions.assertEquals(1L, subscriptions.countByUserId(first.getId()));

        mvc.perform(post("/api/v1/notifications/subscriptions").with(as("second")).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isNoContent());
        org.junit.jupiter.api.Assertions.assertEquals(0L, subscriptions.countByUserId(first.getId()));
        org.junit.jupiter.api.Assertions.assertEquals(1L, subscriptions.countByUserId(second.getId()));

        mvc.perform(delete("/api/v1/notifications/subscriptions").with(as("first")).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"endpoint\":\"" + endpoint + "\"}"))
            .andExpect(status().isNoContent());
        org.junit.jupiter.api.Assertions.assertEquals(1L, subscriptions.countByUserId(second.getId()));
        mvc.perform(delete("/api/v1/notifications/subscriptions").with(as("second")).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"endpoint\":\"" + endpoint + "\"}"))
            .andExpect(status().isNoContent());
        org.junit.jupiter.api.Assertions.assertEquals(0L, subscriptions.countByUserId(second.getId()));
    }

    @Test
    void 내부_주소는_푸시_종단점으로_등록하지_않는다() throws Exception {
        user("me");
        String body = "{\"endpoint\":\"https://127.0.0.1/push\",\"keys\":{\"p256dh\":\"abc\",\"auth\":\"abc\"}}";
        mvc.perform(post("/api/v1/notifications/subscriptions").with(as("me")).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest());
    }
}
