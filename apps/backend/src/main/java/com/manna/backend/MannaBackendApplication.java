package com.manna.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MannaBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(MannaBackendApplication.class, args);
    }

}
