package com.cabanedulys.api.util;

import java.util.Optional;
import java.util.UUID;

/** Permet aux routes publiques d'accepter un slug humain ou, en repli, un UUID brut. */
public final class SlugUtils {

    private SlugUtils() {}

    public static Optional<UUID> tryParseUuid(String value) {
        try {
            return Optional.of(UUID.fromString(value));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }
}
