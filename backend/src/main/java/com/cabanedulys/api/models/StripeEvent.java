package com.cabanedulys.api.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

/** Identifiant d'un événement Stripe déjà traité : un webhook reçu deux fois n'agit qu'une fois. */
@Entity
@Table(name = "stripe_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StripeEvent {

    @Id
    @Column(length = 255)
    private String id;

    @Column(nullable = false, length = 120)
    private String type;

    @Column(nullable = false)
    @Builder.Default
    private Instant receivedAt = Instant.now();
}
