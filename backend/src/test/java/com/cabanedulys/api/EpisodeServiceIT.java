package com.cabanedulys.api;

import com.cabanedulys.api.dto.EpisodeDto;
import com.cabanedulys.api.exceptions.NotFoundException;
import com.cabanedulys.api.services.EpisodeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Tests d'intégration EpisodeService — s'exécutent sur un vrai PostgreSQL (Testcontainers).
 * Contrairement à H2, le moteur PostgreSQL supporte tsvector/GIN : la recherche plein texte
 * est testée dans les mêmes conditions qu'en production.
 */
class EpisodeServiceIT extends IntegrationTestBase {

    @Autowired
    private EpisodeService episodeService;

    @Test
    @DisplayName("findAll() — se connecte au vrai PostgreSQL et retourne une liste")
    void findAll_returnsListFromRealPostgres() {
        List<EpisodeDto> episodes = episodeService.findAll();
        assertThat(episodes).isNotNull();
    }

    @Test
    @DisplayName("findById() — lève NotFoundException pour un UUID inconnu")
    void findById_throwsNotFound_forUnknownId() {
        UUID unknown = UUID.randomUUID();
        assertThatThrownBy(() -> episodeService.findById(unknown))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining(unknown.toString());
    }

    @Test
    @DisplayName("search() — utilise tsvector PostgreSQL sans lever d'exception")
    void search_withPostgresTsvector_doesNotThrow() {
        // H2 ferait exploser cette requête ; PostgreSQL la gère nativement
        List<EpisodeDto> results = episodeService.search("entrepreneuriat cabane");
        assertThat(results).isNotNull();
    }

    @Test
    @DisplayName("search() — retourne liste vide pour une requête sans résultat")
    void search_returnsEmpty_whenNoMatch() {
        List<EpisodeDto> results = episodeService.search("xyztermeabsent99999");
        assertThat(results).isEmpty();
    }
}
