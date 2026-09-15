package com.cabanedulys.api.models;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

/** Pièce proposée dans un drop donné, avec son ordre d'affichage. */
@Entity
@Table(name = "drop_products",
       uniqueConstraints = @UniqueConstraint(name = "uq_drop_products", columnNames = {"drop_id", "product_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DropProduct {

    @Id @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "drop_id", nullable = false)
    private Drop drop;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    @Builder.Default
    private int displayOrder = 0;
}
