package com.movie.booking;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(MovieBookingApplication.class)
class MovieBookingApplicationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JdbcTemplate jdbc;

    @Test
    void moviesReturnsAvailableMovies() throws Exception {
        when(jdbc.queryForList(
                "SELECT id, name, genre, price, description FROM movies WHERE available = TRUE ORDER BY id"))
                .thenReturn(List.of(
                        Map.of(
                                "id", 1,
                                "name", "Avatar",
                                "genre", "Sci-Fi",
                                "price", 220,
                                "description", "An epic journey through the world of Pandora.")));

        mockMvc.perform(get("/api/movies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Avatar"))
                .andExpect(jsonPath("$[0].price").value(220));
    }

    @Test
    void healthReturnsUpWhenDatabaseIsAvailable() throws Exception {
        when(jdbc.queryForObject("SELECT 1", Integer.class)).thenReturn(1);

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("movie-ticket-booking"));
    }

    @Test
    void createBookingReturnsConfirmation() throws Exception {
        when(jdbc.queryForObject(
                "SELECT price FROM movies WHERE id = ? AND available = TRUE",
                Integer.class,
                1))
                .thenReturn(220);
        when(jdbc.update(
                eq("INSERT INTO bookings (movie_id, customer_name, email, show_time, seats, total_amount) VALUES (?, ?, ?, ?, ?, ?)"),
                eq(1), eq("Bhanu"), eq("bhanu@example.com"), eq("18:30"),
                eq("A1,A2"), eq(440)))
                .thenReturn(1);
        when(jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class)).thenReturn(101L);

        String request = """
                {
                  "movieId": 1,
                  "customerName": "  Bhanu  ",
                  "email": "  BHANU@EXAMPLE.COM  ",
                  "showTime": "18:30",
                  "seats": ["A1", "A2"]
                }
                """;

        mockMvc.perform(post("/api/bookings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bookingId").value(101))
                .andExpect(jsonPath("$.customerName").value("Bhanu"))
                .andExpect(jsonPath("$.showTime").value("18:30"))
                .andExpect(jsonPath("$.totalAmount").value(440))
                .andExpect(jsonPath("$.message").value("Booking confirmed"));
    }

    @Test
    void createBookingRejectsMoreThanSixSeats() throws Exception {
        String request = """
                {
                  "movieId": 1,
                  "customerName": "Bhanu",
                  "email": "bhanu@example.com",
                  "showTime": "18:30",
                  "seats": ["A1", "A2", "A3", "A4", "A5", "A6", "A7"]
                }
                """;

        mockMvc.perform(post("/api/bookings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createBookingReturnsNotFoundForUnavailableMovie() throws Exception {
        when(jdbc.queryForObject(
                "SELECT price FROM movies WHERE id = ? AND available = TRUE",
                Integer.class,
                999))
                .thenReturn(null);

        String request = """
                {
                  "movieId": 999,
                  "customerName": "Bhanu",
                  "email": "bhanu@example.com",
                  "showTime": "18:30",
                  "seats": ["A1"]
                }
                """;

        mockMvc.perform(post("/api/bookings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isNotFound());
    }

    @Test
    void createBookingRejectsInvalidCustomerData() throws Exception {
        String request = """
                {
                  "movieId": 1,
                  "customerName": "",
                  "email": "not-an-email",
                  "showTime": "",
                  "seats": []
                }
                """;

        mockMvc.perform(post("/api/bookings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isBadRequest());
    }
}
