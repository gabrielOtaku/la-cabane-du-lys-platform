package com.cabanedulys.api.jobs;

import com.cabanedulys.api.services.SocialStatsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Cron §6.2 — rafraîchissement des compteurs sociaux.
 *
 * <p>Toutes les 6 heures, ce job recharge les compteurs depuis la base
 * (qui peut être mise à jour par des intégrations externes : Spotify API,
 * Apple Podcasts RSS, etc.) et invalide le cache Redis.</p>
 */
@Component
public class SocialStatsJob {

    private static final Logger log = LoggerFactory.getLogger(SocialStatsJob.class);

    private final SocialStatsService stats;

    public SocialStatsJob(SocialStatsService stats) {
        this.stats = stats;
    }

    /** Toutes les 6 heures. Modifier le cron pour ajuster la fréquence. */
    @Scheduled(cron = "0 0 */6 * * *")
    public void refresh() {
        log.info("[SocialStats] Rafraîchissement des compteurs…");
        try {
            // TODO: appeler ici les APIs externes (Spotify, Apple Podcasts, YouTube)
            // et mettre à jour la table social_stats avant le reload.
            // Exemple :
            //   long spotifyFollowers = spotifyClient.getShowFollowers(showId);
            //   jdbc.update("UPDATE social_stats SET value=? WHERE key='spotify_followers'", spotifyFollowers);
            stats.reload();
            log.info("[SocialStats] Compteurs mis à jour.");
        } catch (Exception e) {
            log.error("[SocialStats] Erreur lors du rafraîchissement : {}", e.getMessage());
        }
    }

    /** Démarrage de l'application — charge les compteurs dans Redis dès le boot. */
    @Scheduled(initialDelay = 5_000, fixedDelay = Long.MAX_VALUE)
    public void warmCache() {
        log.info("[SocialStats] Chargement initial du cache Redis…");
        stats.reload();
    }
}
