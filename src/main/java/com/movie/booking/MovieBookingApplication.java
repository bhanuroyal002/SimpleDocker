package com.movie.booking;

import java.util.List;
import java.util.Map;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@SpringBootApplication
@RestController
@RequestMapping("/api")
public class MovieBookingApplication {
    private final JdbcTemplate jdbc;
    public MovieBookingApplication(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public static void main(String[] args) { SpringApplication.run(MovieBookingApplication.class, args); }

    @GetMapping("/movies")
    public List<Map<String, Object>> movies() {
        return jdbc.queryForList("SELECT id, name, genre, price, description FROM movies WHERE available = TRUE ORDER BY id");
    }

    @PostMapping("/bookings")
    public ResponseEntity<Map<String, Object>> createBooking(@Valid @RequestBody BookingRequest request) {
        if (request.seats().size() > 6) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum 6 seats per booking");
        Integer price = jdbc.queryForObject("SELECT price FROM movies WHERE id = ? AND available = TRUE", Integer.class, request.movieId());
        if (price == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found");
        int total = price * request.seats().size();
        jdbc.update("INSERT INTO bookings (movie_id, customer_name, email, show_time, seats, total_amount) VALUES (?, ?, ?, ?, ?, ?)",
            request.movieId(), request.customerName().trim(), request.email().trim().toLowerCase(), request.showTime(), String.join(",", request.seats()), total);
        Long bookingId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("bookingId", bookingId, "movieId", request.movieId(),
            "customerName", request.customerName().trim(), "showTime", request.showTime(), "seats", request.seats(),
            "totalAmount", total, "message", "Booking confirmed"));
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        jdbc.queryForObject("SELECT 1", Integer.class);
        return Map.of("status", "UP", "service", "movie-ticket-booking");
    }

    public record BookingRequest(
        int movieId,
        @NotBlank @Size(max = 80) String customerName,
        @NotBlank @Email @Size(max = 160) String email,
        @NotBlank String showTime,
        @NotEmpty List<@NotBlank String> seats
    ) {}
}