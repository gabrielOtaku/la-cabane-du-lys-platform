package com.cabanedulys.api.services;

import com.cabanedulys.api.dto.*;
import com.cabanedulys.api.exceptions.NotFoundException;
import com.cabanedulys.api.models.*;
import com.cabanedulys.api.repositories.OrderRepository;
import com.cabanedulys.api.repositories.ProductRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Logique de la boutique capsule (« La Réserve ») + paiement Stripe. */
@Service
public class ShopService {

    private final ProductRepository products;
    private final OrderRepository orders;
    private final String stripeKey;
    private final String baseUrl;

    public ShopService(ProductRepository products, OrderRepository orders,
                       @Value("${app.stripe.secret-key}") String stripeKey,
                       @Value("${app.base-url}") String baseUrl) {
        this.products = products;
        this.orders = orders;
        this.stripeKey = stripeKey;
        this.baseUrl = baseUrl;
    }

    public DropDto currentDrop() {
        // TODO: piloter la date d'ouverture via une entité « Drop » dédiée.
        Instant opensAt = Instant.now().plus(18, ChronoUnit.DAYS);
        List<ProductDto> list = products.findAll().stream().map(ProductDto::from).toList();
        boolean open = !products.findByAvailableTrue().isEmpty();
        return new DropDto(opensAt, open, list);
    }

    @Transactional
    public CheckoutResponse checkout(CheckoutRequest req) {
        Product product = products.findById(req.productId())
                .orElseThrow(() -> new NotFoundException("Pièce introuvable : " + req.productId()));
        if (!product.isAvailable() || product.getStock() < req.quantity()) {
            throw new IllegalStateException("Pièce indisponible ou stock insuffisant.");
        }

        long total = product.getPriceCents() * req.quantity();

        Order order = Order.builder().status(OrderStatus.PENDING).totalCents(total).build();
        OrderItem item = OrderItem.builder()
                .order(order).product(product)
                .quantity(req.quantity()).unitPriceCents(product.getPriceCents())
                .build();
        order.getItems().add(item);
        orders.save(order);

        try {
            Stripe.apiKey = stripeKey;

            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(baseUrl + "/drop/success?order=" + order.getId())
                    .setCancelUrl(baseUrl + "/drop")
                    .addLineItem(SessionCreateParams.LineItem.builder()
                            .setQuantity((long) req.quantity())
                            .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency(product.getCurrency().toLowerCase())
                                    .setUnitAmount(product.getPriceCents())
                                    .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                            .setName(product.getName())
                                            .setDescription(product.getEdition())
                                            .build())
                                    .build())
                            .build())
                    .putMetadata("orderId", order.getId().toString())
                    .build();

            Session session = Session.create(params);
            order.setStripeReference(session.getId());
            return new CheckoutResponse(session.getUrl(), order.getId().toString());

        } catch (StripeException e) {
            throw new IllegalStateException("Erreur paiement Stripe : " + e.getMessage(), e);
        }
    }

    /** Appelé depuis le webhook Stripe lors de checkout.session.completed. */
    @Transactional
    public void confirmOrder(String sessionId) {
        orders.findByStripeReference(sessionId).ifPresent(order -> {
            order.setStatus(OrderStatus.PAID);
            // Décrémenter le stock
            order.getItems().forEach(i -> {
                Product p = i.getProduct();
                int newStock = p.getStock() - i.getQuantity();
                p.setStock(newStock);
                if (newStock <= 0) p.setAvailable(false);
            });
        });
    }

    public Optional<Order> findOrder(UUID id) {
        return orders.findById(id);
    }
}
