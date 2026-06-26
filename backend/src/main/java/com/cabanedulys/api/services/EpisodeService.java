package com.cabanedulys.api.services;

import com.cabanedulys.api.dto.EpisodeDto;
import com.cabanedulys.api.dto.TranscriptLineDto;
import com.cabanedulys.api.exceptions.NotFoundException;
import com.cabanedulys.api.models.Episode;
import com.cabanedulys.api.repositories.EpisodeRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class EpisodeService {

    private final EpisodeRepository repo;
    private final ObjectMapper mapper;

    public EpisodeService(EpisodeRepository repo, ObjectMapper mapper) {
        this.repo = repo;
        this.mapper = mapper;
    }

    @Cacheable("episodes")
    public List<EpisodeDto> findAll() {
        return repo.findAllByOrderByNumberDesc().stream()
                .map(e -> EpisodeDto.from(e, parseTranscript(e))).toList();
    }

    public EpisodeDto findById(UUID id) {
        Episode e = repo.findById(id).orElseThrow(() -> new NotFoundException("Épisode introuvable : " + id));
        return EpisodeDto.from(e, parseTranscript(e));
    }

    /** Recherche plein texte via PostgreSQL tsvector. Retourne [] si le profil dev (H2) est actif. */
    public List<EpisodeDto> search(String q) {
        if (!StringUtils.hasText(q)) return List.of();
        try {
            return repo.search(q.trim()).stream()
                    .map(e -> EpisodeDto.from(e, parseTranscript(e))).toList();
        } catch (Exception ex) {
            return List.of();
        }
    }

    private List<TranscriptLineDto> parseTranscript(Episode e) {
        if (e.getTranscriptJson() == null || e.getTranscriptJson().isBlank()) return Collections.emptyList();
        try {
            return mapper.readValue(e.getTranscriptJson(), new TypeReference<List<TranscriptLineDto>>() {});
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }
}
