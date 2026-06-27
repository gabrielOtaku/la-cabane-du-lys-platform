package com.cabanedulys.api.services;

import com.cabanedulys.api.dto.GuestDto;
import com.cabanedulys.api.repositories.GuestRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GuestService {

    private final GuestRepository repo;

    public GuestService(GuestRepository repo) { this.repo = repo; }

    @Cacheable("guests")
    public List<GuestDto> findAll() {
        return repo.findAll().stream().map(GuestDto::from).toList();
    }

    /** À appeler après toute mutation (ajout, modification ou suppression d'invité). */
    @CacheEvict(value = "guests", allEntries = true)
    public void evictAll() {}
}
