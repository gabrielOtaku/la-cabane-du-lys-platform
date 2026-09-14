package com.cabanedulys.api.controllers;

import com.cabanedulys.api.dto.admin.AuditEventDto;
import com.cabanedulys.api.services.admin.AuditService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Back office — journal d'audit (lecture seule). */
@RestController
@RequestMapping("/admin/audit")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditController {

    private final AuditService audit;

    public AdminAuditController(AuditService audit) { this.audit = audit; }

    @GetMapping
    public List<AuditEventDto> recent(@RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "50") int size) {
        return audit.recent(page, size).map(AuditEventDto::from).getContent();
    }
}
