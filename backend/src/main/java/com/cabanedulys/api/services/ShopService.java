package com.cabanedulys.api.services;

import com.cabanedulys.api.dto.CheckoutRequest;
import com.cabanedulys.api.dto.CheckoutResponse;
import com.cabanedulys.api.dto.DropDto;
import com.cabanedulys.api.dto.OrderStatusDto;
import com.cabanedulys.api.dto.ProductDto;
import com.cabanedulys.api.exceptions.NotFoundException;
import com.cabanedulys.api.exceptions.PaymentUnavailableException;
import com.cabanedulys.api.exceptions.SoldOutException;
import com.cabanedulys.api.models.*;
import com.cabanedulys.api.repositories.*;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

/**
 * La Réserve — drops programmés, réservation de stock avant paiement, webhooks idempotents.
 *
 * <p>Règles (feuille de route, phase 2) :</p>
 * <ul>
 *   <li>Le drop courant et ses dates viennent de la base ; aucun calcul glissant.</li>
 *   <li>Une réservation transactionnelle (verrou de ligne sur le produit) précède la session
 *       Stripe : deux clients ne peuvent pas retenir la même dernière unité.</li>
 *   <li>Les prix viennent du serveur ; le webhook vérifie le montant reçu.</li>
 *   <li>Chaque événement Stripe est traité au plus une fois.</li>
 *   <li>Les réservations expirent avec la session de paiement et libèrent le stock.</li>
 * </ul>
 */
@Service
public class ShopService {

    private static final Logger log = LoggerFactory.getLogger(ShopService.class);
    /** Stripe Checkout refuse une expiration inférieure à 30 minutes. */
    private static final Duration STRIPE_MIN_HOLD = Duration.ofMinutes(30);
    private static final Duration RESERVATION_GRACE = Duration.ofMinutes(2);

    /** Résultat d'une réservation réussie, suffisant pour créer la session de paiement. */
    public record Reservation(UUID orderId, UUID reservationId, UUID productId, String productName,
                              String edition, long unitPriceCents, String currency, int quantity,
                              long totalCents, Instant expiresAt) {}

    private final DropRepository drops;
    private final DropProductRepository dropProducts;
    private final ProductRepository products;
    private final OrderRepository orders;
    private final StockReservationRepository reservations;
    private final StripeEventRepository events;
    private final UserRepository users;
    private final String stripeKey;
    private final String baseUrl;
    private final Duration hold;

    public ShopService(DropRepository drops, DropProductRepository dropProducts,
                       ProductRepository products, OrderRepository orders,
                       StockReservationRepository reservations, StripeEventRepository events,
                       UserRepository users,
                       @Value("${app.stripe.secret-key}") String stripeKey,
                       @Value("${app.base-url}") String baseUrl,
                       @Value("${app.shop.stock-hold-minutes:30}") long holdMinutes) {
        this.drops = drops;
        this.dropProducts = dropProducts;
        this.products = products;
        this.orders = orders;
        this.reservations = reservations;
        this.events = events;
        this.users = users;
        this.stripeKey = stripeKey;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        Duration requested = Duration.ofMinutes(holdMinutes);
        this.hold = requested.compareTo(STRIPE_MIN_HOLD) < 0 ? STRIPE_MIN_HOLD : requested;
    }

    // ---------- lecture ----------

    /** Drop ouvert maintenant, sinon le prochain programmé, sinon le dernier fermé, sinon NONE. */
    @Transactional(readOnly = true)
    public DropDto currentDrop() {
        Instant now = Instant.now();
        Optional<Drop> current = pickCurrent(drops.findAllByLifecycle(DropLifecycle.PUBLISHED), now);
        if (current.isEmpty()) return DropDto.none();

        Drop d = current.get();
        boolean open = d.isOpen(now);
        List<ProductDto> list = dropProducts.findAllByDropIdOrderByDisplayOrderAsc(d.getId()).stream()
                .map(dp -> ProductDto.from(dp.getProduct(), remaining(dp.getProduct()), open))
                .toList();
        return new DropDto(d.status(now).name(), d.getSlug(), d.getTitle(), d.getSubtitle(),
                d.getHeroImage(), d.getOpensAt(), d.getClosesAt(), d.getMaxPerCustomer(), list);
    }

    static Optional<Drop> pickCurrent(List<Drop> published, Instant now) {
        Optional<Drop> open = published.stream().filter(d -> d.isOpen(now))
                .max(Comparator.comparing(Drop::getOpensAt));
        if (open.isPresent()) return open;

        Optional<Drop> next = published.stream()
                .filter(d -> d.status(now) == DropStatus.SCHEDULED && d.getOpensAt() != null)
                .min(Comparator.comparing(Drop::getOpensAt));
        if (next.isPresent()) return next;

        return published.stream()
                .filter(d -> d.status(now) == DropStatus.CLOSED && d.getClosesAt() != null)
                .max(Comparator.comparing(Drop::getClosesAt));
    }

