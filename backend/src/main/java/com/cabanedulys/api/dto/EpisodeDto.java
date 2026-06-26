package com.cabanedulys.api.dto;

import com.cabanedulys.api.models.Episode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record EpisodeDto(
        UUID id, int number, String title, String guestName, String sector,
        int durationSec, LocalDate publishedAt, String description,
        String audioUrl, String videoUrl, List<TranscriptLineDto> transcript
) {
    public static EpisodeDto from(Episode e, List<TranscriptLineDto> transcript) {
        return new EpisodeDto(
                e.getId(), e.getNumber(), e.getTitle(), e.getGuestName(),
                e.getSector() == null ? null : e.getSector().name().toLowerCase(),
                e.getDurationSec(), e.getPublishedAt(), e.getDescription(),
                e.getAudioUrl(), e.getVideoUrl(), transcript
        );
    }
}
