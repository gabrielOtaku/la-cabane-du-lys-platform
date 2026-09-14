package com.cabanedulys.api;

import com.cabanedulys.api.config.WebAuthnConfig;
import com.cabanedulys.api.dto.WebAuthnVerifyRequest;
import com.cabanedulys.api.models.Role;
import com.cabanedulys.api.models.User;
import com.cabanedulys.api.repositories.UserRepository;
import com.cabanedulys.api.repositories.WebAuthnCredentialRepository;
import com.cabanedulys.api.services.AuthService;
import com.webauthn4j.data.AttestationConveyancePreference;
import com.webauthn4j.data.AuthenticatorAssertionResponse;
import com.webauthn4j.data.AuthenticatorAttestationResponse;
import com.webauthn4j.data.AuthenticatorSelectionCriteria;
import com.webauthn4j.data.PublicKeyCredential;
import com.webauthn4j.data.PublicKeyCredentialCreationOptions;
import com.webauthn4j.data.PublicKeyCredentialDescriptor;
import com.webauthn4j.data.PublicKeyCredentialParameters;
import com.webauthn4j.data.PublicKeyCredentialRequestOptions;
import com.webauthn4j.data.PublicKeyCredentialRpEntity;
import com.webauthn4j.data.PublicKeyCredentialType;
import com.webauthn4j.data.PublicKeyCredentialUserEntity;
import com.webauthn4j.data.ResidentKeyRequirement;
import com.webauthn4j.data.UserVerificationRequirement;
import com.webauthn4j.data.attestation.statement.COSEAlgorithmIdentifier;
import com.webauthn4j.data.client.Origin;
import com.webauthn4j.data.client.challenge.DefaultChallenge;
import com.webauthn4j.test.EmulatorUtil;
import com.webauthn4j.test.client.ClientPlatform;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Flux passkey complet (enregistrement puis connexion sans courriel) avec l'authentificateur
 * émulé de WebAuthn4J : aucun navigateur requis. Redis est remplacé par une table en mémoire,
 * ce qui vérifie aussi que chaque défi n'est consommable qu'une seule fois.
 */
@SpringBootTest
@ActiveProfiles("dev")
class WebAuthnFlowTest {

    @Autowired AuthService auth;
    @Autowired UserRepository users;
    @Autowired WebAuthnCredentialRepository credentials;
    @Autowired WebAuthnConfig config;

    @MockitoBean StringRedisTemplate redis;

    private final Map<String, String> store = new ConcurrentHashMap<>();
    private final Base64.Encoder b64url = Base64.getUrlEncoder().withoutPadding();
    private final Base64.Decoder b64urlDec = Base64.getUrlDecoder();

    @BeforeEach
    @SuppressWarnings("unchecked")
    void redisInMemory() {
        ValueOperations<String, String> ops = mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(ops);
        doAnswer(i -> { store.put(i.getArgument(0), i.getArgument(1)); return null; })
                .when(ops).set(anyString(), anyString(), any(Duration.class));
        when(ops.get(anyString())).thenAnswer(i -> store.get(i.getArgument(0, String.class)));
        when(redis.delete(anyString())).thenAnswer(i -> store.remove(i.getArgument(0, String.class)) != null);
    }

