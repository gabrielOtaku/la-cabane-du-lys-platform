package com.cabanedulys.api.models;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

/** Pièce exclusive d'un Drop (La Réserve). */
@Entity
@Table(name = "products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {

    @Id @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(length = 600)
    private String tagline;

    @Column(nullable = false)
    private long priceCents;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "CAD";

    private String edition;

    /** Stock de l'édition limitée. */
    @Column(nullable = false)
    @Builder.Default
    private int stock = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean available = false;
}
