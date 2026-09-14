package com.cabanedulys.api.services.admin;

import com.cabanedulys.api.dto.TranscriptLineDto;
import com.cabanedulys.api.dto.admin.AdminEpisodeDto;
import com.cabanedulys.api.dto.admin.EpisodeUpsertRequest;
import com.cabanedulys.api.exceptions.NotFoundException;
import com.cabanedulys.api.models.Episode;
import com.cabanedulys.api.models.EpisodeStatus;
import com.cabanedulys.api.models.Guest;
import com.cabanedulys.api.repositories.EpisodeRepository;
import com.cabanedulys.api.repositories.GuestRepository;
import com.cabanedulys.api.services.EpisodeService;
import com.cabanedulys.api.util.SlugUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Gestion des épisodes (phase 7). Règles de domaine explicites :
 * numéro et slug uniques, publication seulement avec au moins un invité et une description courte,
 * cache public invalidé et action journalisée à chaque mutation.
 */
@Service
public class AdminEpisodeService {

    private final EpisodeRepository episodes;
    private final GuestRepository guests;
    private final EpisodeService publicEpisodes;
    private final ObjectMapper mapper;
    private final AuditService audit;

    public AdminEpisodeService(EpisodeRepository episodes, GuestRepository guests,
                               EpisodeService publicEpisodes, ObjectMapper mapper, AuditService audit) {
        this.episodes = episodes;
        this.guests = guests;
        this.publicEpisodes = publicEpisodes;
        this.mapper = mapper;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<AdminEpisodeDto> list() {
        return episodes.findAll(Sort.by(Sort.Direction.DESC, "number")).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public AdminEpisodeDto get(UUID id) {
        return toDto(find(id));
    }

    @Transactional
    public AdminEpisodeDto create(EpisodeUpsertRequest r) {
        if (episodes.existsByNumber(r.number())) {
            throw new IllegalStateException("Le numéro d'épisode " + r.number() + " est déjà utilisé.");
        }
        String base = StringUtils.hasText(r.slug()) ? SlugUtils.slugify(r.slug()) : SlugUtils.slugify(r.title());
        Episode e = Episode.builder()
                .slug(SlugUtils.unique(base, episodes::existsBySlug))
                .status(EpisodeStatus.DRAFT)
                .build();
        apply(e, r);
        episodes.save(e);
        publicEpisodes.evictAll();
        audit.log("episode.create", "episode", e.getId(), "n° " + e.getNumber() + " · " + e.getTitle());
        return toDto(e);
    }

    @Transactional
    public AdminEpisodeDto update(UUID id, EpisodeUpsertRequest r) {
        Episode e = find(id);
        if (episodes.existsByNumberAndIdNot(r.number(), id)) {
            throw new IllegalStateException("Le numéro d'épisode " + r.number() + " est déjà utilisé.");
        }
        if (StringUtils.hasText(r.slug())) {
            String wanted = SlugUtils.slugify(r.slug());
            if (!wanted.equals(e.getSlug())) {
                if (episodes.existsBySlugAndIdNot(wanted, id)) {
                    throw new IllegalStateException("Le slug « " + wanted + " » est déjà utilisé.");
                }
                e.setSlug(wanted);
            }
        }
        apply(e, r);
        publicEpisodes.evictAll();
        audit.log("episode.update", "episode", id, "n° " + e.getNumber() + " · " + e.getTitle());
        return toDto(e);
    }

    @Transactional
    public AdminEpisodeDto publish(UUID id) {
        Episode e = find(id);
        if (e.getGuests().isEmpty()) {
            throw new IllegalStateException("Un épisode publié doit avoir au moins un invité.");
        }
        if (!StringUtils.hasText(e.getShortDescription())) {
            throw new IllegalStateException("Un épisode publié doit avoir une description courte.");
        }
        if (e.getPublishedAt() == null) e.setPublishedAt(LocalDate.now());
        e.setStatus(EpisodeStatus.PUBLISHED);
        publicEpisodes.evictAll();
        audit.log("episode.publish", "episode", id, "n° " + e.getNumber() + " · " + e.getTitle());
        return toDto(e);
    }

    @Transactional
    public AdminEpisodeDto unpublish(UUID id) {
        Episode e = find(id);
        e.setStatus(EpisodeStatus.DRAFT);
        publicEpisodes.evictAll();
        audit.log("episode.unpublish", "episode", id, "n° " + e.getNumber() + " · " + e.getTitle());
        return toDto(e);
    }

    @Transactional
    public void delete(UUID id) {
        Episode e = find(id);
        episodes.delete(e);
        publicEpisodes.evictAll();
        audit.log("episode.delete", "episode", id, "n° " + e.getNumber() + " · " + e.getTitle());
    }

    /** Appelé quand un invité change de nom ou disparaît : le cache dénormalisé doit suivre. */
    @Transactional
    public void refreshGuestNames(UUID guestId) {
        for (Episode e : episodes.findAllByGuests_Id(guestId)) {
            e.setGuestNamesCache(names(e.getGuests()));
        }
        publicEpisodes.evictAll();
    }

    // ---------- internes ----------

    private Episode find(UUID id) {
        return episodes.findById(id).orElseThrow(() -> new NotFoundException("Épisode introuvable : " + id));
    }

    private void apply(Episode e, EpisodeUpsertRequest r) {
        e.setTitle(r.title().trim());
        e.setNumber(r.number());
        e.setShortDescription(blankToNull(r.shortDescription()));
        e.setDescription(blankToNull(r.description()));
        e.setDurationSec(r.durationSec());
        e.setPublishedAt(r.publishedAt());
        e.setYoutubeId(blankToNull(r.youtubeId()));
        e.setAudioUrl(blankToNull(r.audioUrl()));
        e.setVideoUrl(blankToNull(r.videoUrl()));
        e.setSpotifyUrl(blankToNull(r.spotifyUrl()));
        e.setAppleUrl(blankToNull(r.appleUrl()));
        e.setThumbnailUrl(blankToNull(r.thumbnailUrl()));

        List<Guest> linked = new ArrayList<>();
        if (r.guestIds() != null) {
            for (UUID gid : r.guestIds()) {
                linked.add(guests.findById(gid).orElseThrow(() -> new NotFoundException("Invité introuvable : " + gid)));
            }
        }
        e.getGuests().clear();
        e.getGuests().addAll(linked);
        e.setGuestNamesCache(names(linked));

        List<TranscriptLineDto> transcript = r.transcript() == null ? List.of()
                : r.transcript().stream().sorted((a, b) -> Integer.compare(a.t(), b.t())).toList();
        try {
            e.setTranscriptJson(transcript.isEmpty() ? null : mapper.writeValueAsString(transcript));
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Transcription illisible.");
        }
    }

    private AdminEpisodeDto toDto(Episode e) {
        return AdminEpisodeDto.from(e, parseTranscript(e));
    }

    private List<TranscriptLineDto> parseTranscript(Episode e) {
        if (!StringUtils.hasText(e.getTranscriptJson())) return List.of();
        try {
            return mapper.readValue(e.getTranscriptJson(), new TypeReference<List<TranscriptLineDto>>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }

    private static String names(List<Guest> guests) {
        return guests.stream().map(Guest::getName).collect(Collectors.joining(", "));
    }

    private static String blankToNull(String s) {
        return StringUtils.hasText(s) ? s.trim() : null;
    }
}
