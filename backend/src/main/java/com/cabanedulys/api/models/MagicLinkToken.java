package com.cabanedulys.api.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Jeton de lien magique à usage unique. Seul le hachage SHA-256 du secret est conservé :
 * une fuite de la base ne permet pas de forger un lien valide.
 */
@Entity
@Table(name = "magic_link_tokens")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MagicLinkToken {

    @Id @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private Instant expiresAt;

    private Instant usedAt;

    @Column(nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
