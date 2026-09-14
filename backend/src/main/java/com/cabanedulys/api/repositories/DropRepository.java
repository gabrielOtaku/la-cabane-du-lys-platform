package com.cabanedulys.api.repositories;

import com.cabanedulys.api.models.Drop;
import com.cabanedulys.api.models.DropLifecycle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DropRepository extends JpaRepository<Drop, UUID> {
    List<Drop> findAllByLifecycle(DropLifecycle lifecycle);
    Optional<Drop> findBySlug(String slug);
    boolean existsBySlug(String slug);
    boolean existsBySlugAndIdNot(String slug, UUID id);
}
