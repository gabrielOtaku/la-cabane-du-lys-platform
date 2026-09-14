package com.cabanedulys.api.controllers;

import com.cabanedulys.api.dto.admin.AdminEpisodeDto;
import com.cabanedulys.api.dto.admin.EpisodeUpsertRequest;
import com.cabanedulys.api.services.admin.AdminEpisodeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Back office — épisodes (brouillons inclus). Rôle ADMIN : règle d'URL + annotation. */
@RestController
@RequestMapping("/admin/episodes")
@PreAuthorize("hasRole('ADMIN')")
public class AdminEpisodeController {

    private final AdminEpisodeService service;

    public AdminEpisodeController(AdminEpisodeService service) { this.service = service; }

    @GetMapping
    public List<AdminEpisodeDto> list() { return service.list(); }

    @GetMapping("/{id}")
    public AdminEpisodeDto one(@PathVariable UUID id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminEpisodeDto create(@Valid @RequestBody EpisodeUpsertRequest req) { return service.create(req); }

    @PutMapping("/{id}")
    public AdminEpisodeDto update(@PathVariable UUID id, @Valid @RequestBody EpisodeUpsertRequest req) {
        return service.update(id, req);
    }

    @PostMapping("/{id}/publish")
    public AdminEpisodeDto publish(@PathVariable UUID id) { return service.publish(id); }

    @PostMapping("/{id}/unpublish")
    public AdminEpisodeDto unpublish(@PathVariable UUID id) { return service.unpublish(id); }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) { service.delete(id); }
}
