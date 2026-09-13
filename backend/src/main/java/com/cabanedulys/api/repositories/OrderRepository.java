package com.cabanedulys.api.repositories;

import com.cabanedulys.api.models.Order;
import com.cabanedulys.api.models.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    Optional<Order> findByStripeReference(String stripeReference);
    long countByStatus(OrderStatus status);
}
