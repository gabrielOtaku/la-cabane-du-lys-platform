package com.cabanedulys.api.dto.admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Création / mise à jour d'un drop. Le cycle de vie se change par /lifecycle. */
public record DropUpsertRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 160) String slug,
        @Size(max = 400) String subtitle,
        @Size(max = 500) String heroImage,
        Instant opensAt,
        Instant closesAt,
        @Min(1) int maxPerCustomer,
        List<UUID> productIds
) {}
