package com.cabanedulys.api.services;

import com.cabanedulys.api.config.WebAuthnConfig;
import com.cabanedulys.api.dto.AuthResponse;
import com.cabanedulys.api.dto.WebAuthnVerifyRequest;
import com.cabanedulys.api.models.Role;
import com.cabanedulys.api.models.User;
import com.cabanedulys.api.models.WebAuthnCredential;
import com.cabanedulys.api.repositories.UserRepository;
import com.cabanedulys.api.repositories.WebAuthnCredentialRepository;
import com.cabanedulys.api.security.JwtService;
import com.webauthn4j.WebAuthnManager;
import com.webauthn4j.authenticator.AuthenticatorImpl;
import com.webauthn4j.converter.util.ObjectConverter;
import com.webauthn4j.data.*;
import com.webauthn4j.data.attestation.authenticator.AttestedCredentialData;
import com.webauthn4j.data.attestation.authenticator.COSEKey;
import com.webauthn4j.data.client.Origin;
import com.webauthn4j.data.client.challenge.DefaultChallenge;
import com.webauthn4j.server.ServerProperty;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.*;

/**
 * Authentification du Cercle Privé.
 *
 * <p>Deux parcours sans mot de passe :</p>
 * <ul>
 *   <li><b>Lien magique</b> — un courriel signé (ici simplifié pour la démo).</li>
 *   <li><b>WebAuthn / Passkeys</b> — biométrie ou clé physique (cahier des charges §4).</li>
 * </ul>
 */
@Service
public class AuthService {

    private static final String CHALLENGE_KEY = "webauthn:challenge:";
    private static final Duration CHALLENGE_TTL = Duration.ofMinutes(2);

    private final UserRepository users;
    private final WebAuthnCredentialRepository credentials;
    private final JwtService jwt;
    private final WebAuthnConfig webAuthn;
    private final StringRedisTemplate redis;
    private final WebAuthnManager webAuthnManager;
    private final ObjectConverter objectConverter;

    private final SecureRandom random = new SecureRandom();
    private final Base64.Encoder b64url = Base64.getUrlEncoder().withoutPadding();
    private final Base64.Decoder b64urlDec = Base64.getUrlDecoder();

    public AuthService(UserRepository users, WebAuthnCredentialRepository credentials,
                       JwtService jwt, WebAuthnConfig webAuthn, StringRedisTemplate redis) {
        this.users = users;
        this.credentials = credentials;
        this.jwt = jwt;
        this.webAuthn = webAuthn;
        this.redis = redis;
        this.objectConverter = new ObjectConverter();
        this.webAuthnManager = WebAuthnManager.createNonStrictWebAuthnManager();
    }

    /** Lien magique : crée le membre au besoin puis renvoie un jeton (démo). */
    @Transactional
    public AuthResponse magicLink(String email) {
        User user = users.findByEmail(email).orElseGet(() -> users.save(
                User.builder().email(email).role(Role.MEMBER).build()));
        // TODO: au lieu de renvoyer le jeton, envoyer par courriel un lien signé à usage unique.
        return new AuthResponse(jwt.generate(user.getEmail(), user.getRole().name()), user.getEmail());
    }

    // ---------- WebAuthn : enregistrement ----------

    @Transactional
    public Map<String, Object> registrationOptions(String email) {
        User user = users.findByEmail(email).orElseGet(() -> users.save(
                User.builder().email(email).role(Role.MEMBER).build()));
        String challenge = newChallenge(email);

        Map<String, Object> opts = new LinkedHashMap<>();
        opts.put("challenge", challenge);
        opts.put("rp", Map.of("id", webAuthn.getRpId(), "name", webAuthn.getRpName()));
        opts.put("user", Map.of(
                "id", b64url.encodeToString(user.getId().toString().getBytes()),
                "name", user.getEmail(),
                "displayName", user.getDisplayName() == null ? user.getEmail() : user.getDisplayName()));
        opts.put("pubKeyCredParams", List.of(
                Map.of("type", "public-key", "alg", -7),    // ES256
                Map.of("type", "public-key", "alg", -257))); // RS256
        opts.put("timeout", 120000);
        opts.put("attestation", "none");
        opts.put("authenticatorSelection", Map.of(
                "userVerification", "preferred",
                "residentKey", "preferred"));
        return opts;
    }

