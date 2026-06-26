package com.cabanedulys.api;

import com.cabanedulys.api.security.JwtService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test unitaire pur (sans contexte Spring ni base de données) :
 * vérifie l'aller-retour d'un jeton JWT.
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
    }

    @Test
    void rejectsTamperedToken() {
        String token = jwt.generate("membre@cabanedulys.ca", "MEMBER");
        assertFalse(jwt.isValid(token + "tampered"));
    }
}
