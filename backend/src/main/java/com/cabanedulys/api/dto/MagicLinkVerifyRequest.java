package com.cabanedulys.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Jeton reçu par courriel, renvoyé par la page de callback du site. */
public record MagicLinkVerifyRequest(@NotBlank @Size(max = 128) String token) {}
