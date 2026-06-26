package com.cabanedulys.api.controllers;

import com.cabanedulys.api.dto.AuthResponse;
import com.cabanedulys.api.dto.EmailRequest;
import com.cabanedulys.api.dto.WebAuthnVerifyRequest;
import com.cabanedulys.api.services.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Authentification sans mot de passe du Cercle Privé. */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) { this.auth = auth; }

    @PostMapping("/magic-link")
    public AuthResponse magicLink(@Valid @RequestBody EmailRequest req) {
        return auth.magicLink(req.email());
    }

    @PostMapping("/webauthn/register/options")
    public Map<String, Object> registerOptions(@Valid @RequestBody EmailRequest req) {
        return auth.registrationOptions(req.email());
    }

    @PostMapping("/webauthn/register/verify")
    public AuthResponse registerVerify(@RequestBody WebAuthnVerifyRequest req) {
        return auth.verifyRegistration(req);
    }

    @PostMapping("/webauthn/login/options")
    public Map<String, Object> loginOptions(@Valid @RequestBody EmailRequest req) {
        return auth.loginOptions(req.email());
    }

    @PostMapping("/webauthn/login/verify")
    public AuthResponse loginVerify(@RequestBody WebAuthnVerifyRequest req) {
        return auth.verifyLogin(req);
    }
}
