package com.cabanedulys.api.exceptions;

/** Levée quand une route existe mais est désactivée par configuration (feature flag). */
public class FeatureDisabledException extends RuntimeException {
    public FeatureDisabledException(String message) {
        super(message);
    }
}
