package com.cabanedulys.api.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

/** Trace d'une action administrative : qui, quoi, sur quoi, quand. Jamais de secret ni de donnée inutile. */
@Entity
@Table(name = "audit_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditEvent {

    @Id @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String actorEmail;

    @Column(nullable = false, length = 80)
    private String action;

    @Column(nullable = false, length = 40)
    private String targetType;

    @Column(length = 80)
    private String targetId;

    @Column(length = 1000)
    private String details;

    @Column(nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
