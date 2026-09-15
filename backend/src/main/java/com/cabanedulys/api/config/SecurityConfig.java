package com.cabanedulys.api.config;

import com.cabanedulys.api.security.ApiSecurityErrors;
import com.cabanedulys.api.security.JwtAuthenticationFilter;
import com.cabanedulys.api.security.RateLimitFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Configuration de sécurité de l'API.
 *
 * <ul>
 *   <li>Session portée par un cookie HttpOnly (JWT signé) ; l'API reste sans état côté serveur.</li>
 *   <li>CSRF : SameSite=Lax + vérification de l'origine dans {@link JwtAuthenticationFilter}
 *       (la protection CSRF par jeton de Spring est inutile sans session serveur).</li>
 *   <li>Routes publiques listées explicitement ; {@code /admin/**} exige le rôle ADMIN ;
 *       tout le reste exige une session.</li>
 *   <li>401 / 403 rendus en JSON (RFC 7807) par {@link ApiSecurityErrors}.</li>
 * </ul>
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final RateLimitFilter rateLimitFilter;
    private final UrlBasedCorsConfigurationSource corsSource;
    private final ApiSecurityErrors errors;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter,
                          RateLimitFilter rateLimitFilter,
                          UrlBasedCorsConfigurationSource corsSource,
                          ApiSecurityErrors errors) {
        this.jwtFilter       = jwtFilter;
        this.rateLimitFilter = rateLimitFilter;
        this.corsSource      = corsSource;
        this.errors          = errors;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsSource))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(e -> e
                .authenticationEntryPoint(errors)
                .accessDeniedHandler(errors))
            .authorizeHttpRequests(auth -> auth
                // Session courante : lecture, fermeture, ajout d'une passkey (compte déjà vérifié)
                .requestMatchers("/auth/me", "/auth/logout", "/auth/webauthn/register/**").authenticated()
                // Entrée : lien magique et connexion par passkey
                .requestMatchers("/auth/**").permitAll()
                // Back office
                .requestMatchers("/admin/**").hasRole("ADMIN")
                // Contenu public
                .requestMatchers(HttpMethod.GET,
                        "/episodes/**", "/guests/**", "/shop/drop", "/shop/orders/*/status", "/stats/social").permitAll()
                .requestMatchers("/shop/webhook").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().authenticated()
            )
            // Ordre d'enregistrement important : un filtre ne peut être placé « avant » qu'un filtre déjà enregistré.
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(rateLimitFilter, JwtAuthenticationFilter.class);
        return http.build();
    }

    /**
     * Désactive l'enregistrement automatique des filtres comme servlet filters :
     * ils sont ajoutés manuellement à la chaîne Spring Security ci-dessus.
     */
    @Bean
    public FilterRegistrationBean<RateLimitFilter> rateLimitRegistration() {
        FilterRegistrationBean<RateLimitFilter> reg = new FilterRegistrationBean<>(rateLimitFilter);
        reg.setEnabled(false);
        return reg;
    }

    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> jwtRegistration() {
        FilterRegistrationBean<JwtAuthenticationFilter> reg = new FilterRegistrationBean<>(jwtFilter);
        reg.setEnabled(false);
        return reg;
    }
}
