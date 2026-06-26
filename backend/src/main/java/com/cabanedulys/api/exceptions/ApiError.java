package com.cabanedulys.api.exceptions;

import java.time.Instant;

/** Corps d'erreur normalisé renvoyé par l'API. */
public record ApiError(Instant timestamp, int status, String error, String message) {
    public static ApiError of(int status, String error, String message) {
        return new ApiError(Instant.now(), status, error, message);
    }
}
