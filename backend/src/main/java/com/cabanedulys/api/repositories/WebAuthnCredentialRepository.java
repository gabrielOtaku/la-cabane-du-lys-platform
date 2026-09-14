package com.cabanedulys.api.repositories;

import com.cabanedulys.api.models.WebAuthnCredential;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WebAuthnCredentialRepository extends JpaRepository<WebAuthnCredential, UUID> {
    /** Charge l'utilisateur avec la passkey : le contrôleur lit son courriel et son rôle hors transaction. */
    @EntityGraph(attributePaths = "user")
    Optional<WebAuthnCredential> findByCredentialId(String credentialId);
    List<WebAuthnCredential> findByUserEmail(String email);
}
