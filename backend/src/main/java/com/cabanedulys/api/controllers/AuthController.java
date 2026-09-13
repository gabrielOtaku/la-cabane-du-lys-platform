package com.cabanedulys.api.controllers;

import com.cabanedulys.api.dto.EmailRequest;
import com.cabanedulys.api.dto.MagicLinkVerifyRequest;
import com.cabanedulys.api.dto.SessionDto;
import com.cabanedulys.api.dto.WebAuthnVerifyRequest;
import com.cabanedulys.api.models.User;
import com.cabanedulys.api.security.SessionPrincipal;
import com.cabanedulys.api.services.AuthService;
import com.cabanedulys.api.services.MagicLinkService;
import com.cabanedulys.api.services.SessionService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Authentification sans mot de passe.
 *
 * <p>Chemin principal : lien magique à usage unique. Chemin complémentaire : passkey (WebAuthn),
 * enregistrable uniquement depuis une session ouverte. La session est un cookie HttpOnly posé
 * par ce contrôleur ; aucun jeton ne transite dans le corps des réponses.</p>
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService auth;
    private final MagicLinkService magicLinks;
    private final SessionService sessions;

    public AuthController(AuthService auth, MagicLinkService magicLinks, SessionService sessions) {
        this.auth = auth;
        this.magicLinks = magicLinks;
        this.sessions = sessions;
    }

    // ---------- lien magique ----------

    /** Réponse identique que l'adresse soit connue ou non (anti-énumération). */
    @PostMapping("/magic-link")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, String> requestMagicLink(@Valid @RequestBody EmailRequest req) {
        magicLinks.request(req.email());
        return Map.of("message",
                "Si cette adresse est valide, un lien de connexion vient de lui être envoyé.");
    }

    @PostMapping("/magic-link/verify")
    public SessionDto verifyMagicLink(@Valid @RequestBody MagicLinkVerifyRequest req,
                                      HttpServletResponse response) {
        User user = magicLinks.verify(req.token());
        return open(user, response);
    }

    // ---------- session ----------

    @GetMapping("/me")
    public SessionDto me(@AuthenticationPrincipal SessionPrincipal principal) {
        return SessionDto.from(principal);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@AuthenticationPrincipal SessionPrincipal principal, HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, sessions.close(principal).toString());
    }

    // ---------- passkeys ----------

    @PostMapping("/webauthn/register/options")
    public Map<String, Object> registerOptions(@AuthenticationPrincipal SessionPrincipal principal) {
        return auth.registrationOptions(principal.email());
    }

    @PostMapping("/webauthn/register/verify")
    public SessionDto registerVerify(@AuthenticationPrincipal SessionPrincipal principal,
                                     @Valid @RequestBody WebAuthnVerifyRequest req) {
        User user = auth.verifyRegistration(principal.email(), req);
        return SessionDto.from(user);
    }

    @PostMapping("/webauthn/login/options")
    public Map<String, Object> loginOptions() {
        return auth.loginOptions();
    }

    @PostMapping("/webauthn/login/verify")
    public SessionDto loginVerify(@Valid @RequestBody WebAuthnVerifyRequest req, HttpServletResponse response) {
        User user = auth.verifyLogin(req);
        return open(user, response);
    }

    private SessionDto open(User user, HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, sessions.open(user).toString());
        return SessionDto.from(user);
    }
}
