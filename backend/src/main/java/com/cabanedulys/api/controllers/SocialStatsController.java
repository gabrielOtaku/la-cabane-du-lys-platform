package com.cabanedulys.api.controllers;

import com.cabanedulys.api.dto.SocialStatsDto;
import com.cabanedulys.api.services.SocialStatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Compteurs sociaux publics (§6.2). */
@RestController
@RequestMapping("/stats")
public class SocialStatsController {

    private final SocialStatsService service;

    public SocialStatsController(SocialStatsService service) { this.service = service; }

    @GetMapping("/social")
    public SocialStatsDto social() { return service.get(); }
}
