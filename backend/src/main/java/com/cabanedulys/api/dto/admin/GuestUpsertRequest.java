package com.cabanedulys.api.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Création / mise à jour d'un invité. Aucune donnée financière : le modèle n'en a pas. */
public record GuestUpsertRequest(
        @NotBlank @Size(max = 255) String name,
        @Size(max = 160) String slug,
        @Size(max = 255) String role,
        @Size(max = 255) String company,
        @Size(max = 500) String companyUrl,
        @Size(max = 120) String city,
        @Size(max = 120) String region,
        @Size(max = 120) String category,
        @Size(max = 400) String angle,
        @Size(max = 2000) String bio,
        @Size(max = 500) String photoUrl,
        @Size(max = 600) String quote,
        boolean featured
) {}
