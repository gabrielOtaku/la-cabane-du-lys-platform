package com.cabanedulys.api.security;

import com.cabanedulys.api.models.Role;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * Authentifie chaque requête API à partir du cookie de session HttpOnly ou, pour les clients
 * non-navigateur, d'un en-tête {@code Authorization: Bearer <jwt>}.
 *
 * <ul>
 *   <li>Le rôle est lu dans le jeton et doit correspondre à une valeur de {@link Role} ;
 *       un rôle inconnu vaut absence d'authentification.</li>
 *   <li>Un jeton révoqué (déconnexion) est ignoré.</li>
 *   <li>Pour une requête authentifiée par cookie et non sûre (POST, PUT, PATCH, DELETE),
 *       l'origine du navigateur doit être l'origine autorisée : protection CSRF.</li>
 * </ul>
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS");

    private final JwtService jwtService;
    private final SessionCookieService cookies;
    private final TokenDenylist denylist;
    private final ApiSecurityErrors errors;
    private final List<String> allowedOrigins;

    public JwtAuthenticationFilter(JwtService jwtService,
                                   SessionCookieService cookies,
                                   TokenDenylist denylist,
                                   ApiSecurityErrors errors,
                                   @Value("${app.cors.allowed-origin}") String allowedOrigin) {
        this.jwtService = jwtService;
        this.cookies = cookies;
        this.denylist = denylist;
        this.errors = errors;
        this.allowedOrigins = Arrays.stream(allowedOrigin.split(","))
                .map(String::trim).filter(s -> !s.isEmpty())
                .map(JwtAuthenticationFilter::normalizeOrigin)
                .toList();
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            chain.doFilter(request, response);
            return;
        }

        String token = null;
        boolean fromCookie = false;
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7).trim();
        } else {
            Optional<String> c = cookies.read(request);
            if (c.isPresent()) {
                token = c.get();
                fromCookie = true;
            }
        }
        if (token == null || token.isEmpty()) {
            chain.doFilter(request, response);
            return;
        }

        Optional<JwtService.TokenClaims> parsed = jwtService.tryParse(token);
        if (parsed.isEmpty()) {
            chain.doFilter(request, response);
            return;
        }
        JwtService.TokenClaims claims = parsed.get();

        Optional<Role> role = parseRole(claims.role());
        if (role.isEmpty() || claims.email() == null || claims.email().isBlank()) {
            chain.doFilter(request, response);
            return;
        }
        if (denylist.isRevoked(claims.jti())) {
            chain.doFilter(request, response);
            return;
        }

        if (fromCookie && !SAFE_METHODS.contains(request.getMethod()) && !originAllowed(request)) {
            errors.write(response, HttpStatus.FORBIDDEN, "Forbidden",
                    "Origine de la requête non autorisée.", "csrf-origin");
            return;
        }

        SessionPrincipal principal = new SessionPrincipal(
                claims.email(), role.get().name(), claims.jti(), claims.expiresAt());
        var auth = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + role.get().name())));
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(auth);

        chain.doFilter(request, response);
    }

    private static Optional<Role> parseRole(String raw) {
        if (raw == null) return Optional.empty();
        try {
            return Optional.of(Role.valueOf(raw.trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    /** Origin d'abord, Referer en repli (certains navigateurs omettent Origin en same-origin). */
    private boolean originAllowed(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        if (origin == null || origin.isBlank()) {
            String referer = request.getHeader("Referer");
            if (referer == null || referer.isBlank()) return false;
            try {
                URI u = URI.create(referer);
                if (u.getScheme() == null || u.getHost() == null) return false;
                origin = u.getScheme() + "://" + u.getHost() + (u.getPort() > 0 ? ":" + u.getPort() : "");
            } catch (IllegalArgumentException e) {
                return false;
            }
        }
        return allowedOrigins.contains(normalizeOrigin(origin));
    }

    private static String normalizeOrigin(String origin) {
        String o = origin.trim().toLowerCase(Locale.ROOT);
        return o.endsWith("/") ? o.substring(0, o.length() - 1) : o;
    }
}
