package com.cabanedulys.api.dto;

import java.time.Instant;
import java.util.List;

/**
 * État public de La Réserve. {@code status} vaut NONE (aucun drop programmé), SCHEDULED,
 * OPEN ou CLOSED. Les dates sont celles persistées : le compte à rebours atteint réellement zéro.
 */
public record DropDto(
        String status,
        String slug,
        String title,
        String subtitle,
        String heroImage,
        Instant opensAt,
        Instant closesAt,
        int maxPerCustomer,
        List<ProductDto> products
) {
    public static DropDto none() {
        return new DropDto("NONE", null, null, null, null, null, null, 0, List.of());
    }
}
