package com.cabanedulys.api.services;

import com.cabanedulys.api.models.User;
import com.cabanedulys.api.security.JwtService;
import com.cabanedulys.api.security.SessionCookieService;
import com.cabanedulys.api.security.SessionPrincipal;
import com.cabanedulys.api.security.TokenDenylist;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

/** Ouverture et fermeture de session : jeton signé dans un cookie HttpOnly, révocation à la sortie. */
@Service
public class SessionService {

    private final JwtService jwt;
    private final SessionCookieService cookies;
    private final TokenDenylist denylist;

    public SessionService(JwtService jwt, SessionCookieService cookies, TokenDenylist denylist) {
        this.jwt = jwt;
        this.cookies = cookies;
        this.denylist = denylist;
    }

    public ResponseCookie open(User user) {
        String token = jwt.generate(user.getEmail(), user.getRole().name());
        return cookies.issue(token, jwt.expiration());
    }

    public ResponseCookie close(SessionPrincipal principal) {
        if (principal != null) {
            Duration remaining = principal.expiresAt() == null
                    ? jwt.expiration()
                    : Duration.between(Instant.now(), principal.expiresAt());
            denylist.revoke(principal.jti(), remaining);
        }
        return cookies.clear();
    }
}
