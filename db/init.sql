CREATE TABLE IF NOT EXISTS movies (
 id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE, genre VARCHAR(100) NOT NULL,
 price INT NOT NULL, description VARCHAR(500), available BOOLEAN DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS bookings (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, movie_id INT NOT NULL, customer_name VARCHAR(80) NOT NULL,
 email VARCHAR(160) NOT NULL, show_time VARCHAR(30) NOT NULL, seats VARCHAR(200) NOT NULL,
 total_amount INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_booking_movie FOREIGN KEY (movie_id) REFERENCES movies(id)
);
INSERT INTO movies (name, genre, price, description, available) VALUES
('Avatar','Sci-Fi',220,'An epic journey through the world of Pandora.',TRUE),
('Avengers','Action',250,'Earths mightiest heroes unite for an unforgettable battle.',TRUE),
('Inception','Sci-Fi',230,'Enter a world where dreams can become reality.',TRUE)
ON DUPLICATE KEY UPDATE genre=VALUES(genre),price=VALUES(price),description=VALUES(description),available=VALUES(available);