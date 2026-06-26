package com.cabanedulys.api.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.UUID;

/** Épisode du podcast — lu via Le Coffre. */
@Entity
@Table(name = "episodes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Episode {

    @Id @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private int number;

    @Column(nullable = false)
    private String title;

    private String guestName;

    @Enumerated(EnumType.STRING)
    private Sector sector;

    private int durationSec;
    private LocalDate publishedAt;

    @Column(length = 2000)
    private String description;

    private String audioUrl;
    private String videoUrl;

    /** Transcription sérialisée (JSON) — synchronisation temporelle côté client. */
    @Column(columnDefinition = "text")
    private String transcriptJson;
}
