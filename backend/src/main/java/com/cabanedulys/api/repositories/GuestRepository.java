package com.cabanedulys.api.repositories;

import com.cabanedulys.api.models.Guest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface GuestRepository extends JpaRepository<Guest, UUID> {
}
