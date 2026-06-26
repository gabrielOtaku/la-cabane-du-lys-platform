package com.cabanedulys.api.dto;

import java.time.Instant;
import java.util.List;

/** État de La Réserve : date d'ouverture + pièces du Drop. */
public record DropDto(Instant opensAt, boolean open, List<ProductDto> products) {}
