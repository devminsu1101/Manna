package com.manna.backend.community;

import com.manna.backend.auth.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** 공동체 API. 명세는 docs/03_API_SPEC.md의 Community 절. 로그인 필수(SecurityConfig). */

@RestController                         // 이 클래스는 HTTP 메서드(GET, POST, PUT, DELETE)를 통해 요청을 받는 곳이고 반환값은 JSON 으로 표현하여 준다 (== REST 통신 한다)
@RequestMapping("/api/v1/communities")  // 이 클래스의 모든 API는 이 주소로 시작한다
public class CommunityController {

    private final CommunityService service;
    private final CurrentUser currentUser;

    public CommunityController(CommunityService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    // 100자: communities.name VARCHAR(100)
    public record CreateRequest(
            @NotBlank(message = "이름을 입력해 주세요.")
                @Size(max = 100, message = "이름은 100자까지입니다.")
                String name) {}

@PostMapping                                                // 'POST' /api/v1/communities 가 오면 이 메서드를 실행한다. 
    @ResponseStatus(HttpStatus.CREATED)                     // 성공 시 기본 응답은 200인데, 해당 응답 성공 시 response status 를 '201 CREATED' 로 바꾼다. 
    public CommunityService.Created create(
            @AuthenticationPrincipal OidcUser principal,    // 누가 호출했는지 알기 위해 로그인한 사람 정보를 principal 안에 넣는다. 
            @Valid                                          // 그 정보가 잘못되지 않았는지 Validation Check를 한다 
            @RequestBody CreateRequest req) {               // CREATE 로 바꿔야 하니까 요청 본문 JSON(Body JSON)을 CreateRequest로 바꾼다.  
        return service.create(currentUser.id(principal), req.name()); 
    }

    @GetMapping                         // GET /api/v1/communities 가 오면 이 메서드를 실행한다. 
    public CommunityService.ListResponse list(@AuthenticationPrincipal OidcUser principal) {
        return service.list(currentUser.id(principal));
    }

    @GetMapping("/{id}")                                        // GET /api/v1/communities/{id} 가 오면 이 메서드를 실행한다. 
    public CommunityService.Detail detail(
            @AuthenticationPrincipal OidcUser principal,        // '누가 호출했는지 알기 위해' 로그인한 사람 정보(OidcUser)을 principal 에다 넣고  
            @PathVariable Integer id) {                         // 주소에서 받은 'id' 값을 넣으면 
        return service.detail(currentUser.id(principal), id);   // CommunityService 의 detail 함수를 실행한 결과를 return 하겠다.
    }

    @PostMapping("/{id}/members/{userId}/approve")              // 가입 신청 승인 (리더)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void approve(
            @AuthenticationPrincipal OidcUser principal,
            @PathVariable Integer id,
            @PathVariable Integer userId) {
        service.approve(currentUser.id(principal), id, userId);
    }

    @DeleteMapping("/{id}/members/{userId}")                    // 거절 · 강퇴 · 나가기
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(
            @AuthenticationPrincipal OidcUser principal,
            @PathVariable Integer id,
            @PathVariable Integer userId) {
        service.remove(currentUser.id(principal), id, userId);
    }
}
