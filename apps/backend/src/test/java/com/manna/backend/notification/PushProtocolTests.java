package com.manna.backend.notification;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.security.Security;
import java.util.Base64;
import nl.martijndwars.webpush.Encoding;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.junit.jupiter.api.Test;

/** 네트워크 없이 VAPID 서명과 Safari가 쓰는 aes128gcm 페이로드 생성까지 검증한다. */
class PushProtocolTests {
    @Test
    void vapid_서명과_암호화된_푸시_요청을_만든다() throws Exception {
        Security.addProvider(new BouncyCastleProvider());
        String publicKey = "BOH8nTQA5iZhl23-NCzGG9prvOZ5BE0MJXBW-GUkQIvRVTVB32JxmX0V1j6z0r7rnT7-bgi6f2g5fMPpAh5brqM";
        String privateKey = "TRlY_7yQzvqcLpgHQTxiU5fVzAAvAw_cdSh5kLFLNqg";
        PushService service = new PushService();
        service.setPublicKey(publicKey);
        service.setPrivateKey(privateKey);
        service.setSubject("https://manna-five-tau.vercel.app");
        String auth = Base64.getUrlEncoder().withoutPadding().encodeToString(new byte[16]);
        var message = new nl.martijndwars.webpush.Notification(
            "https://web.push.apple.com/test", publicKey, auth,
            "{\"body\":\"수신 시험\"}".getBytes(StandardCharsets.UTF_8));

        var request = service.preparePost(message, Encoding.AES128GCM);
        assertNotNull(request.getFirstHeader("Authorization"));
        assertTrue(request.getFirstHeader("Authorization").getValue().startsWith("vapid "));
        assertTrue(request.getEntity().getContentLength() > 0);
    }
}
