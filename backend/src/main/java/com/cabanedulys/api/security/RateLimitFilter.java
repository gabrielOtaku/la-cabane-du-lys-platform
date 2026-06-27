package com.cabanedulys.api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;
import java.time.Duration;
import java.util.Set;

/**
 * Bouclier anti-abus : limite le débit par IP sur les endpoints sensibles.
 * Algorithme : fenêtre fixe Redis (INCR + EXPIRE). Fail-open si Redis indisponible.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> PROTECTED = Set.of("/auth/magic-link", "/shop/checkout");

    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;
    private final int maxRequests;
    private final Duration window;

    public RateLimitFilter(
            StringRedisTemplate redis,
            ObjectMapper mapper,
            @Value("${app.rate-limit.max-requests:5}") int maxRequests,
            @Value("${app.rate-limit.window-seconds:60}") int windowSeconds) {
        this.redis       = redis;
        this.mapper      = mapper;
        this.maxRequests = maxRequests;
        this.window      = Duration.ofSeconds(windowSeconds);
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String path = request.getRequestURI().replace(request.getContextPath(), "");

        if (!PROTECTED.contains(path)) {
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
            if (count != null && count > maxRequests) {
                reject(response, path);
                return;
            }
        } catch (Exception ignored) {
            // Redis indisponible → fail-open : on laisse passer pour ne pas bloquer les utilisateurs légitimes
        }

        chain.doFilter(request, response);
    }

    private String resolveIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        return (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : request.getRemoteAddr();
    }

    private void reject(HttpServletResponse response, String path) throws IOException {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.TOO_MANY_REQUESTS,
                "Trop de tentatives. Veuillez réessayer dans une minute.");
        pd.setTitle("Too Many Requests");
        pd.setType(URI.create("https://cabanedulys.ca/errors/rate-limit-exceeded"));
        pd.setProperty("path", path);

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        mapper.writeValue(response.getWriter(), pd);
    }
}
