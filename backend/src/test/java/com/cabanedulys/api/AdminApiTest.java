package com.cabanedulys.api;

import com.cabanedulys.api.models.Role;
import com.cabanedulys.api.models.User;
import com.cabanedulys.api.repositories.AuditEventRepository;
import com.cabanedulys.api.repositories.UserRepository;
import com.cabanedulys.api.security.JwtService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Back office (phase 7) : protection par rôle, validation, publication d'épisodes,
 * programmation d'un drop, journal d'audit. Profil dev (H2).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class AdminApiTest {

    private static final String ORIGIN = "http://localhost:3000";
    private static final String COOKIE = "cdl_session";

    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired JwtService jwt;
    @Autowired ObjectMapper json;
    @Autowired AuditEventRepository auditEvents;

    private Cookie admin;
    private Cookie member;

    @BeforeEach
    void sessions() {
        admin = cookie("admin-" + System.nanoTime() + "@test.local", Role.ADMIN);
        member = cookie("member-" + System.nanoTime() + "@test.local", Role.MEMBER);
    }

    private Cookie cookie(String email, Role role) {
        users.save(User.builder().email(email).role(role).build());
        return new Cookie(COOKIE, jwt.generate(email, role.name()));
    }

    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder b, Cookie c) {
        return b.cookie(c).header("Origin", ORIGIN).contentType(MediaType.APPLICATION_JSON);
    }

    private JsonNode body(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString());
    }

    private String uniq(String base) {
        return base + "-" + System.nanoTime();
    }

    // ---------- accès ----------

    @Test
    @DisplayName("Un membre ne peut ni lire ni écrire dans le back office (403)")
    void member_isForbidden() throws Exception {
        mvc.perform(get("/admin/episodes").cookie(member)).andExpect(status().isForbidden());
        mvc.perform(as(post("/admin/guests"), member).content("{\"name\":\"X\"}")).andExpect(status().isForbidden());
        mvc.perform(get("/admin/audit").cookie(member)).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Sans session, le back office répond 401")
    void anonymous_isUnauthorized() throws Exception {
        mvc.perform(get("/admin/drops")).andExpect(status().isUnauthorized());
    }

    // ---------- validation ----------

    @Test
    @DisplayName("Un épisode sans titre est refusé avec la liste des violations (422)")
    void episode_withoutTitle_is422() throws Exception {
        mvc.perform(as(post("/admin/episodes"), admin).content("{\"title\":\"  \",\"number\":1}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.violations[0].field").value("title"));
    }

    // ---------- épisodes ----------

    @Test
    @DisplayName("Création, publication et dépublication d'un épisode : visible publiquement seulement une fois publié")
    void episode_lifecycle_isReflectedPublicly() throws Exception {
        String guestName = uniq("Invitée Test");
        JsonNode guest = body(mvc.perform(as(post("/admin/guests"), admin)
                        .content(json.writeValueAsString(java.util.Map.of("name", guestName, "company", "Atelier Test"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug").value(org.hamcrest.Matchers.startsWith("invitee-test-")))
                .andReturn());

        int number = (int) (System.nanoTime() % 1_000_000) + 1000;
        String title = uniq("Épisode de test — Éléonore & Cie");
        String episodeJson = json.writeValueAsString(java.util.Map.of(
                "title", title, "number", number,
                "shortDescription", "Une conversation de test.",
                "durationSec", 120,
                "guestIds", java.util.List.of(guest.get("id").asText()),
                "transcript", java.util.List.of(java.util.Map.of("t", 12, "text", "Deuxième"), java.util.Map.of("t", 0, "text", "Première"))));

        JsonNode ep = body(mvc.perform(as(post("/admin/episodes"), admin).content(episodeJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.slug").value(org.hamcrest.Matchers.startsWith("episode-de-test-eleonore-cie-")))
                .andExpect(jsonPath("$.transcript[0].t").value(0))
                .andReturn());
        String id = ep.get("id").asText();
        String slug = ep.get("slug").asText();

        mvc.perform(get("/episodes/" + slug)).andExpect(status().isNotFound());

        mvc.perform(as(post("/admin/episodes/" + id + "/publish"), admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.publishedAt").isNotEmpty());

        mvc.perform(get("/episodes/" + slug))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.guests[0].name").value(guestName));

        mvc.perform(as(post("/admin/episodes/" + id + "/unpublish"), admin)).andExpect(status().isOk());
        mvc.perform(get("/episodes/" + slug)).andExpect(status().isNotFound());

        assertThat(auditEvents.findAll()).anyMatch(e -> "episode.publish".equals(e.getAction()) && id.equals(e.getTargetId()));
        mvc.perform(get("/admin/audit").cookie(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].actorEmail").isNotEmpty());
    }

    @Test
    @DisplayName("Publier un épisode sans invité est refusé (409)")
    void publish_withoutGuest_is409() throws Exception {
        int number = (int) (System.nanoTime() % 1_000_000) + 2_000_000;
        JsonNode ep = body(mvc.perform(as(post("/admin/episodes"), admin)
                        .content(json.writeValueAsString(java.util.Map.of("title", uniq("Sans invité"), "number", number, "shortDescription", "x"))))
                .andExpect(status().isCreated()).andReturn());
        mvc.perform(as(post("/admin/episodes/" + ep.get("id").asText() + "/publish"), admin))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Deux épisodes ne peuvent pas partager un numéro (409)")
    void duplicateNumber_is409() throws Exception {
        int number = (int) (System.nanoTime() % 1_000_000) + 3_000_000;
        String a = json.writeValueAsString(java.util.Map.of("title", uniq("A"), "number", number));
        String b = json.writeValueAsString(java.util.Map.of("title", uniq("B"), "number", number));
        mvc.perform(as(post("/admin/episodes"), admin).content(a)).andExpect(status().isCreated());
        mvc.perform(as(post("/admin/episodes"), admin).content(b)).andExpect(status().isConflict());
    }

    // ---------- boutique ----------

    @Test
    @DisplayName("Un drop programmé depuis l'administration apparaît publiquement comme SCHEDULED, puis disparaît en brouillon")
    void drop_scheduling_isReflectedPublicly() throws Exception {
        JsonNode product = body(mvc.perform(as(post("/admin/products"), admin)
                        .content(json.writeValueAsString(java.util.Map.of(
                                "name", uniq("Carnet"), "priceCents", 9000, "currency", "cad", "stock", 5, "available", true))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.currency").value("CAD"))
                .andExpect(jsonPath("$.remaining").value(5))
                .andReturn());

        Instant opens = Instant.now().truncatedTo(ChronoUnit.SECONDS).plus(2, ChronoUnit.DAYS);
        Instant closes = opens.plus(3, ChronoUnit.DAYS);
        JsonNode drop = body(mvc.perform(as(post("/admin/drops"), admin)
                        .content(json.writeValueAsString(java.util.Map.of(
                                "title", uniq("Drop test"), "opensAt", opens.toString(), "closesAt", closes.toString(),
                                "maxPerCustomer", 2, "productIds", java.util.List.of(product.get("id").asText())))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.lifecycle").value("DRAFT"))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.products[0].name").value(product.get("name").asText()))
                .andReturn());
        String dropId = drop.get("id").asText();

        mvc.perform(as(put("/admin/drops/" + dropId + "/lifecycle"), admin).content("{\"lifecycle\":\"PUBLISHED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SCHEDULED"));

        mvc.perform(get("/shop/drop"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andExpect(jsonPath("$.opensAt").value(opens.toString()));

        mvc.perform(as(put("/admin/drops/" + dropId + "/lifecycle"), admin).content("{\"lifecycle\":\"DRAFT\"}"))
                .andExpect(status().isOk());
        mvc.perform(get("/shop/drop")).andExpect(jsonPath("$.status").value("NONE"));
    }

    @Test
    @DisplayName("Un drop sans pièce ni dates ne peut pas être publié (409)")
    void drop_withoutProducts_cannotBePublished() throws Exception {
        JsonNode drop = body(mvc.perform(as(post("/admin/drops"), admin)
                        .content(json.writeValueAsString(java.util.Map.of("title", uniq("Vide"), "maxPerCustomer", 1))))
                .andExpect(status().isCreated()).andReturn());
        mvc.perform(as(put("/admin/drops/" + drop.get("id").asText() + "/lifecycle"), admin).content("{\"lifecycle\":\"PUBLISHED\"}"))
                .andExpect(status().isConflict());
    }
}
