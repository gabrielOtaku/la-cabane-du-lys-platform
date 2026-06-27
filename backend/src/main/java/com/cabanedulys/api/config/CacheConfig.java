package com.cabanedulys.api.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

/**
 * Cache configuration.
 * - Profil dev (spring.cache.type=simple)  : ConcurrentMapCacheManager auto-configuré.
 * - Profil docker (spring.cache.type=redis) : RedisCacheManager avec TTL par cache.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Active uniquement quand Redis est le cache type (profil docker/prod).
     * Définit un TTL par cache pour éviter les fuites mémoire Redis.
     */
    @Bean
    @ConditionalOnProperty(name = "spring.cache.type", havingValue = "redis")
    public RedisCacheManager redisCacheManager(RedisConnectionFactory factory) {
        var json = new GenericJackson2JsonRedisSerializer();

        RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
                .disableCachingNullValues()
                .serializeKeysWith(SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(SerializationPair.fromSerializer(json));

        return RedisCacheManager.builder(factory)
                .cacheDefaults(defaults.entryTtl(Duration.ofMinutes(30)))
                .withCacheConfiguration("episodes", defaults.entryTtl(Duration.ofMinutes(30)))
                .withCacheConfiguration("guests",   defaults.entryTtl(Duration.ofHours(2)))
                .build();
    }
}
