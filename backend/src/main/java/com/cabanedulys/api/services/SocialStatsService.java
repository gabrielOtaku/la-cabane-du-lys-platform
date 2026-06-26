package com.cabanedulys.api.services;

import com.cabanedulys.api.dto.SocialStatsDto;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Compteurs sociaux (§6.2) — persistance en base (source de vérité),
 * mise en cache Redis pour les lectures fréquentes.
 */
@Service
public class SocialStatsService {

    private static final String REDIS_KEY = "stats:social";

    private final StringRedisTemplate redis;
    private final JdbcTemplate jdbc;

    public SocialStatsService(StringRedisTemplate redis, JdbcTemplate jdbc) {
        this.redis = redis;
        this.jdbc = jdbc;
    }

    /** Lecture depuis Redis (warm) ou base si le cache est froid ou Redis absent. */
    public SocialStatsDto get() {
        try {
            Map<Object, Object> cached = redis.opsForHash().entries(REDIS_KEY);
            if (!cached.isEmpty()) {
                return fromMap(cached);
            }
        } catch (Exception ignored) {
            // Redis indisponible (ex. profil dev) → lecture directe en base
        }
        return reload();
    }

    /**
     * Recharge les compteurs depuis la base et met à jour Redis.
     * Appelé par le cron job et après chaque incrément.
     */
    public SocialStatsDto reload() {
        Map<String, Long> db = new java.util.HashMap<>();
        jdbc.query("SELECT key, value FROM social_stats", rs -> {
            db.put(rs.getString("key"), rs.getLong("value"));
        });

        try {
            redis.delete(REDIS_KEY);
            db.forEach((k, v) -> redis.opsForHash().put(REDIS_KEY, k, String.valueOf(v)));
        } catch (Exception ignored) {
            // Redis indisponible — on continue sans cache
        }

        return new SocialStatsDto(
                db.getOrDefault("listeners_total",   0L),
                db.getOrDefault("downloads_total",   0L),
                db.getOrDefault("reviews_total",     0L),
                db.getOrDefault("spotify_followers", 0L)
        );
    }

    /** Incrémente un compteur (e.g. après un téléchargement confirmé). */
    public void increment(String key, long delta) {
        jdbc.update("""
                UPDATE social_stats
                SET value = value + ?, updated_at = now()
                WHERE key = ?
                """, delta, key);
        try {
            redis.opsForHash().increment(REDIS_KEY, key, delta);
        } catch (Exception ignored) {
            // Redis indisponible — l'incrément est persisté en base
        }
    }

    private SocialStatsDto fromMap(Map<Object, Object> m) {
        return new SocialStatsDto(
                longVal(m, "listeners_total"),
                longVal(m, "downloads_total"),
                longVal(m, "reviews_total"),
                longVal(m, "spotify_followers")
        );
    }

    private static long longVal(Map<Object, Object> m, String key) {
        Object v = m.get(key);
        return v == null ? 0L : Long.parseLong(v.toString());
    }
}
