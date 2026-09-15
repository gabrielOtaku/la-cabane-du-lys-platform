package com.cabanedulys.api.repositories;

import com.cabanedulys.api.models.Episode;
import com.cabanedulys.api.models.EpisodeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EpisodeRepository extends JpaRepository<Episode, UUID> {

    List<Episode> findAllByStatusOrderByNumberDesc(EpisodeStatus status);

    Optional<Episode> findBySlugAndStatus(String slug, EpisodeStatus status);

    Optional<Episode> findByIdAndStatus(UUID id, EpisodeStatus status);

    long countByStatus(EpisodeStatus status);

    boolean existsByNumber(int number);

    boolean existsByNumberAndIdNot(int number, UUID id);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);

    List<Episode> findAllByGuests_Id(UUID guestId);

    @Query(value = """
            SELECT * FROM episodes
            WHERE status = 'PUBLISHED' AND search_vec @@ plainto_tsquery('french', :q)
            ORDER BY ts_rank(search_vec, plainto_tsquery('french', :q)) DESC
            """, nativeQuery = true)
    List<Episode> search(@Param("q") String q);
}
