package com.cabanedulys.api.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Liste de révocation des jetons (déconnexion). Clé Redis par {@code jti}, durée de vie égale au
 * temps restant du jeton : la liste se nettoie d'elle-même.
 *
 * <p>Fail-open documenté : si Redis est injoignable, la révocation n'est pas garantie mais
 * l'API reste disponible. En production Redis est un composant obligatoire (voir
 * docs/ENVIRONNEMENT.md).</p>
 */
@Component
public class TokenDenylist {

    private static final Logger log = LoggerFactory.getLogger(TokenDenylist.class);
    private static final String PREFIX = "session:revoked:";

    private final StringRedisTemplate redis;
    private volatile boolean warned = false;

    public TokenDenylist(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public void revoke(String jti, Duration ttl) {
        if (jti == null || jti.isBlank()) return;
        Duration effective = ttl == null || ttl.isNegative() || ttl.isZero() ? Duration.ofMinutes(1) : ttl;
        try {
            redis.opsForValue().set(PREFIX + jti, "1", effective);
        } catch (Exception e) {
            warnOnce(e);
        }
    }

    public boolean isRevoked(String jti) {
        if (jti == null || jti.isBlank()) return false;
        try {
            return Boolean.TRUE.equals(redis.hasKey(PREFIX + jti));
        } catch (Exception e) {
            warnOnce(e);
            return false;
        }
    }

    private void warnOnce(Exception e) {
        if (!warned) {
            warned = true;
            log.warn("Redis indisponible : la révocation de session est désactivée (fail-open). Cause : {}",
                    e.getClass().getSimpleName());
        }
    }
}
