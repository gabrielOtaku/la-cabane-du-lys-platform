package com.cabanedulys.api.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Crée les tables non-JPA nécessaires en mode dev (H2, Flyway désactivé).
 * Exécuté une fois après l'initialisation complète du contexte Spring.
 */
@Component
@Profile("dev")
public class DevDataInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    public DevDataInitializer(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS social_stats (
                    key        VARCHAR(60) PRIMARY KEY,
                    value      BIGINT      NOT NULL DEFAULT 0,
                    updated_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """);

        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM social_stats", Integer.class);
        if (count == null || count == 0) {
            jdbc.update("INSERT INTO social_stats (key, value) VALUES (?, ?)", "listeners_total",   4800L);
            jdbc.update("INSERT INTO social_stats (key, value) VALUES (?, ?)", "downloads_total",   31200L);
            jdbc.update("INSERT INTO social_stats (key, value) VALUES (?, ?)", "reviews_total",     312L);
            jdbc.update("INSERT INTO social_stats (key, value) VALUES (?, ?)", "spotify_followers", 2100L);
        }
    }
}
