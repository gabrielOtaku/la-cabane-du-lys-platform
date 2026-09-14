package com.cabanedulys.api.dto.admin;

import com.cabanedulys.api.models.Order;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Commande vue de l'administration : le nécessaire pour préparer et suivre, rien de plus. */
public record AdminOrderDto(
        UUID id, String status, long totalCents, String currency, String customerEmail,
        String dropSlug, String stripeReference, Instant createdAt, List<Item> items
) {
    public record Item(UUID productId, String productName, int quantity, long unitPriceCents) {}

    public static AdminOrderDto from(Order o) {
        String currency = o.getItems().isEmpty() ? "CAD" : o.getItems().get(0).getProduct().getCurrency();
        return new AdminOrderDto(
                o.getId(), o.getStatus().name(), o.getTotalCents(), currency,
                o.getUser() == null ? null : o.getUser().getEmail(),
                o.getDrop() == null ? null : o.getDrop().getSlug(),
                o.getStripeReference(), o.getCreatedAt(),
                o.getItems().stream().map(i -> new Item(i.getProduct().getId(), i.getProduct().getName(),
                        i.getQuantity(), i.getUnitPriceCents())).toList());
    }
}
