package com.cabanedulys.api.dto.admin;

import com.cabanedulys.api.dto.TranscriptLineDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Création / mise à jour d'un épisode. Le statut se change par /publish et /unpublish, jamais ici. */
public record EpisodeUpsertRequest(
        @NotBlank @Size(max = 255) String title,
        @Min(1) int number,
        @Size(max = 160) String slug,
        @Size(max = 400) String shortDescription,
        @Size(max = 2000) String description,
        @Min(0) int durationSec,
        LocalDate publishedAt,
        @Size(max = 60) String youtubeId,
        @Size(max = 500) String audioUrl,
        @Size(max = 500) String videoUrl,
        @Size(max = 500) String spotifyUrl,
        @Size(max = 500) String appleUrl,
        @Size(max = 500) String thumbnailUrl,
        List<UUID> guestIds,
        List<@Valid TranscriptLineDto> transcript
) {}
