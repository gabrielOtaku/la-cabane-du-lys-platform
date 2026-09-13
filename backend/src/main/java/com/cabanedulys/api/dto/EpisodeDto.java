package com.cabanedulys.api.dto;

import com.cabanedulys.api.models.Episode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record EpisodeDto(
        UUID id, String slug, int number, String title, String status,
        String shortDescription, String description, LocalDate publishedAt,
        int durationSec, String youtubeId, String audioUrl, String videoUrl,
        String spotifyUrl, String appleUrl, String thumbnailUrl,
        List<GuestSummaryDto> guests, List<TranscriptLineDto> transcript
) {
    public static EpisodeDto from(Episode e, List<TranscriptLineDto> transcript) {
        return new EpisodeDto(
                e.getId(), e.getSlug(), e.getNumber(), e.getTitle(),
                e.getStatus() == null ? null : e.getStatus().name(),
                e.getShortDescription(), e.getDescription(), e.getPublishedAt(),
                e.getDurationSec(), e.getYoutubeId(), e.getAudioUrl(), e.getVideoUrl(),
                e.getSpotifyUrl(), e.getAppleUrl(), e.getThumbnailUrl(),
                e.getGuests().stream().map(GuestSummaryDto::from).toList(),
                transcript
        );
    }
}
