package com.cabanedulys.api.dto.admin;

import com.cabanedulys.api.models.Drop;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Drop vu de l'administration : cycle de vie décidé, état dérivé des dates, pièces liées. */
public record AdminDropDto(
        UUID id, String slug, String title, String subtitle, String heroImage,
        Instant opensAt, Instant closesAt, String lifecycle, String status, int maxPerCustomer,
        List<AdminProductDto> products, Instant createdAt
) {
    public static AdminDropDto from(Drop d, List<AdminProductDto> products, Instant now) {
        return new AdminDropDto(d.getId(), d.getSlug(), d.getTitle(), d.getSubtitle(), d.getHeroImage(),
                d.getOpensAt(), d.getClosesAt(), d.getLifecycle().name(), d.status(now).name(),
                d.getMaxPerCustomer(), products, d.getCreatedAt());
    }
}
