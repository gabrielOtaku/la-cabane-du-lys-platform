package com.cabanedulys.api.dto;

/** Compteurs sociaux exposés publiquement (§6.2). */
public record SocialStatsDto(
        long listenersTotal,
        long downloadsTotal,
        long reviewsTotal,
        long spotifyFollowers
) {}
