package com.cabanedulys.api.dto;

/** Réponse d'authentification : jeton JWT de session. */
public record AuthResponse(String token, String email) {}
