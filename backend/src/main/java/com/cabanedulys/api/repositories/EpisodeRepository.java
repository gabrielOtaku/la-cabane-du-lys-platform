package com.cabanedulys.api.repositories;

import com.cabanedulys.api.models.Episode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface EpisodeRepository extends JpaRepository<Episode, UUID> {

    List<Episode> findAllByOrderByNumberDesc();

    @Query(value = """
            SELECT * FROM episodes
            WHERE search_vec @@ plainto_tsquery('french', :q)
            ORDER BY ts_rank(search_vec, plainto_tsquery('french', :q)) DESC
            """, nativeQuery = true)
    List<Episode> search(@Param("q") String q);
}
