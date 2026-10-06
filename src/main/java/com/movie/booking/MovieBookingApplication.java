package com.movie.booking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class MovieBookingApplication {

    public static void main(String[] args) {
        SpringApplication.run(MovieBookingApplication.class, args);
    }

    @GetMapping("/movies")
    public String movies() {
        return "Available Movies: Avatar, Avengers, Inception";
    }

    @GetMapping("/health")
    public String health() {
        return "Application is UP";
    }
}
