package com.cabanedulys.api;

import com.cabanedulys.api.models.MagicLinkToken;
import com.cabanedulys.api.models.Role;
import com.cabanedulys.api.models.User;
import com.cabanedulys.api.repositories.MagicLinkTokenRepository;
import com.cabanedulys.api.repositories.UserRepository;
import com.cabanedulys.api.security.JwtService;
import com.cabanedulys.api.support.CapturingMailConfig;
import com.cabanedulys.api.support.CapturingMailConfig.CapturingMailService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.util.Comparator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Flux d'identité de la phase 1 : lien magique à usage unique, cookie HttpOnly, rôles,
 * révocation et protection CSRF par origine. Profil dev (H2, sans Redis : fail-open documenté).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Import(CapturingMailConfig.class)
class AuthFlowTest {

    private static final String ORIGIN = "http://localhost:3000";
    private static final String COOKIE = "cdl_session";

    @Autowired MockMvc mvc;
    @Autowired CapturingMailService mail;
    @Autowired UserRepository users;
    @Autowired MagicLinkTokenRepository tokens;
    @Autowired JwtService jwt;

    @BeforeEach
    void reset() {
        mail.clear();
    }

    // ---------- helpers ----------

    private String requestLink(String email) throws Exception {
        mvc.perform(post("/auth/magic-link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.message").exists());
        return mail.lastToken();
    }

    private MvcResult verify(String token) throws Exception {
        return mvc.perform(post("/auth/magic-link/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + token + "\"}"))
                .andReturn();
    }

    private Cookie sessionCookieFor(String email, Role role) {
        users.findByEmail(email).orElseGet(() ->
                users.save(User.builder().email(email).role(role).build()));
        return new Cookie(COOKIE, jwt.generate(email, role.name()));
    }

    // ---------- lien magique ----------

    @Test
    @DisplayName("La demande de lien répond 202 pour une adresse inconnue comme pour une adresse connue")
    void magicLinkRequest_sameAnswerForAnyEmail() throws Exception {
        requestLink("inconnue-" + System.nanoTime() + "@test.local");
        String known = "connue-" + System.nanoTime() + "@test.local";
        users.save(User.builder().email(known).role(Role.MEMBER).build());
        requestLink(known);
        assertThat(mail.sent).hasSize(2);
        assertThat(mail.last().body()).contains("/login/callback?token=");
    }

