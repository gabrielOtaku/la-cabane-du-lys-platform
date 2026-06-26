package com.cabanedulys.api.repositories;

import com.cabanedulys.api.models.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findByAvailableTrue();
}
