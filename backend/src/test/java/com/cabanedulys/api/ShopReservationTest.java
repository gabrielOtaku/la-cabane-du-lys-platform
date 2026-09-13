package com.cabanedulys.api;

import com.cabanedulys.api.exceptions.SoldOutException;
import com.cabanedulys.api.models.*;
import com.cabanedulys.api.repositories.*;
import com.cabanedulys.api.services.ShopService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Règles de La Réserve (phase 2) : réservation transactionnelle avec verrou de ligne,
 * limite par client, expiration, webhooks idempotents et vérification du montant.
 */
@SpringBootTest
@ActiveProfiles("dev")
class ShopReservationTest {

    @Autowired ShopService shop;
    @Autowired DropRepository drops;
    @Autowired DropProductRepository dropProducts;
    @Autowired ProductRepository products;
    @Autowired OrderRepository orders;
    @Autowired StockReservationRepository reservations;
    @Autowired StripeEventRepository events;
    @Autowired UserRepository users;

    private UUID productId;
    private String buyer1;
    private String buyer2;

    @BeforeEach
    void seed() {
        reservations.deleteAll();
        events.deleteAll();
        orders.deleteAll();
        dropProducts.deleteAll();
        drops.deleteAll();
        products.deleteAll();

        Product p = products.save(Product.builder()
                .name("Carnet test").tagline("t").priceCents(9000).currency("CAD")
                .edition("Édition test").stock(1).available(true).build());
        productId = p.getId();

        Drop d = drops.save(Drop.builder()
                .slug("drop-test-" + System.nanoTime()).title("Drop test")
                .lifecycle(DropLifecycle.PUBLISHED)
                .opensAt(Instant.now().minus(Duration.ofMinutes(5)))
                .closesAt(Instant.now().plus(Duration.ofHours(1)))
                .maxPerCustomer(2).build());
        dropProducts.save(DropProduct.builder().drop(d).product(p).displayOrder(0).build());

        buyer1 = user("buyer1");
        buyer2 = user("buyer2");
    }

    private String user(String prefix) {
        String email = prefix + "-" + System.nanoTime() + "@test.local";
        users.save(User.builder().email(email).role(Role.MEMBER).build());
        return email;
    }

    private void restock(int stock) {
        Product p = products.findById(productId).orElseThrow();
        p.setStock(stock);
        p.setAvailable(true);
        products.save(p);
    }

    // ---------- concurrence ----------

    @Test
    @DisplayName("Deux acheteurs simultanés sur la dernière unité : un seul obtient la réservation")
    void twoBuyers_lastUnit_onlyOneWins() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Object>> futures = new ArrayList<>();
        for (String email : List.of(buyer1, buyer2)) {
            futures.add(pool.submit(() -> {
                start.await();
                try {
                    return shop.reserve(productId, 1, email);
                } catch (SoldOutException e) {
                    return e;
                }
            }));
        }
        start.countDown();
        List<Object> outcomes = new ArrayList<>();
        for (Future<Object> f : futures) outcomes.add(f.get(20, TimeUnit.SECONDS));
        pool.shutdownNow();

