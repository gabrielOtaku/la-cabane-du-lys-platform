package com.cabanedulys.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * La Cabane du Lys — API.
 * @EnableScheduling : support des tâches planifiées (compteurs sociaux, cf. cahier des charges §6.2).
 */
@SpringBootApplication
@EnableScheduling
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
