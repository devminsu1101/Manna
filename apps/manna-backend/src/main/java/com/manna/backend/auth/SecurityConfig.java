package com.manna.backend.auth;

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
 * 브라우저는 Next 프록시(:3000)만 상대하고 이 백엔드는 그 뒤에 있다. 그래서 세션 쿠키가
 * first-party로 동작한다. application.properties의 forward-headers-strategy=framework가
 * 프록시 뒤에서도 redirect_uri를 :3000 오리진으로 만들어 준다.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final OAuthUserService oAuthUserService;

    public SecurityConfig(OAuthUserService oAuthUserService) {
        this.oAuthUserService = oAuthUserService;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // ⚠️ TODO(v1.1): CSRF를 끈다. 지금은 변경 API가 없어(로그인/로그아웃뿐) 위험이 낮지만,
            // 나눔·기도 쓰기(POST/PUT/DELETE)가 들어오면 **반드시** 다시 켜야 한다. 세션 쿠키 앱은
            // CSRF에 취약하다. 표준 방법: CookieCsrfTokenRepository.withHttpOnlyFalse() + 프론트가
            // XSRF-TOKEN 쿠키를 읽어 X-XSRF-TOKEN 헤더로 보낸다.
            .csrf(csrf -> csrf.disable())
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
                        // 로그인 성공 후 프론트 홈으로. 프록시를 통해 :3000/이 된다.
                        .defaultSuccessUrl("/", true))
            .logout(logout -> logout.logoutSuccessUrl("/login").permitAll())
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
