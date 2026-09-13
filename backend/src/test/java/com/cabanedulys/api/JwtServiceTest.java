package com.cabanedulys.api;

import com.cabanedulys.api.security.JwtService;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test unitaire pur (sans contexte Spring ni base de données) :
 * vérifie l'aller-retour d'un jeton JWT, son identifiant unique et son rôle.
 */
class JwtServiceTest {

    private final JwtService jwt =
            new JwtService("test-secret-key-that-is-at-least-32-bytes-long!!", 60);

    @Test
    void generatesAndReadsToken() {
        String token = jwt.generate("membre@cabanedulys.ca", "MEMBER");
        assertNotNull(token);
        assertTrue(jwt.isValid(token));
        assertEquals("membre@cabanedulys.ca", jwt.extractEmail(token));
        assertEquals("MEMBER", jwt.extractRole(token));
    }

    @Test
    void exposesClaimsWithUniqueIdAndExpiry() {
        JwtService.TokenClaims a = jwt.tryParse(jwt.generate("a@cabanedulys.ca", "ADMIN")).orElseThrow();
        JwtService.TokenClaims b = jwt.tryParse(jwt.generate("a@cabanedulys.ca", "ADMIN")).orElseThrow();

        assertEquals("ADMIN", a.role());
        assertNotNull(a.jti());
        assertNotEquals(a.jti(), b.jti(), "chaque jeton doit avoir son propre identifiant de révocation");
        assertTrue(a.expiresAt().isAfter(Instant.now().plus(Duration.ofMinutes(59))));
        assertEquals(Duration.ofMinutes(60), jwt.expiration());
    }

    @Test
    void rejectsTamperedToken() {
        String token = jwt.generate("membre@cabanedulys.ca", "MEMBER");
        assertFalse(jwt.isValid(token + "tampered"));
        assertTrue(jwt.tryParse(token + "tampered").isEmpty());
    }

    @Test
    void rejectsTokenSignedWithAnotherKey() {
        JwtService other = new JwtService("another-secret-key-that-is-at-least-32-bytes!!", 60);
        String token = other.generate("membre@cabanedulys.ca", "MEMBER");
        assertFalse(jwt.isValid(token));
    }

    @Test
    void rejectsExpiredToken() {
        JwtService shortLived = new JwtService("test-secret-key-that-is-at-least-32-bytes-long!!", 0);
        String token = shortLived.generate("membre@cabanedulys.ca", "MEMBER");
        assertFalse(shortLived.isValid(token));
    }
}
