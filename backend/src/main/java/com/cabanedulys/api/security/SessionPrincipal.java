package com.cabanedulys.api.security;

import java.security.Principal;
import java.time.Instant;

/**
 * Identité placée dans le contexte de sécurité pour chaque requête authentifiée.
 * {@code jti} et {@code expiresAt} servent à révoquer le jeton à la déconnexion.
 */
public record SessionPrincipal(String email, String role, String jti, Instant expiresAt) implements Principal {

    @Override
    public String getName() {
        return email;
    }
}
