package com.cabanedulys.api.repositories;

import com.cabanedulys.api.models.DropProduct;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DropProductRepository extends JpaRepository<DropProduct, UUID> {

    @EntityGraph(attributePaths = "product")
    List<DropProduct> findAllByDropIdOrderByDisplayOrderAsc(UUID dropId);

    Optional<DropProduct> findByDropIdAndProductId(UUID dropId, UUID productId);
}
