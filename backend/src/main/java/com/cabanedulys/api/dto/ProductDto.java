package com.cabanedulys.api.dto;

import com.cabanedulys.api.models.Product;
import java.util.UUID;

public record ProductDto(
        UUID id, String name, String tagline, long priceCents,
        String currency, String edition, boolean available
) {
    public static ProductDto from(Product p) {
        return new ProductDto(p.getId(), p.getName(), p.getTagline(), p.getPriceCents(),
                p.getCurrency(), p.getEdition(), p.isAvailable());
    }
}
