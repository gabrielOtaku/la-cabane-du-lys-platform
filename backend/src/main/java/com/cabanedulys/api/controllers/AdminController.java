package com.cabanedulys.api.controllers;

import com.cabanedulys.api.dto.AdminOverviewDto;
import com.cabanedulys.api.models.EpisodeStatus;
import com.cabanedulys.api.models.OrderStatus;
import com.cabanedulys.api.repositories.EpisodeRepository;
import com.cabanedulys.api.repositories.GuestRepository;
import com.cabanedulys.api.repositories.OrderRepository;
import com.cabanedulys.api.repositories.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Back office — premier point d'entrée (phase 7 à venir). Double protection : règle d'URL
 * {@code /admin/**} dans {@code SecurityConfig} et annotation de méthode.
 */
@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final EpisodeRepository episodes;
    private final GuestRepository guests;
    private final UserRepository users;
    private final OrderRepository orders;

    public AdminController(EpisodeRepository episodes, GuestRepository guests,
                           UserRepository users, OrderRepository orders) {
        this.episodes = episodes;
        this.guests = guests;
        this.users = users;
        this.orders = orders;
    }

    @GetMapping("/overview")
    public AdminOverviewDto overview() {
        return new AdminOverviewDto(
                episodes.countByStatus(EpisodeStatus.PUBLISHED),
                episodes.countByStatus(EpisodeStatus.DRAFT),
                guests.count(),
                users.count(),
                orders.countByStatus(OrderStatus.PENDING),
                orders.countByStatus(OrderStatus.PAID));
    }
}
