package com.cabanedulys.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;

/**
 * Réponse d'un authentificateur (attestation à l'enregistrement,
 * assertion à la connexion). Les champs base64url sont vérifiés côté serveur.
 */
public record WebAuthnVerifyRequest(
        @Email @NotBlank String email,
        String id,
        String rawId,
        String type,
        Map<String, Object> response
) {}
