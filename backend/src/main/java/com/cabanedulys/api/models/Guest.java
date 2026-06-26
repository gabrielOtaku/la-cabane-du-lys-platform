package com.cabanedulys.api.models;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

/** Entrepreneur invité — exposé dans la Salle des Trophées. */
@Entity
@Table(name = "guests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Guest {

    @Id @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String role;
    private String company;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Sector sector;

    private String revenue;
    private int employees;

    @Column(length = 600)
    private String quote;

    @Column(length = 600)
    private String lesson;
}