    @Transactional
    public AuthResponse verifyRegistration(WebAuthnVerifyRequest req) {
        String storedChallenge = popChallenge(req.email());
        User user = users.findByEmail(req.email()).orElseThrow(
                () -> new IllegalStateException("Aucun utilisateur pour " + req.email()));

        byte[] clientDataJSON   = b64urlDec.decode(str(req.response(), "clientDataJSON"));
        byte[] attestationObj   = b64urlDec.decode(str(req.response(), "attestationObject"));

        RegistrationRequest request = new RegistrationRequest(attestationObj, clientDataJSON);

        Set<Origin> origins = Set.of(new Origin(webAuthn.getOrigin()));
        DefaultChallenge challenge = new DefaultChallenge(b64urlDec.decode(storedChallenge));
        ServerProperty serverProperty = new ServerProperty(origins, webAuthn.getRpId(), challenge, null);

        RegistrationParameters params = new RegistrationParameters(serverProperty, null, false, true);

        RegistrationData result = webAuthnManager.validate(request, params);

        AttestedCredentialData acd = result.getAttestationObject()
                .getAuthenticatorData()
                .getAttestedCredentialData();

        String credentialId = b64url.encodeToString(acd.getCredentialId());
        String publicKey    = b64url.encodeToString(
                objectConverter.getCborConverter().writeValueAsBytes(acd.getCOSEKey()));

        credentials.save(WebAuthnCredential.builder()
                .credentialId(credentialId)
                .publicKey(publicKey)
                .user(user)
                .build());

        return new AuthResponse(jwt.generate(user.getEmail(), user.getRole().name()), user.getEmail());
    }

    // ---------- WebAuthn : connexion ----------

    public Map<String, Object> loginOptions(String email) {
        String challenge = newChallenge(email);
        List<Map<String, String>> allow = credentials.findByUserEmail(email).stream()
                .map(c -> Map.of("type", "public-key", "id", c.getCredentialId())).toList();

        Map<String, Object> opts = new LinkedHashMap<>();
        opts.put("challenge", challenge);
        opts.put("rpId", webAuthn.getRpId());
        opts.put("allowCredentials", allow);
        opts.put("userVerification", "preferred");
        opts.put("timeout", 120000);
        return opts;
    }

    @Transactional
    public AuthResponse verifyLogin(WebAuthnVerifyRequest req) {
        String storedChallenge = popChallenge(req.email());

        WebAuthnCredential cred = credentials.findByCredentialId(req.rawId())
                .orElseThrow(() -> new IllegalStateException("Authentificateur inconnu."));

        byte[] clientDataJSON    = b64urlDec.decode(str(req.response(), "clientDataJSON"));
        byte[] authenticatorData = b64urlDec.decode(str(req.response(), "authenticatorData"));
        byte[] signature         = b64urlDec.decode(str(req.response(), "signature"));
        byte[] credentialId      = b64urlDec.decode(req.rawId());

        Object uh = req.response().get("userHandle");
        byte[] userHandle = (uh != null && !uh.toString().isEmpty()) ? b64urlDec.decode(uh.toString()) : null;

        AuthenticationRequest request = new AuthenticationRequest(
                credentialId, userHandle, authenticatorData, clientDataJSON, signature);

        Set<Origin> origins = Set.of(new Origin(webAuthn.getOrigin()));
        DefaultChallenge challenge = new DefaultChallenge(b64urlDec.decode(storedChallenge));
        ServerProperty serverProperty = new ServerProperty(origins, webAuthn.getRpId(), challenge, null);

        COSEKey coseKey = objectConverter.getCborConverter()
                .readValue(b64urlDec.decode(cred.getPublicKey()), COSEKey.class);
        AttestedCredentialData acd = new AttestedCredentialData(null, credentialId, coseKey);
        AuthenticatorImpl authenticator = new AuthenticatorImpl(acd, null, cred.getSignatureCount());

        AuthenticationParameters params = new AuthenticationParameters(serverProperty, authenticator, null, false, true);

        AuthenticationData result = webAuthnManager.validate(request, params);

        cred.setSignatureCount(result.getAuthenticatorData().getSignCount());
        User user = cred.getUser();
        return new AuthResponse(jwt.generate(user.getEmail(), user.getRole().name()), user.getEmail());
    }

    // ---------- utilitaires ----------

    private String newChallenge(String email) {
        byte[] buf = new byte[32];
        random.nextBytes(buf);
        String challenge = b64url.encodeToString(buf);
        redis.opsForValue().set(CHALLENGE_KEY + email, challenge, CHALLENGE_TTL);
        return challenge;
    }

    private String popChallenge(String email) {
        String key = CHALLENGE_KEY + email;
        String challenge = redis.opsForValue().get(key);
        if (challenge == null) throw new IllegalStateException("Challenge expiré ou introuvable pour " + email);
        redis.delete(key);
        return challenge;
    }

    private static String str(Map<String, Object> map, String field) {
        Object v = map.get(field);
        if (v == null) throw new IllegalArgumentException("Champ manquant : " + field);
        return v.toString();
    }
}
