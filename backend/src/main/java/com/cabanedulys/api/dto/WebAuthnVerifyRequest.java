package com.cabanedulys.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;

/**
 * Réponse d'un authentificateur (attestation à l'enregistrement, assertion à la connexion).
 * {@code challengeId} identifie le défi émis par le serveur ; aucune adresse courriel ne
 * transite ici, ce qui évite l'énumération des comptes à la connexion.
 */
public record WebAuthnVerifyRequest(
        @NotBlank @Size(max = 64) String challengeId,
        String id,
        String rawId,
        String type,
        Map<String, Object> response
) {}
