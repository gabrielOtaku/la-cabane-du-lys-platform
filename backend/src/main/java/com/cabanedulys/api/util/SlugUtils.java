package com.cabanedulys.api.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Predicate;

/** Slugs humains, stables et uniques ; les routes publiques acceptent aussi un UUID brut en repli. */
public final class SlugUtils {

    private SlugUtils() {}

    public static Optional<UUID> tryParseUuid(String value) {
        try {
            return Optional.of(UUID.fromString(value));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    /** « Régis Lapierre Girard & Corentin — Web-Icom » → « regis-lapierre-girard-corentin-web-icom ». */
    public static String slugify(String input) {
        if (input == null) return "";
        String n = Normalizer.normalize(input, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        n = n.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-+|-+$)", "");
        return n.length() > 150 ? n.substring(0, 150) : n;
    }

    /** Ajoute -2, -3… tant que {@code taken} est vrai. */
    public static String unique(String base, Predicate<String> taken) {
        String root = base.isBlank() ? "element" : base;
        String candidate = root;
        int i = 2;
        while (taken.test(candidate)) {
            candidate = root + "-" + i++;
        }
        return candidate;
    }
}
