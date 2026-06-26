package com.cabanedulys.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Requête ne portant qu'un courriel (lien magique, options WebAuthn). */
public record EmailRequest(@NotBlank @Email String email) {}
