package com.cabanedulys.api.dto;

import com.cabanedulys.api.models.Order;
import java.util.UUID;

/** Suivi public minimal d'une commande après retour de Stripe : identifiant et état seulement. */
public record OrderStatusDto(UUID id, String status) {
    public static OrderStatusDto from(Order o) {
        return new OrderStatusDto(o.getId(), o.getStatus().name());
    }
}
