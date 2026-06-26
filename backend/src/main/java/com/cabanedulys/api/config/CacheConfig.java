package com.cabanedulys.api.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

/**
 * Active la mise en cache (cahier des charges §3.2 / infra Redis).
 * En développement : cache mémoire simple. En Docker/production : Redis.
 */
@Configuration
@EnableCaching
public class CacheConfig {
}
