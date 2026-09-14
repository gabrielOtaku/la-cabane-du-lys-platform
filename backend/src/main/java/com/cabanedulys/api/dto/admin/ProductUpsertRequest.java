package com.cabanedulys.api.dto.admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProductUpsertRequest(
        @NotBlank @Size(max = 255) String name,
        @Size(max = 600) String tagline,
        @Min(0) long priceCents,
        @NotBlank @Pattern(regexp = "^[A-Za-z]{3}$", message = "code devise ISO à trois lettres") String currency,
        @Size(max = 255) String edition,
        @Min(0) int stock,
        boolean available
) {}
