package com.cabanedulys.api.controllers;

import com.cabanedulys.api.dto.EpisodeDto;
import com.cabanedulys.api.services.EpisodeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Le Coffre — épisodes, transcriptions et recherche sémantique. Seuls les épisodes publiés sont exposés ici. */
@RestController
@RequestMapping("/episodes")
public class EpisodeController {

    private final EpisodeService service;

    public EpisodeController(EpisodeService service) { this.service = service; }

    @GetMapping
    public List<EpisodeDto> all() { return service.findAll(); }

    /** Recherche plein texte — GET /episodes/search?q=levée+de+fonds (avant /{slug} : littéral prioritaire) */
    @GetMapping("/search")
    public List<EpisodeDto> search(@RequestParam String q) {
        return service.search(q);
    }

    /** Accepte un slug humain (ex. raphaelle-langevin-matsheshu-creations) ou un UUID en repli. */
    @GetMapping("/{slug}")
    public EpisodeDto one(@PathVariable String slug) { return service.findBySlug(slug); }
}
