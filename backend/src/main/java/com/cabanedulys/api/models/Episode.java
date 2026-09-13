package com.cabanedulys.api.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Épisode du podcast — lu via Le Coffre. Un DRAFT n'est jamais retourné aux routes publiques. */
@Entity
@Table(name = "episodes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Episode {

    @Id @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false, unique = true)
    private int number;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EpisodeStatus status = EpisodeStatus.DRAFT;

    @Column(length = 400)
    private String shortDescription;

    @Column(length = 2000)
    private String description;

    private int durationSec;
    private LocalDate publishedAt;

    private String thumbnailUrl;
    private String youtubeId;
    private String audioUrl;
    private String videoUrl;
    private String spotifyUrl;
    private String appleUrl;

    /** Transcription sérialisée (JSON) — synchronisation temporelle côté client. */
    @Column(columnDefinition = "text")
    private String transcriptJson;

    /**
     * Copie dénormalisée des noms d'invités, maintenue par {@code EpisodeService} à chaque
     * mutation des invités liés — nécessaire car une colonne générée STORED ne peut pas lire
     * une relation jointe (contrainte PostgreSQL).
     */
    @Column(nullable = false)
    @Builder.Default
    private String guestNamesCache = "";

    @ManyToMany
    @JoinTable(
            name = "episode_guests",
            joinColumns = @JoinColumn(name = "episode_id"),
            inverseJoinColumns = @JoinColumn(name = "guest_id"))
    @OrderColumn(name = "display_order")
    @Builder.Default
    private List<Guest> guests = new ArrayList<>();
}
