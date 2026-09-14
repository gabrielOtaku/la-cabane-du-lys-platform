package com.cabanedulys.api.dto.admin;

import com.cabanedulys.api.models.AuditEvent;
import java.time.Instant;
import java.util.UUID;

public record AuditEventDto(UUID id, String actorEmail, String action, String targetType, String targetId,
                            String details, Instant createdAt) {
    public static AuditEventDto from(AuditEvent e) {
        return new AuditEventDto(e.getId(), e.getActorEmail(), e.getAction(), e.getTargetType(), e.getTargetId(),
                e.getDetails(), e.getCreatedAt());
    }
}
