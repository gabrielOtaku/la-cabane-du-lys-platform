package com.cabanedulys.api.dto;

import com.cabanedulys.api.models.Product;
import java.util.UUID;

/**
 * Pièce d'un drop. {@code remaining} = stock moins les réservations actives ;
 * {@code available} = achetable maintenant (drop ouvert, pièce active, stock restant).
 */
public record ProductDto(
        UUID id, String name, String tagline, long priceCents,
        String currency, String edition, int remaining, boolean available
) {
    public static ProductDto from(Product p, int remaining, boolean dropOpen) {
        int left = Math.max(0, remaining);
        return new ProductDto(p.getId(), p.getName(), p.getTagline(), p.getPriceCents(),
                p.getCurrency(), p.getEdition(), left, dropOpen && p.isAvailable() && left > 0);
    }
}
