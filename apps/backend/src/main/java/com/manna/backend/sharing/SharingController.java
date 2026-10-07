package com.manna.backend.sharing;

import com.manna.backend.auth.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** 나눔 API. 명세는 docs/03_API_SPEC.md의 Sharing 절. 로그인 필수(SecurityConfig). */
@RestController
@RequestMapping("/api/v1/sharings")
public class SharingController {

    private final SharingService service;
    private final CurrentUser currentUser;

    public SharingController(SharingService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    public record CreateRequest(
            @NotNull(message = "나눔 종류를 골라 주세요.") String type,
            @NotBlank(message = "내용을 입력해 주세요.")
                @Size(max = 2000, message = "내용은 2000자까지입니다.")
                String body,
            // 나눔은 방에 거는 글이다(D-3501)
            @NotEmpty(message = "나눌 공동체를 하나 이상 골라 주세요.") List<@NotNull Integer> communityIds) {}

    public record UpdateRequest(
            @NotBlank(message = "내용을 입력해 주세요.")
                @Size(max = 2000, message = "내용은 2000자까지입니다.")
                String body) {}

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SharingService.Created create(
            @AuthenticationPrincipal OidcUser principal,
            @Valid @RequestBody CreateRequest req) {
        return service.create(
            currentUser.id(principal), req.type(), req.body(), req.communityIds());
    }

    @GetMapping                                                 // 한 방의 나눔 — 공동체별로만 본다(D-3502)
    public SharingService.ListResponse list(
            @AuthenticationPrincipal OidcUser principal,
            @RequestParam Integer communityId) {
        return service.list(currentUser.id(principal), communityId);
    }

    @GetMapping("/{id}")
    public SharingService.Item detail(
            @AuthenticationPrincipal OidcUser principal,
            @PathVariable Integer id) {
        return service.detail(currentUser.id(principal), id);
    }

    @PatchMapping("/{id}")                                      // 본문만(D-3504), 작성자만
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void update(
            @AuthenticationPrincipal OidcUser principal,
            @PathVariable Integer id,
            @Valid @RequestBody UpdateRequest req) {
        service.update(currentUser.id(principal), id, req.body());
    }

    @DeleteMapping("/{id}")                                     // 작성자만(D-3506)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal OidcUser principal,
            @PathVariable Integer id) {
        service.delete(currentUser.id(principal), id);
    }
}
