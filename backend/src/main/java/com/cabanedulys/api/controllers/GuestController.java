package com.cabanedulys.api.controllers;

import com.cabanedulys.api.dto.GuestDto;
import com.cabanedulys.api.services.GuestService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** La Salle des Trophées — invités & reliques. */
@RestController
@RequestMapping("/guests")
public class GuestController {

    private final GuestService service;

    public GuestController(GuestService service) { this.service = service; }

    @GetMapping
    public List<GuestDto> all() { return service.findAll(); }
}
