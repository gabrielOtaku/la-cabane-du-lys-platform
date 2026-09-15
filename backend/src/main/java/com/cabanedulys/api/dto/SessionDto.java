package com.cabanedulys.api.dto;

import com.cabanedulys.api.models.User;
import com.cabanedulys.api.security.SessionPrincipal;

/** Session courante telle que vue par le client. Ne contient jamais le jeton. */
public record SessionDto(String email, String role) {

    public static SessionDto from(User user) {
        return new SessionDto(user.getEmail(), user.getRole().name());
    }

    public static SessionDto from(SessionPrincipal principal) {
        return new SessionDto(principal.email(), principal.role());
    }
}
