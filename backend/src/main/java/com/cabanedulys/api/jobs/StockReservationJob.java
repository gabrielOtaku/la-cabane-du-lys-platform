package com.cabanedulys.api.jobs;

import com.cabanedulys.api.services.ShopService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Libère chaque minute les réservations de stock dont la fenêtre de paiement est passée. */
@Component
public class StockReservationJob {

    private static final Logger log = LoggerFactory.getLogger(StockReservationJob.class);

    private final ShopService shop;

    public StockReservationJob(ShopService shop) {
        this.shop = shop;
    }

    @Scheduled(fixedDelayString = "${app.shop.reservation-sweep-ms:60000}", initialDelay = 30_000)
    public void sweep() {
        try {
            int released = shop.releaseExpiredReservations();
            if (released > 0) log.info("[Réserve] {} réservation(s) expirée(s) libérée(s).", released);
        } catch (Exception e) {
            log.error("[Réserve] Échec du balayage des réservations : {}", e.getMessage());
        }
    }
}
