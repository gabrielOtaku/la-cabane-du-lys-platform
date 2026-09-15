package com.cabanedulys.api.dto;

import com.cabanedulys.api.models.Guest;
import java.util.UUID;

public record GuestDto(
        UUID id, String slug, String name, String role, String company, String companyUrl,
        String city, String region, String category, String angle, String bio,
        String photoUrl, String quote, boolean featured
) {
    public static GuestDto from(Guest g) {
        return new GuestDto(
                g.getId(), g.getSlug(), g.getName(), g.getRole(), g.getCompany(), g.getCompanyUrl(),
                g.getCity(), g.getRegion(), g.getCategory(), g.getAngle(), g.getBio(),
                g.getPhotoUrl(), g.getQuote(), g.isFeatured()
        );
    }
}
