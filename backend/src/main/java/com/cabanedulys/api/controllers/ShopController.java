package com.cabanedulys.api.controllers;

import com.cabanedulys.api.dto.CheckoutRequest;
import com.cabanedulys.api.dto.CheckoutResponse;
import com.cabanedulys.api.dto.DropDto;
import com.cabanedulys.api.dto.OrderStatusDto;
import com.cabanedulys.api.security.SessionPrincipal;
import com.cabanedulys.api.services.ShopService;
import com.stripe.exception.EventDataObjectDeserializationException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

/** La Réserve — boutique capsule (Drop éphémère). */
@RestController
@RequestMapping("/shop")
public class ShopController {

    private static final Logger log = LoggerFactory.getLogger(ShopController.class);

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
    public CheckoutResponse checkout(@Valid @RequestBody CheckoutRequest req,
                                     @AuthenticationPrincipal SessionPrincipal principal) {
        return service.checkout(req, principal.email());
    }

    /** Suivi minimal après retour de Stripe : identifiant et état seulement, aucune donnée personnelle. */
    @GetMapping("/orders/{id}/status")
    public OrderStatusDto orderStatus(@PathVariable UUID id) {
        return service.orderStatus(id);
    }

    /**
     * Webhook Stripe — à déclarer dans le dashboard Stripe pour les événements
     * checkout.session.completed, checkout.session.expired et checkout.session.async_payment_failed.
     * La signature garantit l'authenticité ; l'identifiant d'événement garantit l'idempotence.
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

        Optional<Session> session = extractSession(event);
        if (session.isEmpty()) {
            log.debug("Webhook Stripe sans session Checkout exploitable : {} ({})", event.getType(), event.getId());
            return ResponseEntity.ok().build();
        }

        Session s = session.get();
        try {
            service.handleStripeEvent(event.getId(), event.getType(), s.getId(), s.getAmountTotal(), s.getCurrency());
        } catch (DataIntegrityViolationException alreadyProcessed) {
            // Deux livraisons simultanées du même événement : l'autre a gagné, rien à refaire.
            log.info("Événement Stripe déjà traité en parallèle : {}", event.getId());
        }
        return ResponseEntity.ok().build();
    }

    private static Optional<Session> extractSession(Event event) {
        EventDataObjectDeserializer des = event.getDataObjectDeserializer();
        Optional<StripeObject> obj = des.getObject();
        if (obj.isEmpty()) {
            try {
                obj = Optional.ofNullable(des.deserializeUnsafe());
            } catch (EventDataObjectDeserializationException e) {
                log.warn("Désérialisation Stripe impossible pour {} : {}", event.getId(), e.getMessage());
                return Optional.empty();
            }
        }
        return obj.filter(o -> o instanceof Session).map(o -> (Session) o);
    }
}
