package com.cabanedulys.api.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Drop de La Réserve : fenêtre d'ouverture programmée et limite par client.
 *
 * <p>Une seule source de vérité : {@code lifecycle} est décidé par l'administration, l'état
 * public est dérivé des dates par {@link #status(Instant)}. Aucune colonne « status » stockée
 * ne peut donc contredire les dates.</p>
 */
@Entity
@Table(name = "drops")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Drop {

    @Id @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true, length = 160)
    private String slug;

    @Column(nullable = false)
    private String title;

    @Column(length = 400)
    private String subtitle;

    @Column(length = 500)
    private String heroImage;

    private Instant opensAt;
    private Instant closesAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private DropLifecycle lifecycle = DropLifecycle.DRAFT;

    @Column(nullable = false)
    @Builder.Default
    private int maxPerCustomer = 1;

    @Column(nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public DropStatus status(Instant now) {
        return switch (lifecycle) {
            case DRAFT -> DropStatus.DRAFT;
            case ARCHIVED -> DropStatus.ARCHIVED;
            case PUBLISHED -> {
                if (opensAt == null || now.isBefore(opensAt)) yield DropStatus.SCHEDULED;
                if (closesAt != null && !now.isBefore(closesAt)) yield DropStatus.CLOSED;
                yield DropStatus.OPEN;
            }
        };
    }

    public boolean isOpen(Instant now) {
        return status(now) == DropStatus.OPEN;
    }
}
