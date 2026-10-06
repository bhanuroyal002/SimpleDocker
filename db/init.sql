CREATE TABLE IF NOT EXISTS movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    available BOOLEAN DEFAULT TRUE
);

INSERT INTO movies (name, genre, available)
VALUES
('Avatar', 'Sci-Fi', TRUE),
('Avengers', 'Action', TRUE),
('Inception', 'Sci-Fi', TRUE);
