package com.cabanedulys.api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;

/**
 * Réponses 401 / 403 au format RFC 7807, identiques à celles du {@code GlobalExceptionHandler}.
 * Utilisé par Spring Security (entry point + access denied) et par les filtres maison.
 */
@Component
public class ApiSecurityErrors implements AuthenticationEntryPoint, AccessDeniedHandler {

    private static final String BASE_TYPE = "https://cabanedulys.ca/errors/";

    private final ObjectMapper mapper;

    public ApiSecurityErrors(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        write(response, HttpStatus.UNAUTHORIZED, "Unauthorized",
                "Authentification requise.", "unauthorized");
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        write(response, HttpStatus.FORBIDDEN, "Forbidden",
                "Vous n'avez pas les droits nécessaires pour cette action.", "forbidden");
    }

    public void write(HttpServletResponse response, HttpStatus status, String title,
                      String detail, String typeSlug) throws IOException {
        if (response.isCommitted()) return;
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
        pd.setTitle(title);
        pd.setType(URI.create(BASE_TYPE + typeSlug));
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        mapper.writeValue(response.getWriter(), pd);
    }
}
