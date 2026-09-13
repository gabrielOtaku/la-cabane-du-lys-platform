package com.cabanedulys.api.dto;

/** Tableau de bord administrateur : compteurs agrégés, aucune donnée personnelle. */
public record AdminOverviewDto(
        long episodesPublished,
        long episodesDraft,
        long guests,
        long members,
        long ordersPending,
        long ordersPaid
) {}