    @Test
    void register_thenLogin_withEmulatedAuthenticator() {
        String email = "passkey-" + System.nanoTime() + "@test.local";
        User user = users.save(User.builder().email(email).role(Role.MEMBER).build());

        ClientPlatform client = EmulatorUtil.createClientPlatform();
        client.setOrigin(new Origin(config.getOrigin()));

        // --- enregistrement : le serveur émet un défi, l'authentificateur répond ---
        Map<String, Object> reg = auth.registrationOptions(email);
        String regChallengeId = (String) reg.get("challengeId");
        PublicKeyCredentialCreationOptions creation = new PublicKeyCredentialCreationOptions(
                new PublicKeyCredentialRpEntity(config.getRpId(), "La Cabane du Lys"),
                new PublicKeyCredentialUserEntity(user.getId().toString().getBytes(StandardCharsets.UTF_8), email, email),
                new DefaultChallenge(b64urlDec.decode((String) reg.get("challenge"))),
                List.of(new PublicKeyCredentialParameters(PublicKeyCredentialType.PUBLIC_KEY, COSEAlgorithmIdentifier.ES256)),
                120000L, List.of(), new AuthenticatorSelectionCriteria(null, ResidentKeyRequirement.PREFERRED, UserVerificationRequirement.PREFERRED),
                AttestationConveyancePreference.NONE, null);
        PublicKeyCredential<AuthenticatorAttestationResponse, ?> created = client.create(creation);
        AuthenticatorAttestationResponse att = created.getResponse();

        Map<String, Object> attResponse = new HashMap<>();
        attResponse.put("clientDataJSON", b64url.encodeToString(att.getClientDataJSON()));
        attResponse.put("attestationObject", b64url.encodeToString(att.getAttestationObject()));
        WebAuthnVerifyRequest regReq = new WebAuthnVerifyRequest(
                regChallengeId, created.getId(), b64url.encodeToString(created.getRawId()), "public-key", attResponse);

        assertThat(auth.verifyRegistration(email, regReq).getEmail()).isEqualTo(email);
        assertThat(credentials.findByUserEmail(email)).hasSize(1);

        // Le même défi ne peut pas être rejoué.
        assertThatThrownBy(() -> auth.verifyRegistration(email, regReq)).isInstanceOf(RuntimeException.class);

        // --- connexion : sans courriel, l'authentificateur désigne le compte ---
        Map<String, Object> login = auth.loginOptions();
        PublicKeyCredentialRequestOptions request = new PublicKeyCredentialRequestOptions(
                new DefaultChallenge(b64urlDec.decode((String) login.get("challenge"))),
                120000L, config.getRpId(),
                List.of(new PublicKeyCredentialDescriptor(PublicKeyCredentialType.PUBLIC_KEY, created.getRawId(), null)),
                UserVerificationRequirement.PREFERRED, null);
        PublicKeyCredential<AuthenticatorAssertionResponse, ?> assertion = client.get(request);
        AuthenticatorAssertionResponse asr = assertion.getResponse();

        Map<String, Object> asrResponse = new HashMap<>();
        asrResponse.put("clientDataJSON", b64url.encodeToString(asr.getClientDataJSON()));
        asrResponse.put("authenticatorData", b64url.encodeToString(asr.getAuthenticatorData()));
        asrResponse.put("signature", b64url.encodeToString(asr.getSignature()));
        asrResponse.put("userHandle", asr.getUserHandle() == null ? "" : b64url.encodeToString(asr.getUserHandle()));
        WebAuthnVerifyRequest loginReq = new WebAuthnVerifyRequest(
                (String) login.get("challengeId"), assertion.getId(), b64url.encodeToString(assertion.getRawId()), "public-key", asrResponse);

        assertThat(auth.verifyLogin(loginReq).getEmail()).isEqualTo(email);

        // Rejeu de la même assertion : le défi a été consommé.
        assertThatThrownBy(() -> auth.verifyLogin(loginReq)).isInstanceOf(RuntimeException.class);
    }

    @Test
    void login_withTamperedSignature_isRefused() {
        String email = "passkey-tamper-" + System.nanoTime() + "@test.local";
        User user = users.save(User.builder().email(email).role(Role.MEMBER).build());
        ClientPlatform client = EmulatorUtil.createClientPlatform();
        client.setOrigin(new Origin(config.getOrigin()));

        Map<String, Object> reg = auth.registrationOptions(email);
        PublicKeyCredential<AuthenticatorAttestationResponse, ?> created = client.create(new PublicKeyCredentialCreationOptions(
                new PublicKeyCredentialRpEntity(config.getRpId(), "La Cabane du Lys"),
                new PublicKeyCredentialUserEntity(user.getId().toString().getBytes(StandardCharsets.UTF_8), email, email),
                new DefaultChallenge(b64urlDec.decode((String) reg.get("challenge"))),
                List.of(new PublicKeyCredentialParameters(PublicKeyCredentialType.PUBLIC_KEY, COSEAlgorithmIdentifier.ES256)),
                120000L, List.of(), new AuthenticatorSelectionCriteria(null, ResidentKeyRequirement.PREFERRED, UserVerificationRequirement.PREFERRED),
                AttestationConveyancePreference.NONE, null));
        auth.verifyRegistration(email, new WebAuthnVerifyRequest((String) reg.get("challengeId"), created.getId(),
                b64url.encodeToString(created.getRawId()), "public-key", Map.of(
                        "clientDataJSON", b64url.encodeToString(created.getResponse().getClientDataJSON()),
                        "attestationObject", b64url.encodeToString(created.getResponse().getAttestationObject()))));

        Map<String, Object> login = auth.loginOptions();
        PublicKeyCredential<AuthenticatorAssertionResponse, ?> assertion = client.get(new PublicKeyCredentialRequestOptions(
                new DefaultChallenge(b64urlDec.decode((String) login.get("challenge"))), 120000L, config.getRpId(),
                List.of(new PublicKeyCredentialDescriptor(PublicKeyCredentialType.PUBLIC_KEY, created.getRawId(), null)),
                UserVerificationRequirement.PREFERRED, null));
        byte[] signature = assertion.getResponse().getSignature().clone();
        signature[signature.length - 1] ^= 0x01;

        WebAuthnVerifyRequest tampered = new WebAuthnVerifyRequest((String) login.get("challengeId"), assertion.getId(),
                b64url.encodeToString(assertion.getRawId()), "public-key", Map.of(
                        "clientDataJSON", b64url.encodeToString(assertion.getResponse().getClientDataJSON()),
                        "authenticatorData", b64url.encodeToString(assertion.getResponse().getAuthenticatorData()),
                        "signature", b64url.encodeToString(signature)));

        assertThatThrownBy(() -> auth.verifyLogin(tampered)).isInstanceOf(RuntimeException.class);
    }
}
