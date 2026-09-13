package com.cabanedulys.api.models;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

/** Entrepreneur invité — parcours réel, jamais de donnée financière par défaut (audit §3.2, §7). */
@Entity
@Table(name = "guests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Guest {

    @Id @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String name;

    private String role;
    private String company;
    private String companyUrl;

    private String city;
    private String region;

    /** Taxonomie libre (ex. « Création & design autochtone ») — plus de secteur fermé. */
    private String category;

    /** Une phrase : ce que l'on apprend dans l'épisode de cet invité. */
    @Column(length = 400)
    private String angle;

    @Column(length = 2000)
    private String bio;

    private String photoUrl;

    /** Uniquement si réellement prononcée et validée par l'invité (audit §7.1). */
    @Column(length = 600)
    private String quote;

    @Builder.Default
    private boolean featured = false;

    /** Champ hérité — remplacé par {@link #category}. Conservé nullable, non exposé via l'API. */
    @Enumerated(EnumType.STRING)
    private Sector sector;
}