        long wins = outcomes.stream().filter(o -> o instanceof ShopService.Reservation).count();
        long losses = outcomes.stream().filter(o -> o instanceof SoldOutException).count();
        assertThat(wins).isEqualTo(1);
        assertThat(losses).isEqualTo(1);
        assertThat(reservations.sumQuantityByProductAndStatus(productId, ReservationStatus.ACTIVE)).isEqualTo(1);
        assertThat(shop.currentDrop().products().get(0).remaining()).isZero();
        assertThat(shop.currentDrop().products().get(0).available()).isFalse();
    }

    // ---------- règles simples ----------

    @Test
    @DisplayName("La limite par client est appliquée sur l'ensemble des réservations actives et payées")
    void maxPerCustomer_isEnforced() {
        restock(10);
        shop.reserve(productId, 2, buyer1);
        assertThatThrownBy(() -> shop.reserve(productId, 1, buyer1))
                .isInstanceOf(SoldOutException.class)
                .hasMessageContaining("Limite de 2");
        // Un autre client n'est pas concerné par cette limite.
        assertThat(shop.reserve(productId, 1, buyer2)).isNotNull();
    }

    @Test
    @DisplayName("Aucune réservation possible en dehors de la fenêtre d'ouverture")
    void closedDrop_refusesReservation() {
        Drop d = drops.findAll().get(0);
        d.setOpensAt(Instant.now().plus(Duration.ofDays(1)));
        d.setClosesAt(Instant.now().plus(Duration.ofDays(2)));
        drops.save(d);

        assertThat(shop.currentDrop().status()).isEqualTo("SCHEDULED");
        assertThatThrownBy(() -> shop.reserve(productId, 1, buyer1))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("Un drop en brouillon n'est jamais exposé : le public voit NONE")
    void draftDrop_isInvisible() {
        Drop d = drops.findAll().get(0);
        d.setLifecycle(DropLifecycle.DRAFT);
        drops.save(d);
        assertThat(shop.currentDrop().status()).isEqualTo("NONE");
        assertThat(shop.currentDrop().products()).isEmpty();
    }

    // ---------- expiration ----------

    @Test
    @DisplayName("Une réservation abandonnée rend le stock disponible après expiration")
    void expiredReservation_freesStock() {
        ShopService.Reservation r = shop.reserve(productId, 1, buyer1);
        assertThatThrownBy(() -> shop.reserve(productId, 1, buyer2)).isInstanceOf(SoldOutException.class);

        StockReservation sr = reservations.findById(r.reservationId()).orElseThrow();
        sr.setExpiresAt(Instant.now().minusSeconds(1));
        reservations.save(sr);

        assertThat(shop.releaseExpiredReservations()).isEqualTo(1);
        assertThat(orders.findById(r.orderId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.EXPIRED);
        assertThat(shop.reserve(productId, 1, buyer2)).isNotNull();
    }

    @Test
    @DisplayName("L'événement Stripe « session expirée » libère la réservation immédiatement")
    void stripeExpiredEvent_releasesReservation() {
        ShopService.Reservation r = shop.reserve(productId, 1, buyer1);
        shop.attachStripeSession(r.orderId(), "cs_expired_1");

        assertThat(shop.handleStripeEvent("evt_exp_1", "checkout.session.expired", "cs_expired_1", null, null)).isTrue();

        assertThat(orders.findById(r.orderId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.EXPIRED);
        assertThat(reservations.findById(r.reservationId()).orElseThrow().getStatus()).isEqualTo(ReservationStatus.RELEASED);
        assertThat(shop.currentDrop().products().get(0).remaining()).isEqualTo(1);
    }

    // ---------- webhooks ----------

    @Test
    @DisplayName("Un webhook reçu deux fois ne confirme qu'une seule fois et ne décrémente le stock qu'une fois")
    void duplicateWebhook_isIdempotent() {
        restock(2);
        ShopService.Reservation r = shop.reserve(productId, 1, buyer1);
        shop.attachStripeSession(r.orderId(), "cs_paid_1");

        assertThat(shop.handleStripeEvent("evt_paid_1", "checkout.session.completed", "cs_paid_1", 9000L, "cad")).isTrue();
        assertThat(shop.handleStripeEvent("evt_paid_1", "checkout.session.completed", "cs_paid_1", 9000L, "cad")).isFalse();

        Order o = orders.findById(r.orderId()).orElseThrow();
        assertThat(o.getStatus()).isEqualTo(OrderStatus.PAID);
        assertThat(products.findById(productId).orElseThrow().getStock()).isEqualTo(1);
        assertThat(reservations.findById(r.reservationId()).orElseThrow().getStatus()).isEqualTo(ReservationStatus.CONFIRMED);
        assertThat(events.count()).isEqualTo(1);
        assertThat(shop.currentDrop().products().get(0).remaining()).isEqualTo(1);
    }

    @Test
    @DisplayName("Le dernier exemplaire payé rend la pièce indisponible")
    void lastUnitPaid_marksProductUnavailable() {
        ShopService.Reservation r = shop.reserve(productId, 1, buyer1);
        shop.attachStripeSession(r.orderId(), "cs_paid_last");
        shop.handleStripeEvent("evt_paid_last", "checkout.session.completed", "cs_paid_last", 9000L, "cad");

        Product p = products.findById(productId).orElseThrow();
        assertThat(p.getStock()).isZero();
        assertThat(p.isAvailable()).isFalse();
    }

    @Test
    @DisplayName("Un montant reçu différent du montant serveur marque la commande à vérifier, sans toucher au stock")
    void amountMismatch_flagsOrder() {
        ShopService.Reservation r = shop.reserve(productId, 1, buyer1);
        shop.attachStripeSession(r.orderId(), "cs_mismatch");
        shop.handleStripeEvent("evt_mismatch", "checkout.session.completed", "cs_mismatch", 100L, "cad");

        assertThat(orders.findById(r.orderId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.PAYMENT_MISMATCH);
        assertThat(products.findById(productId).orElseThrow().getStock()).isEqualTo(1);
    }
}
