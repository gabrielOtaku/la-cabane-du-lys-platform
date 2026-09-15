package com.cabanedulys.api.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;

/**
 * Cookie de session : HttpOnly, Secure (hors profil dev), SameSite=Lax, limité au chemin de l'API.
 *
 * <p>Stratégie retenue (feuille de route, phase 1) : le secret de session n'est jamais accessible
 * au JavaScript du navigateur. La protection CSRF repose sur SameSite=Lax plus la vérification
 * de l'en-tête Origin dans {@link JwtAuthenticationFilter} pour toute requête non sûre.</p>
 */
@Component
public class SessionCookieService {

    private final String name;
    private final boolean secure;
    private final String domain;
    private final String path;

    public SessionCookieService(
            @Value("${app.session.cookie-name:cdl_session}") String name,
            @Value("${app.session.cookie-secure:true}") boolean secure,
            @Value("${app.session.cookie-domain:}") String domain,
            @Value("${server.servlet.context-path:/}") String contextPath) {
        this.name = name;
        this.secure = secure;
        this.domain = domain == null || domain.isBlank() ? null : domain.trim();
        this.path = contextPath == null || contextPath.isBlank() ? "/" : contextPath;
    }

    public String name() {
        return name;
    }

    public ResponseCookie issue(String jwt, Duration maxAge) {
        return base(jwt).maxAge(maxAge).build();
    }

    public ResponseCookie clear() {
        return base("").maxAge(Duration.ZERO).build();
    }

    public Optional<String> read(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return Optional.empty();
        return Arrays.stream(cookies)
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .filter(v -> v != null && !v.isBlank())
                .findFirst();
    }

    private ResponseCookie.ResponseCookieBuilder base(String value) {
        ResponseCookie.ResponseCookieBuilder b = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path(path);
        if (domain != null) b.domain(domain);
        return b;
    }
}
