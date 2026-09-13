package com.cabanedulys.api;

import com.cabanedulys.api.models.*;
import com.cabanedulys.api.repositories.*;
import com.cabanedulys.api.services.ShopService;
import com.stripe.Stripe;
import com.stripe.net.Webhook;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Le webhook Stripe : signature obligatoire, puis traitement idempotent de bout en bout. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class ShopWebhookControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ShopService shop;
    @Autowired DropRepository drops;
    @Autowired DropProductRepository dropProducts;
    @Autowired ProductRepository products;
    @Autowired OrderRepository orders;
    @Autowired UserRepository users;
    @Autowired StripeEventRepository events;
    @Value("${app.stripe.webhook-secret}") String webhookSecret;

    private static String sign(String secret, String payload) throws Exception {
        long ts = Instant.now().getEpochSecond();
        String sig = Webhook.Util.computeHmacSha256(secret, ts + "." + payload);
        return "t=" + ts + ",v1=" + sig;
    }

    private static String completedPayload(String eventId, String sessionId, long amount) {
        return "{\"id\":\"" + eventId + "\",\"object\":\"event\",\"api_version\":\"" + Stripe.API_VERSION + "\","
                + "\"created\":" + Instant.now().getEpochSecond() + ",\"livemode\":false,\"pending_webhooks\":1,"
                + "\"type\":\"checkout.session.completed\","
                + "\"data\":{\"object\":{\"id\":\"" + sessionId + "\",\"object\":\"checkout.session\","
                + "\"amount_total\":" + amount + ",\"currency\":\"cad\",\"payment_status\":\"paid\"}}}";
    }

    @Test
    @DisplayName("Une signature invalide est refusée (400) et rien n'est traité")
    void invalidSignature_is400() throws Exception {
        long before = events.count();
        mvc.perform(post("/shop/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Stripe-Signature", "t=1,v1=deadbeef")
                        .content(completedPayload("evt_bad_sig", "cs_none", 100)))
                .andExpect(status().isBadRequest());
        assertThat(events.count()).isEqualTo(before);
    }

    @Test
    @DisplayName("Un événement signé confirme la commande ; sa seconde livraison est ignorée")
    void signedEvent_confirmsOnce() throws Exception {
        Product p = products.save(Product.builder()
                .name("Hoodie webhook").priceCents(18500).currency("CAD").stock(3).available(true).build());
        Drop d = drops.save(Drop.builder()
                .slug("drop-webhook-" + System.nanoTime()).title("Drop webhook")
                .lifecycle(DropLifecycle.PUBLISHED)
                .opensAt(Instant.now().minus(Duration.ofMinutes(1)))
                .closesAt(Instant.now().plus(Duration.ofHours(1)))
                .maxPerCustomer(1).build());
        dropProducts.save(DropProduct.builder().drop(d).product(p).build());
        String email = "webhook-" + System.nanoTime() + "@test.local";
        users.save(User.builder().email(email).role(Role.MEMBER).build());

        ShopService.Reservation r = shop.reserve(p.getId(), 1, email);
        String sessionId = "cs_wh_" + System.nanoTime();
        shop.attachStripeSession(r.orderId(), sessionId);

        String eventId = "evt_wh_" + System.nanoTime();
        String payload = completedPayload(eventId, sessionId, 18500);

        for (int i = 0; i < 2; i++) {
            mvc.perform(post("/shop/webhook")
                            .contentType(MediaType.APPLICATION_JSON)
                            .header("Stripe-Signature", sign(webhookSecret, payload))
                            .content(payload))
                    .andExpect(status().isOk());
        }

        assertThat(orders.findById(r.orderId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.PAID);
        assertThat(products.findById(p.getId()).orElseThrow().getStock()).isEqualTo(2);
        assertThat(events.existsById(eventId)).isTrue();
    }
}
