package com.cabanedulys.api.controllers;

import com.cabanedulys.api.dto.CheckoutRequest;
import com.cabanedulys.api.dto.CheckoutResponse;
import com.cabanedulys.api.dto.DropDto;
import com.cabanedulys.api.services.ShopService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** La Réserve — boutique capsule (Drop éphémère). */
@RestController
@RequestMapping("/shop")
public class ShopController {

    private final ShopService service;
    private final String webhookSecret;

    public ShopController(ShopService service,
                          @Value("${app.stripe.webhook-secret}") String webhookSecret) {
        this.service = service;
        this.webhookSecret = webhookSecret;
    }

    @GetMapping("/drop")
    public DropDto drop() { return service.currentDrop(); }

    /** Démarre un paiement (Stripe Checkout). Réservé aux membres authentifiés. */
    @PostMapping("/checkout")
    public CheckoutResponse checkout(@Valid @RequestBody CheckoutRequest req) {
        return service.checkout(req);
    }

    /**
     * Webhook Stripe — à déclarer dans le dashboard Stripe pour l'événement
     * checkout.session.completed.
     * La vérification de signature garantit l'authenticité de l'appel.
     */
    @PostMapping(value = "/webhook", consumes = "application/json")
    public ResponseEntity<Void> webhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        if ("checkout.session.completed".equals(event.getType())) {
            event.getDataObjectDeserializer()
                    .getObject()
                    .filter(obj -> obj instanceof Session)
                    .map(obj -> (Session) obj)
                    .ifPresent(session -> service.confirmOrder(session.getId()));
        }

        return ResponseEntity.ok().build();
    }
}
