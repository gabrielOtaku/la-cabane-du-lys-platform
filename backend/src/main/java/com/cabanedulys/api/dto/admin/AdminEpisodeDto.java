package com.cabanedulys.api.dto.admin;

import com.cabanedulys.api.dto.GuestSummaryDto;
import com.cabanedulys.api.dto.TranscriptLineDto;
import com.cabanedulys.api.models.Episode;
import com.cabanedulys.api.models.Guest;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Vue administrateur d'un épisode : inclut les brouillons et la transcription complète. */
public record AdminEpisodeDto(
        UUID id, String slug, int number, String title, String status,
        String shortDescription, String description, LocalDate publishedAt, int durationSec,
        String youtubeId, String audioUrl, String videoUrl, String spotifyUrl, String appleUrl, String thumbnailUrl,
        List<UUID> guestIds, List<GuestSummaryDto> guests, List<TranscriptLineDto> transcript
) {
    public static AdminEpisodeDto from(Episode e, List<TranscriptLineDto> transcript) {
        return new AdminEpisodeDto(
                e.getId(), e.getSlug(), e.getNumber(), e.getTitle(), e.getStatus().name(),
                e.getShortDescription(), e.getDescription(), e.getPublishedAt(), e.getDurationSec(),
                e.getYoutubeId(), e.getAudioUrl(), e.getVideoUrl(), e.getSpotifyUrl(), e.getAppleUrl(), e.getThumbnailUrl(),
                e.getGuests().stream().map(Guest::getId).toList(),
                e.getGuests().stream().map(GuestSummaryDto::from).toList(),
                transcript);
    }
}
