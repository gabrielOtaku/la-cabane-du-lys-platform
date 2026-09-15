package com.cabanedulys.api.dto;

import com.cabanedulys.api.models.Guest;
import java.util.UUID;

/** Résumé d'invité imbriqué dans EpisodeDto — évite une jointure supplémentaire côté client. */
public record GuestSummaryDto(UUID id, String slug, String name, String role, String company) {
    public static GuestSummaryDto from(Guest g) {
        return new GuestSummaryDto(g.getId(), g.getSlug(), g.getName(), g.getRole(), g.getCompany());
    }
}
