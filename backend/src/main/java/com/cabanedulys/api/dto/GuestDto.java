package com.cabanedulys.api.dto;

import com.cabanedulys.api.models.Guest;
import java.util.UUID;

public record GuestDto(
        UUID id, String name, String role, String company, String sector,
        String revenue, int employees, String quote, String lesson
) {
    public static GuestDto from(Guest g) {
        return new GuestDto(
                g.getId(), g.getName(), g.getRole(), g.getCompany(),
                g.getSector() == null ? null : g.getSector().name().toLowerCase(),
                g.getRevenue(), g.getEmployees(), g.getQuote(), g.getLesson()
        );
    }
}
