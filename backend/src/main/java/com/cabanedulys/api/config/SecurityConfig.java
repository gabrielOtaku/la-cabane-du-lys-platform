package com.cabanedulys.api.config;

import com.cabanedulys.api.security.JwtAuthenticationFilter;
import com.cabanedulys.api.security.RateLimitFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Configuration de sécurité « Zero Trust » (cahier des charges §4).
 * API stateless protégée par JWT ; endpoints publics explicitement listés.
 * RateLimitFilter appliqué en amont du filtre JWT sur les routes sensibles.
 */
@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final RateLimitFilter rateLimitFilter;
    private final UrlBasedCorsConfigurationSource corsSource;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter,
                          RateLimitFilter rateLimitFilter,
                          UrlBasedCorsConfigurationSource corsSource) {
        this.jwtFilter       = jwtFilter;
        this.rateLimitFilter = rateLimitFilter;
        this.corsSource      = corsSource;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsSource))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/episodes/**", "/guests/**", "/shop/drop", "/stats/social").permitAll()
                .requestMatchers("/shop/webhook").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(rateLimitFilter, JwtAuthenticationFilter.class)
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    /**
     * Désactive l'enregistrement automatique de RateLimitFilter comme servlet filter.
     * Il est ajouté manuellement à la chaîne de sécurité Spring ci-dessus.
     */
    @Bean
    public FilterRegistrationBean<RateLimitFilter> rateLimitRegistration() {
        FilterRegistrationBean<RateLimitFilter> reg = new FilterRegistrationBean<>(rateLimitFilter);
        reg.setEnabled(false);
        return reg;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
