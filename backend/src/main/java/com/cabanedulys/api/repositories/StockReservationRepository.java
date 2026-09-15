package com.cabanedulys.api.repositories;

import com.cabanedulys.api.models.ReservationStatus;
import com.cabanedulys.api.models.StockReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface StockReservationRepository extends JpaRepository<StockReservation, UUID> {

    @Query("select coalesce(sum(r.quantity), 0L) from StockReservation r "
         + "where r.product.id = :productId and r.status = :status")
    long sumQuantityByProductAndStatus(@Param("productId") UUID productId,
                                       @Param("status") ReservationStatus status);

    @Query("select coalesce(sum(r.quantity), 0L) from StockReservation r "
         + "where r.user.id = :userId and r.product.id = :productId and r.status in :statuses")
    long sumQuantityByUserAndProduct(@Param("userId") UUID userId,
                                     @Param("productId") UUID productId,
                                     @Param("statuses") Collection<ReservationStatus> statuses);

    List<StockReservation> findAllByOrderId(UUID orderId);

    List<StockReservation> findAllByStatusAndExpiresAtBefore(ReservationStatus status, Instant before);
}
