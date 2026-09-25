package com.manna.backend.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * CSRF 토큰 쿠키(XSRF-TOKEN)를 내려 준다. 프론트가 쓰기 요청 전에 쿠키가 없으면 부른다.
 *
 * 따로 두는 이유: csrf.spa()의 토큰은 지연 로딩이라 **누군가 읽어야** 쿠키가 쓰인다. 그리고
 * 다른 경로로는 쿠키가 브라우저에 못 닿는다 — /api/v1/me는 Next 라우트 핸들러가 Set-Cookie를
 * 버리고, 로그인 직후엔 CsrfAuthenticationStrategy가 토큰을 지운다. 이 경로는 Next가 rewrite로
 * 넘기므로 Set-Cookie가 프론트 도메인에 그대로 붙는다.
 *
 * 본문 없이 204다. 값은 쿠키로 가져가면 된다.
 */
@RestController
public class CsrfController {

    @GetMapping("/api/v1/csrf")
    public ResponseEntity<Void> csrf(CsrfToken token) {
        token.getToken(); // 읽는 순간 CookieCsrfTokenRepository가 Set-Cookie를 쓴다
        return ResponseEntity.noContent().build();
    }
}
