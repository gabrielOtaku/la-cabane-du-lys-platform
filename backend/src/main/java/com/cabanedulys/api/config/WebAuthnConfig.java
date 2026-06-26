package com.cabanedulys.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import lombok.Getter;

/**
 * Paramètres de la Relying Party WebAuthn (Passkeys / authentification biométrique).
 *
 * Pour une implémentation cryptographique complète de la « ceremony »
 * (génération du challenge, vérification de l'attestation et de l'assertion),
 * brancher la librairie <b>webauthn4j</b> dans {@code AuthService}.
 */
@Configuration
@Getter
public class WebAuthnConfig {

    private final String rpId;
    private final String rpName;
    private final String origin;

    public WebAuthnConfig(
            @Value("${app.webauthn.rp-id}") String rpId,
            @Value("${app.webauthn.rp-name}") String rpName,
            @Value("${app.webauthn.origin}") String origin) {
        this.rpId = rpId;
        this.rpName = rpName;
        this.origin = origin;
    }
}
