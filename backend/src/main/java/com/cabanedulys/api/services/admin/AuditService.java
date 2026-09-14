package com.cabanedulys.api.services.admin;

import com.cabanedulys.api.models.AuditEvent;
import com.cabanedulys.api.repositories.AuditEventRepository;
import com.cabanedulys.api.security.SessionPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Journal d'audit : l'acteur est lu dans le contexte de sécurité, jamais fourni par le client. */
@Service
public class AuditService {

    private final AuditEventRepository repo;

    public AuditService(AuditEventRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public void log(String action, String targetType, Object targetId, String details) {
        repo.save(AuditEvent.builder()
                .actorEmail(currentActor())
                .action(action)
                .targetType(targetType)
                .targetId(targetId == null ? null : truncate(targetId.toString(), 80))
                .details(truncate(details, 1000))
                .build());
    }

    @Transactional(readOnly = true)
    public Page<AuditEvent> recent(int page, int size) {
        return repo.findAllByOrderByCreatedAtDesc(PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 200)));
    }

    private static String currentActor() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a != null && a.getPrincipal() instanceof SessionPrincipal p) return p.email();
        return "system";
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
