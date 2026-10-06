const state = {
  selectedMovie: null,
  selectedSeats: new Set()
};

const movies = [
  { name: "Avatar", genre: "Sci-Fi", price: 220, className: "avatar", icon: "🌌" },
  { name: "Avengers", genre: "Action", price: 250, className: "avengers", icon: "🦸" },
  { name: "Inception", genre: "Sci-Fi", price: 230, className: "inception", icon: "🌀" }
];

const movieGrid = document.getElementById("movieGrid");
const movieCount = document.getElementById("movieCount");
const selectedMovieTitle = document.getElementById("selectedMovieTitle");
const selectedMovieMeta = document.getElementById("selectedMovieMeta");
const seatGrid = document.getElementById("seatGrid");
const seatSummary = document.getElementById("seatSummary");
const totalPrice = document.getElementById("totalPrice");
const bookButton = document.getElementById("bookButton");
const bookingMessage = document.getElementById("bookingMessage");
const showtime = document.getElementById("showtime");

function renderMovies() {
  movieCount.textContent = `${movies.length} movies available`;
  movieGrid.innerHTML = movies.map((movie, index) => `
    <article class="movie-card">
      <div class="poster ${movie.className}">${movie.icon} ${movie.name}</div>
      <div class="movie-body">
        <h3>${movie.name}</h3>
        <p>${movie.genre} · From ₹${movie.price}</p>
        <button class="secondary-btn" onclick="selectMovie(${index})">Book tickets</button>
      </div>
    </article>
  `).join("");
}

function selectMovie(index) {
  state.selectedMovie = movies[index];
  state.selectedSeats.clear();
  selectedMovieTitle.textContent = state.selectedMovie.name;
  selectedMovieMeta.textContent = `${state.selectedMovie.genre} · ₹${state.selectedMovie.price} per ticket`;
  bookingMessage.textContent = "";
  renderSeats();
  updateSummary();
  document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
}

function renderSeats() {
  const seats = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 1; col <= 8; col++) {
      const label = String.fromCharCode(65 + row) + col;
      const unavailable = ["A3", "B6", "C2", "D7", "E4"].includes(label);
      seats.push(`
        <button class="seat-btn ${unavailable ? "unavailable" : ""} ${state.selectedSeats.has(label) ? "selected" : ""}"
          aria-label="Seat ${label}" ${unavailable ? "disabled" : ""}
          onclick="toggleSeat('${label}')">
          <i class="seat"></i>
        </button>
      `);
    }
  }
  seatGrid.innerHTML = seats.join("");
}

function toggleSeat(label) {
  if (!state.selectedMovie) return;
  if (state.selectedSeats.has(label)) {
    state.selectedSeats.delete(label);
  } else {
    state.selectedSeats.add(label);
  }
  renderSeats();
  updateSummary();
}

function updateSummary() {
  const selected = [...state.selectedSeats].sort();
  seatSummary.textContent = selected.length ? selected.join(", ") : "None";
  const total = state.selectedMovie ? selected.length * state.selectedMovie.price : 0;
  totalPrice.textContent = `₹${total}`;
  bookButton.disabled = !state.selectedMovie || selected.length === 0;
}

bookButton.addEventListener("click", () => {
  const selected = [...state.selectedSeats].sort();
  if (!state.selectedMovie || selected.length === 0) return;

  const time = showtime.value;
  bookingMessage.textContent =
    `Booking confirmed! ${state.selectedMovie.name} · ${time} · Seats ${selected.join(", ")} · Total ₹${selected.length * state.selectedMovie.price}`;
});

fetch("/movies")
  .then(response => response.text())
  .then(() => renderMovies())
  .catch(() => renderMovies());

renderMovies();
