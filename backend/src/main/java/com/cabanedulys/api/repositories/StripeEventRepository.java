package com.cabanedulys.api.repositories;

import com.cabanedulys.api.models.StripeEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StripeEventRepository extends JpaRepository<StripeEvent, String> {}
