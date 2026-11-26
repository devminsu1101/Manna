package com.manna.backend.update;

import com.manna.backend.auth.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class UpdatePostController {
    private final UpdatePostService service;
    private final CurrentUser currentUser;
    public UpdatePostController(UpdatePostService service, CurrentUser currentUser) {
        this.service = service; this.currentUser = currentUser;
    }

    public record WriteRequest(@NotBlank @Size(max = 100) String title, @NotBlank @Size(max = 10000) String body) {}
    public record PhotoRequest(@Size(max = 2048) String photoUrl) {}
    public record Summary(Integer id, String title, java.time.OffsetDateTime publishedAt) {}

    @GetMapping("/updates")
    public List<Summary> list() { return service.list().stream().map(p -> new Summary(p.getId(), p.getTitle(), p.getPublishedAt())).toList(); }
    @GetMapping("/updates/{id}")
    public UpdatePost get(@PathVariable Integer id) { return service.get(id); }
    @GetMapping("/admin/updates")
    public List<UpdatePost> adminList(@AuthenticationPrincipal OidcUser principal) { return service.adminList(currentUser.id(principal)); }
    @GetMapping("/admin/updates/{id}")
    public UpdatePost adminGet(@AuthenticationPrincipal OidcUser principal, @PathVariable Integer id) { return service.adminGet(currentUser.id(principal), id); }
    @PostMapping("/admin/updates") @ResponseStatus(HttpStatus.CREATED)
    public UpdatePost create(@AuthenticationPrincipal OidcUser principal, @Valid @RequestBody WriteRequest req) { return service.create(currentUser.id(principal), req.title(), req.body()); }
    @PatchMapping("/admin/updates/{id}")
    public UpdatePost edit(@AuthenticationPrincipal OidcUser principal, @PathVariable Integer id, @Valid @RequestBody WriteRequest req) { return service.edit(currentUser.id(principal), id, req.title(), req.body()); }
    @PatchMapping("/admin/updates/{id}/photo")
    public UpdatePost photo(@AuthenticationPrincipal OidcUser principal, @PathVariable Integer id, @Valid @RequestBody PhotoRequest req) { return service.photo(currentUser.id(principal), id, req.photoUrl()); }
    @PostMapping("/admin/updates/{id}/publish")
    public UpdatePost publish(@AuthenticationPrincipal OidcUser principal, @PathVariable Integer id) { return service.publish(currentUser.id(principal), id); }
}
