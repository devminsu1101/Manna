package com.manna.backend.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;

/**
 * 인증 설정. 세션 기반 OAuth2 로그인(Google).
 *
 * 브라우저는 Next 프록시(:3000 / Vercel)만 상대하고 이 백엔드는 그 뒤에 있다. 그래서 세션 쿠키가
 * first-party로 동작한다. 브라우저를 되돌려 보낼 주소(redirect_uri · 로그인 후 · 로그아웃 후)는
 * 전부 app.frontend-origin으로 절대 주소를 만든다 — 상대 경로로 두면 요청 호스트 기준으로
 * 풀려 프로덕션에서 Railway 주소로 튄다.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final OAuthUserService oAuthUserService;

    private final String frontendOrigin;

    public SecurityConfig(
            OAuthUserService oAuthUserService,
            @Value("${app.frontend-origin}") String frontendOrigin) {
        this.oAuthUserService = oAuthUserService;
        this.frontendOrigin = frontendOrigin;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // CSRF(D-404 → 재활성). 세션 쿠키는 다른 사이트가 보낸 요청에도 자동으로 실리므로,
            // 쓰기 요청(POST/PUT/PATCH/DELETE)은 쿠키와 헤더의 토큰이 같아야 통과한다.
            // spa(): 토큰을 JS가 읽을 수 있는 XSRF-TOKEN 쿠키로 주고 X-XSRF-TOKEN 헤더로 받는다.
            // 다른 사이트는 우리 쿠키를 읽지 못하니 헤더를 만들 수 없다. 쿠키를 받는 길은 CsrfController.
            // 프론트는 쓰기 요청을 전부 lib/api.ts의 apiFetch로 보낸다.
            .csrf(csrf -> csrf.spa())
            .authorizeHttpRequests(
                authorize ->
                    authorize
                        // 인증이 필요한 건 /api/v1/me 뿐. 나머지(성경·페이지)는 공개.
                        .requestMatchers("/api/v1/me")
                        .authenticated()
                        .anyRequest()
                        .permitAll())
            .oauth2Login(
                oauth2 ->
                    oauth2
                        // find-or-create를 하는 OIDC 서비스.
                        .userInfoEndpoint(userInfo -> userInfo.oidcUserService(oAuthUserService))
                        // 로그인 성공 후 프론트 홈으로.
                        .defaultSuccessUrl(frontendOrigin + "/", true)
                        // 실패(동의 거부 등)도 프론트 로그인 화면으로. 기본값 /login?error는 백엔드 주소로 풀린다.
                        .failureUrl(frontendOrigin + "/login?error"))
            .logout(logout -> logout.logoutSuccessUrl(frontendOrigin + "/login").permitAll())
            // 보호된 API는 미인증 시 로그인 페이지로 리다이렉트하지 말고 401을 준다.
            // 프론트가 fetch로 로그인 상태를 판정하기 때문 — 302 HTML을 받으면 곤란하다.
            .exceptionHandling(
                ex ->
                    ex.defaultAuthenticationEntryPointFor(
                        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                        request -> request.getRequestURI().startsWith("/api/")));

        return http.build();
    }
}
