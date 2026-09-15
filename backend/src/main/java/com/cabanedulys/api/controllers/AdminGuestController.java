package com.cabanedulys.api.controllers;

import com.cabanedulys.api.dto.GuestDto;
import com.cabanedulys.api.dto.admin.GuestUpsertRequest;
import com.cabanedulys.api.services.admin.AdminGuestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Back office — invités. */
@RestController
@RequestMapping("/admin/guests")
@PreAuthorize("hasRole('ADMIN')")
public class AdminGuestController {

    private final AdminGuestService service;

    public AdminGuestController(AdminGuestService service) { this.service = service; }

    @GetMapping
    public List<GuestDto> list() { return service.list(); }

    @GetMapping("/{id}")
    public GuestDto one(@PathVariable UUID id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GuestDto create(@Valid @RequestBody GuestUpsertRequest req) { return service.create(req); }

    @PutMapping("/{id}")
    public GuestDto update(@PathVariable UUID id, @Valid @RequestBody GuestUpsertRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) { service.delete(id); }
}
