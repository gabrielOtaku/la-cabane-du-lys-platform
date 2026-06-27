package com.cabanedulys.api;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Classe de base pour les tests d'intégration haute-fidélité.
 * Lance un vrai conteneur Docker PostgreSQL (identique à la production).
 * Flyway applique les migrations — le même SQL PostgreSQL qu'en prod (tsvector, GIN…).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
public abstract class IntegrationTestBase {

    @Container
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:16-alpine")
                    .withDatabaseName("cabanedulys_test")
                    .withUsername("test")
                    .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",      postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        // Active Flyway sur le conteneur PostgreSQL (désactivé dans application-dev.yml)
        registry.add("spring.flyway.enabled",                 () -> "true");
        registry.add("spring.jpa.hibernate.ddl-auto",        () -> "none");
        registry.add("spring.jpa.database-platform",
                () -> "org.hibernate.dialect.PostgreSQLDialect");
        // Pas de Redis en test — cache mémoire simple
        registry.add("spring.cache.type",                     () -> "simple");
        registry.add("spring.data.redis.connect-timeout",     () -> "100ms");
        registry.add("spring.data.redis.timeout",             () -> "100ms");
    }
}