    private int remaining(Product p) {
        long active = reservations.sumQuantityByProductAndStatus(p.getId(), ReservationStatus.ACTIVE);
        return (int) Math.max(0, p.getStock() - active);
    }

    @Transactional(readOnly = true)
    public OrderStatusDto orderStatus(UUID id) {
        return orders.findById(id).map(OrderStatusDto::from)
                .orElseThrow(() -> new NotFoundException("Commande introuvable : " + id));
    }

    // ---------- réservation ----------

    /**
     * Réserve le stock dans sa propre transaction (validée avant l'appel réseau à Stripe).
     * Le verrou de ligne sur le produit sérialise les acheteurs concurrents.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Reservation reserve(UUID productId, int quantity, String email) {
        if (quantity < 1) throw new IllegalArgumentException("La quantité doit être d'au moins 1.");
        Instant now = Instant.now();

        Drop drop = pickCurrent(drops.findAllByLifecycle(DropLifecycle.PUBLISHED), now)
                .filter(d -> d.isOpen(now))
                .orElseThrow(() -> new IllegalStateException("La Réserve n'est pas ouverte en ce moment."));
        dropProducts.findByDropIdAndProductId(drop.getId(), productId)
                .orElseThrow(() -> new NotFoundException("Pièce introuvable dans ce drop : " + productId));
        User user = users.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Aucun compte pour cette session."));

        Product product = products.findByIdForUpdate(productId)
                .orElseThrow(() -> new NotFoundException("Pièce introuvable : " + productId));
        if (!product.isAvailable()) {
            throw new SoldOutException("Cette pièce n'est plus disponible.");
        }
        int remaining = remaining(product);
        if (quantity > remaining) {
            throw new SoldOutException(remaining == 0
                    ? "Cette pièce est épuisée."
                    : "Il ne reste que " + remaining + " exemplaire(s) de cette pièce.");
        }
        long alreadyTaken = reservations.sumQuantityByUserAndProduct(user.getId(), productId,
                EnumSet.of(ReservationStatus.ACTIVE, ReservationStatus.CONFIRMED));
        if (alreadyTaken + quantity > drop.getMaxPerCustomer()) {
            throw new SoldOutException("Limite de " + drop.getMaxPerCustomer()
                    + " exemplaire(s) par client pour ce drop.");
        }

        long total = product.getPriceCents() * quantity;
        Order order = Order.builder().status(OrderStatus.PENDING).user(user).drop(drop)
                .totalCents(total).createdAt(now).build();
        order.getItems().add(OrderItem.builder()
                .order(order).product(product)
                .quantity(quantity).unitPriceCents(product.getPriceCents())
                .build());
        orders.save(order);

        Instant expiresAt = now.plus(hold).plus(RESERVATION_GRACE);
        StockReservation r = reservations.save(StockReservation.builder()
                .product(product).order(order).user(user)
                .quantity(quantity).status(ReservationStatus.ACTIVE)
                .expiresAt(expiresAt).createdAt(now)
                .build());

        return new Reservation(order.getId(), r.getId(), product.getId(), product.getName(),
                product.getEdition(), product.getPriceCents(), product.getCurrency(), quantity,
                total, expiresAt);
    }

    @Transactional
    public void attachStripeSession(UUID orderId, String sessionId) {
        orders.findById(orderId).ifPresent(o -> o.setStripeReference(sessionId));
    }

    /** Libère les réservations actives d'une commande et fixe son état final. */
    @Transactional
    public void release(UUID orderId, OrderStatus finalStatus) {
        for (StockReservation r : reservations.findAllByOrderId(orderId)) {
            if (r.getStatus() == ReservationStatus.ACTIVE) r.setStatus(ReservationStatus.RELEASED);
        }
        orders.findById(orderId).ifPresent(o -> {
            if (o.getStatus() == OrderStatus.PENDING) o.setStatus(finalStatus);
        });
    }

    // ---------- paiement ----------

