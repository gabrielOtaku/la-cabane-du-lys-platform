package com.cabanedulys.api.repositories;

import com.cabanedulys.api.models.MagicLinkToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface MagicLinkTokenRepository extends JpaRepository<MagicLinkToken, UUID> {

    Optional<MagicLinkToken> findByTokenHash(String tokenHash);

    /** Marque le jeton utilisé de façon atomique : deux clics simultanés ne donnent qu'une session. */
    @Modifying
    @Query("update MagicLinkToken t set t.usedAt = :now where t.id = :id and t.usedAt is null")
    int markUsed(@Param("id") UUID id, @Param("now") Instant now);

    @Modifying
    @Query("delete from MagicLinkToken t where t.expiresAt < :before")
    int deleteExpiredBefore(@Param("before") Instant before);
}