    @Test
    @DisplayName("Le callback ouvre une session dans un cookie HttpOnly et /auth/me la renvoie")
    void magicLinkVerify_opensHttpOnlySession() throws Exception {
        String email = "membre-" + System.nanoTime() + "@test.local";
        String token = requestLink(email);

        MvcResult result = verify(token);
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        String setCookie = result.getResponse().getHeader("Set-Cookie");
        assertThat(setCookie).contains(COOKIE + "=").contains("HttpOnly").contains("SameSite=Lax").contains("Path=/api");
        Cookie session = result.getResponse().getCookie(COOKIE);
        assertThat(session).isNotNull();
        assertThat(result.getResponse().getContentAsString()).doesNotContain("\"token\"");

        mvc.perform(get("/auth/me").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.role").value("MEMBER"));

        assertThat(users.findByEmail(email)).isPresent();
    }

    @Test
    @DisplayName("Un lien déjà utilisé est refusé (401)")
    void magicLink_cannotBeReused() throws Exception {
        String token = requestLink("reuse-" + System.nanoTime() + "@test.local");
        assertThat(verify(token).getResponse().getStatus()).isEqualTo(200);

        MvcResult second = verify(token);
        assertThat(second.getResponse().getStatus()).isEqualTo(401);
        assertThat(second.getResponse().getContentAsString()).contains("magic-link-invalid");
    }

    @Test
    @DisplayName("Un lien expiré est refusé (401)")
    void magicLink_expiredIsRejected() throws Exception {
        String email = "expire-" + System.nanoTime() + "@test.local";
        String token = requestLink(email);

        MagicLinkToken t = tokens.findAll().stream()
                .filter(x -> x.getEmail().equals(email))
                .max(Comparator.comparing(MagicLinkToken::getCreatedAt))
                .orElseThrow();
        t.setExpiresAt(Instant.now().minusSeconds(60));
        tokens.save(t);

        assertThat(verify(token).getResponse().getStatus()).isEqualTo(401);
    }

    @Test
    @DisplayName("Un jeton inconnu est refusé (401)")
    void magicLink_unknownIsRejected() throws Exception {
        assertThat(verify("pas-un-vrai-jeton").getResponse().getStatus()).isEqualTo(401);
    }

    // ---------- session, rôles ----------

    @Test
    @DisplayName("/auth/me sans session répond 401 en JSON RFC 7807")
    void me_withoutSession_is401() throws Exception {
        mvc.perform(get("/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Un membre ne peut pas appeler une route administrateur (403)")
    void admin_withMemberSession_is403() throws Exception {
        Cookie member = sessionCookieFor("member-" + System.nanoTime() + "@test.local", Role.MEMBER);
        mvc.perform(get("/admin/overview").cookie(member))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("Un administrateur accède au tableau de bord (200)")
    void admin_withAdminSession_is200() throws Exception {
        Cookie admin = sessionCookieFor("admin-" + System.nanoTime() + "@test.local", Role.ADMIN);
        mvc.perform(get("/admin/overview").cookie(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.members").isNumber())
                .andExpect(jsonPath("$.episodesDraft").isNumber());
    }

    @Test
    @DisplayName("Un jeton portant un rôle inconnu ne donne aucune authentification (401)")
    void session_withUnknownRole_isIgnored() throws Exception {
        Cookie bogus = new Cookie(COOKIE, jwt.generate("bogus@test.local", "SUPERUSER"));
        mvc.perform(get("/auth/me").cookie(bogus))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Un jeton dont la charge utile a été altérée ne donne aucune authentification (401)")
    void session_withTamperedToken_isIgnored() throws Exception {
        // En-tête et charge utile d'un jeton MEMBER, signature d'un autre jeton : la signature ne correspond plus.
        String[] member = jwt.generate("x@test.local", "MEMBER").split("\\.");
        String[] admin  = jwt.generate("x@test.local", "ADMIN").split("\\.");
        String forged = admin[0] + "." + admin[1] + "." + member[2];
        Cookie tampered = new Cookie(COOKIE, forged);
        mvc.perform(get("/auth/me").cookie(tampered))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("L'enregistrement d'une passkey exige une session (401)")
    void webauthnRegister_requiresSession() throws Exception {
        mvc.perform(post("/auth/webauthn/register/options").header("Origin", ORIGIN))
                .andExpect(status().isUnauthorized());
    }

    // ---------- CSRF : origine des requêtes non sûres authentifiées par cookie ----------

    @Test
    @DisplayName("Requête POST par cookie sans en-tête Origin : refusée (403 csrf-origin)")
    void cookiePost_withoutOrigin_is403() throws Exception {
        Cookie member = sessionCookieFor("csrf1-" + System.nanoTime() + "@test.local", Role.MEMBER);
        mvc.perform(post("/auth/logout").cookie(member))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.type").value("https://cabanedulys.ca/errors/csrf-origin"));
    }

    @Test
    @DisplayName("Requête POST par cookie depuis une origine étrangère : refusée (403)")
    void cookiePost_withForeignOrigin_is403() throws Exception {
        Cookie member = sessionCookieFor("csrf2-" + System.nanoTime() + "@test.local", Role.MEMBER);
        mvc.perform(post("/auth/logout").cookie(member).header("Origin", "https://evil.example"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Requête POST par cookie depuis l'origine du site : acceptée, et le cookie est effacé")
    void cookiePost_withAllowedOrigin_logsOutAndClearsCookie() throws Exception {
        Cookie member = sessionCookieFor("csrf3-" + System.nanoTime() + "@test.local", Role.MEMBER);
        MvcResult result = mvc.perform(post("/auth/logout").cookie(member).header("Origin", ORIGIN))
                .andExpect(status().isNoContent())
                .andReturn();
        assertThat(result.getResponse().getHeader("Set-Cookie")).contains(COOKIE + "=").contains("Max-Age=0");
    }

    @Test
    @DisplayName("Requête POST par en-tête Bearer (client non-navigateur) : pas de contrôle d'origine")
    void bearerPost_withoutOrigin_isAccepted() throws Exception {
        String email = "bearer-" + System.nanoTime() + "@test.local";
        users.save(User.builder().email(email).role(Role.MEMBER).build());
        mvc.perform(post("/auth/logout").header("Authorization", "Bearer " + jwt.generate(email, "MEMBER")))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Les lectures GET par cookie ne demandent pas d'en-tête Origin")
    void cookieGet_withoutOrigin_isAccepted() throws Exception {
        Cookie member = sessionCookieFor("get-" + System.nanoTime() + "@test.local", Role.MEMBER);
        mvc.perform(get("/auth/me").cookie(member)).andExpect(status().isOk());
    }
}
