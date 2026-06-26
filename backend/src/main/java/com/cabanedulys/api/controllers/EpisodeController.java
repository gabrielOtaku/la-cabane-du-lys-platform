package com.cabanedulys.api.controllers;

import com.cabanedulys.api.dto.EpisodeDto;
import com.cabanedulys.api.services.EpisodeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Le Coffre — épisodes, transcriptions et recherche sémantique. */
@RestController
@RequestMapping("/episodes")
public class EpisodeController {

    private final EpisodeService service;

    public EpisodeController(EpisodeService service) { this.service = service; }

    @GetMapping
    public List<EpisodeDto> all() { return service.findAll(); }

    @GetMapping("/{id}")
    public EpisodeDto one(@PathVariable UUID id) { return service.findById(id); }

    /** Recherche plein texte — GET /episodes/search?q=levée+de+fonds */
    @GetMapping("/search")
    public List<EpisodeDto> search(@RequestParam String q) {
        return service.search(q);
    }
}
