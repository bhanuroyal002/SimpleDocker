CREATE TABLE IF NOT EXISTS movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    genre VARCHAR(100) NOT NULL,
    price INT NOT NULL,
    description VARCHAR(500),
    available BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    customer_name VARCHAR(80) NOT NULL,
    email VARCHAR(160) NOT NULL,
    show_time VARCHAR(30) NOT NULL,
    seats VARCHAR(200) NOT NULL,
    total_amount INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_movie FOREIGN KEY (movie_id) REFERENCES movies(id)
);