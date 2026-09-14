package com.cabanedulys.api.dto.admin;

import com.cabanedulys.api.models.Product;
import java.util.UUID;

/** Pièce vue de l'administration : stock brut, réservations actives et reste disponible. */
public record AdminProductDto(
        UUID id, String name, String tagline, long priceCents, String currency, String edition,
        int stock, long reserved, int remaining, boolean available
) {
    public static AdminProductDto from(Product p, long reserved) {
        return new AdminProductDto(p.getId(), p.getName(), p.getTagline(), p.getPriceCents(), p.getCurrency(),
                p.getEdition(), p.getStock(), reserved, (int) Math.max(0, p.getStock() - reserved), p.isAvailable());
    }
}
