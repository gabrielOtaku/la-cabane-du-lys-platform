package com.cabanedulys.api.models;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

/** Authentificateur enregistré (Passkey) rattaché à un membre. */
@Entity
@Table(name = "webauthn_credentials")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WebAuthnCredential {

    @Id @GeneratedValue
    private UUID id;

    /** Identifiant de la credential (base64url). */
    @Column(nullable = false, unique = true, length = 512)
    private String credentialId;

    /** Clé publique COSE encodée (base64). */
    @Column(nullable = false, length = 1024)
    private String publicKey;

    @Column(nullable = false)
    @Builder.Default
    private long signatureCount = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
