package com.manna.backend.sharing;

import com.manna.backend.auth.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/sharings/{id}")
public class SharingDiscussionController {
    private final SharingDiscussionService service;
    private final CurrentUser currentUser;
    public SharingDiscussionController(SharingDiscussionService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }
    public record CommentRequest(@NotBlank @Size(max = 1000) String body, @NotNull UUID requestId) {}
    public record EditCommentRequest(@NotBlank @Size(max = 1000) String body) {}
    public record ReactionRequest(@NotBlank String key) {}

    @GetMapping("/discussion")
    public SharingDiscussionService.Discussion read(@AuthenticationPrincipal OidcUser principal,
            @PathVariable int id, @RequestParam int communityId, @RequestParam(required = false) Integer before) {
        return service.read(currentUser.id(principal), id, communityId, before);
    }
    @PostMapping("/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public SharingDiscussionService.Comment comment(@AuthenticationPrincipal OidcUser principal,
            @PathVariable int id, @RequestParam int communityId, @Valid @RequestBody CommentRequest req) {
        return service.comment(currentUser.id(principal), id, communityId, req.body(), req.requestId());
    }
    @PatchMapping("/comments/{commentId}")
    public SharingDiscussionService.Comment update(@AuthenticationPrincipal OidcUser principal, @PathVariable int id,
            @RequestParam int communityId, @PathVariable int commentId, @Valid @RequestBody EditCommentRequest req) {
        return service.update(currentUser.id(principal), id, communityId, commentId, req.body());
    }
    @DeleteMapping("/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal OidcUser principal, @PathVariable int id,
            @RequestParam int communityId, @PathVariable int commentId) {
        service.delete(currentUser.id(principal), id, communityId, commentId);
    }
    @PutMapping("/reaction")
    public List<SharingDiscussionService.Reaction> react(@AuthenticationPrincipal OidcUser principal,
            @PathVariable int id, @RequestParam int communityId, @Valid @RequestBody ReactionRequest req) {
        return service.react(currentUser.id(principal), id, communityId, req.key());
    }
    @DeleteMapping("/reaction")
    public List<SharingDiscussionService.Reaction> unreact(@AuthenticationPrincipal OidcUser principal,
            @PathVariable int id, @RequestParam int communityId) {
        return service.react(currentUser.id(principal), id, communityId, null);
    }
}
