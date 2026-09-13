package com.cabanedulys.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

/**
 * Émission et validation des jetons de session (JWT HS256).
 *
 * <p>Le jeton voyage dans un cookie HttpOnly (voir {@link SessionCookieService}) ou, pour les
 * clients non-navigateur, dans un en-tête {@code Authorization: Bearer}. Chaque jeton porte un
 * identifiant unique ({@code jti}) qui permet sa révocation à la déconnexion
 * (voir {@link TokenDenylist}).</p>
 */
@Service
public class JwtService {

    /** Contenu validé d'un jeton. */
    public record TokenClaims(String email, String role, String jti, Instant expiresAt) {}

    private final SecretKey key;
    private final Duration expiration;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-minutes:120}") long expirationMinutes) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = Duration.ofMinutes(expirationMinutes);
    }

    public Duration expiration() {
        return expiration;
    }

    public String generate(String email, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(email)
                .claim("role", role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expiration)))
                .signWith(key)
                .compact();
    }

    /** Retourne les claims si la signature et la date d'expiration sont valides, sinon vide. */
    public Optional<TokenClaims> tryParse(String token) {
        try {
            Claims c = parse(token);
            Object role = c.get("role");
            return Optional.of(new TokenClaims(
                    c.getSubject(),
                    role == null ? null : role.toString(),
                    c.getId(),
                    c.getExpiration() == null ? null : c.getExpiration().toInstant()));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public String extractEmail(String token) {
        return parse(token).getSubject();
    }

    public String extractRole(String token) {
        Object role = parse(token).get("role");
        return role == null ? null : role.toString();
    }

    public boolean isValid(String token) {
        return tryParse(token).isPresent();
    }

    private Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