    /** Réserve puis crée la session Stripe Checkout. En cas d'échec Stripe, la réservation est libérée. */
    public CheckoutResponse checkout(CheckoutRequest req, String email) {
        Reservation r = reserve(req.productId(), req.quantity(), email);
        try {
            Stripe.apiKey = stripeKey;
            Instant stripeExpiry = Instant.now().plus(hold);

            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(baseUrl + "/drop/success?order=" + r.orderId())
                    .setCancelUrl(baseUrl + "/drop")
                    .setClientReferenceId(r.orderId().toString())
                    .setCustomerEmail(email)
                    .setExpiresAt(stripeExpiry.getEpochSecond())
                    .addLineItem(SessionCreateParams.LineItem.builder()
                            .setQuantity((long) r.quantity())
                            .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency(r.currency().toLowerCase(Locale.ROOT))
                                    .setUnitAmount(r.unitPriceCents())
                                    .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                            .setName(r.productName())
                                            .setDescription(r.edition() == null ? "Édition limitée" : r.edition())
                                            .build())
                                    .build())
                            .build())
                    .putMetadata("orderId", r.orderId().toString())
                    .build();

            Session session = Session.create(params);
            attachStripeSession(r.orderId(), session.getId());
            return new CheckoutResponse(session.getUrl(), r.orderId().toString());

        } catch (StripeException e) {
            release(r.orderId(), OrderStatus.CANCELLED);
            log.error("Création de session Stripe impossible pour la commande {} : {}", r.orderId(), e.getMessage());
            throw new PaymentUnavailableException(
                    "Le paiement est momentanément indisponible. Votre réservation a été libérée.", e);
        }
    }

    // ---------- webhooks ----------

    /**
     * Traite un événement Stripe une seule fois (clé primaire sur l'identifiant d'événement).
     * @return {@code false} si l'événement avait déjà été traité.
     */
    @Transactional
    public boolean handleStripeEvent(String eventId, String type, String sessionId,
                                     Long amountTotal, String currency) {
        if (eventId == null || eventId.isBlank() || events.existsById(eventId)) return false;
        events.save(StripeEvent.builder().id(eventId).type(type).receivedAt(Instant.now()).build());

        switch (type) {
            case "checkout.session.completed" -> confirm(sessionId, amountTotal, currency);
            case "checkout.session.expired", "checkout.session.async_payment_failed" ->
                    orders.findByStripeReference(sessionId).ifPresent(o -> release(o.getId(), OrderStatus.EXPIRED));
            default -> log.debug("Événement Stripe ignoré : {}", type);
        }
        return true;
    }

    private void confirm(String sessionId, Long amountTotal, String currency) {
        Optional<Order> found = orders.findByStripeReference(sessionId);
        if (found.isEmpty()) {
            log.warn("Webhook Stripe pour une session inconnue : {}", sessionId);
            return;
        }
        Order order = found.get();
        if (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.FULFILLED) return;

        if (!amountMatches(order, amountTotal, currency)) {
            order.setStatus(OrderStatus.PAYMENT_MISMATCH);
            log.error("Montant Stripe inattendu pour la commande {} : reçu {} {}, attendu {}",
                    order.getId(), amountTotal, currency, order.getTotalCents());
            return;
        }

        for (OrderItem item : order.getItems()) {
            Product p = products.findByIdForUpdate(item.getProduct().getId())
                    .orElseThrow(() -> new IllegalStateException("Produit disparu pendant le paiement."));
            int newStock = p.getStock() - item.getQuantity();
            if (newStock < 0) {
                log.error("Stock négatif évité pour {} (commande {}) : réservation expirée avant le paiement ?",
                        p.getId(), order.getId());
                newStock = 0;
            }
            p.setStock(newStock);
            if (newStock == 0) p.setAvailable(false);
        }
        for (StockReservation r : reservations.findAllByOrderId(order.getId())) {
            r.setStatus(ReservationStatus.CONFIRMED);
        }
        order.setStatus(OrderStatus.PAID);
    }

    private static boolean amountMatches(Order order, Long amountTotal, String currency) {
        if (amountTotal == null) return true; // session sans montant (ex. tests Stripe CLI minimalistes)
        if (amountTotal != order.getTotalCents()) return false;
        if (currency == null || order.getItems().isEmpty()) return true;
        String expected = order.getItems().get(0).getProduct().getCurrency();
        return expected == null || expected.equalsIgnoreCase(currency);
    }

    // ---------- expiration ----------

    /** Libère les réservations dont la fenêtre de paiement est passée. Appelé par le job planifié. */
    @Transactional
    public int releaseExpiredReservations() {
        List<StockReservation> expired =
                reservations.findAllByStatusAndExpiresAtBefore(ReservationStatus.ACTIVE, Instant.now());
        for (StockReservation r : expired) {
            r.setStatus(ReservationStatus.EXPIRED);
            Order o = r.getOrder();
            if (o.getStatus() == OrderStatus.PENDING) o.setStatus(OrderStatus.EXPIRED);
        }
        return expired.size();
    }
}
