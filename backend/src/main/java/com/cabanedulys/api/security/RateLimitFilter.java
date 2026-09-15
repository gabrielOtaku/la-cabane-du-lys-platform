package com.cabanedulys.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;

/**
 * Bouclier anti-abus : limite le débit par route et par IP sur les endpoints sensibles.
 * Algorithme : fenêtre fixe Redis (INCR + EXPIRE). Fail-open si Redis indisponible.
 *
 * <p>Les limites sont exprimées en multiples de {@code app.rate-limit.max-requests}
 * (5 par minute par défaut) : lien magique ×1, vérifications et paiement ×2, recherche ×12.</p>
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final StringRedisTemplate redis;
    private final ApiSecurityErrors errors;
    private final Duration window;
    private final boolean trustForwardedFor;
    private final Map<String, Integer> limits;

    public RateLimitFilter(
            StringRedisTemplate redis,
            ApiSecurityErrors errors,
            @Value("${app.rate-limit.max-requests:5}") int maxRequests,
            @Value("${app.rate-limit.window-seconds:60}") int windowSeconds,
            @Value("${app.rate-limit.trust-forwarded-for:false}") boolean trustForwardedFor) {
        this.redis = redis;
        this.errors = errors;
        this.window = Duration.ofSeconds(windowSeconds);
        this.trustForwardedFor = trustForwardedFor;
        this.limits = Map.of(
                "/auth/magic-link",                 maxRequests,
                "/auth/magic-link/verify",          maxRequests * 2,
                "/auth/webauthn/register/options",  maxRequests * 2,
                "/auth/webauthn/register/verify",   maxRequests * 2,
                "/auth/webauthn/login/options",     maxRequests * 2,
                "/auth/webauthn/login/verify",      maxRequests * 2,
                "/shop/checkout",                   maxRequests * 2,
                "/episodes/search",                 maxRequests * 12);
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String path = request.getRequestURI().replace(request.getContextPath(), "");
        Integer limit = limits.get(path);

        if (limit == null) {
            chain.doFilter(request, response);
            return;
        }

        String ip  = resolveIp(request);
        String key = "rl:" + path + ":" + ip;

        try {
            Long count = redis.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redis.expire(key, window);
            }
            if (count != null && count > limit) {
                errors.write(response, HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests",
                        "Trop de tentatives. Veuillez réessayer dans une minute.", "rate-limit-exceeded");
                return;
            }
        } catch (Exception ignored) {
            // Redis indisponible → fail-open : on laisse passer pour ne pas bloquer les utilisateurs légitimes
        }

        chain.doFilter(request, response);
    }

    /**
     * N'utilise X-Forwarded-For que si un proxy de confiance en amont est explicitement
     * configuré (app.rate-limit.trust-forwarded-for=true) — sinon l'en-tête est spoofable
     * par n'importe quel client et permettrait de contourner la limite de débit.
     */
    private String resolveIp(HttpServletRequest request) {
        if (trustForwardedFor) {
            String xff = request.getHeader("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
