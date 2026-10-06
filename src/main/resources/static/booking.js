const fallbackMovies=[
  {id:1,name:"Avatar",genre:"Sci-Fi",price:250,description:"Experience an extraordinary journey beyond the stars."},
  {id:2,name:"Avengers",genre:"Action",price:220,description:"Assemble for an unforgettable superhero movie night."},
  {id:3,name:"Inception",genre:"Thriller",price:200,description:"Enter a world where every level changes the story."}
];

const state={movies:[],selectedMovie:null,selectedSeats:new Set(),submitting:false,apiAvailable:false};
const $=id=>document.getElementById(id);
const unavailable=new Set(["A3","B6","C2","D7","E4"]);

function bannerFor(movie){
  const n=(movie.name||"").toLowerCase();
  if(n.includes("avatar")) return "/banners/avatar.svg";
  if(n.includes("avengers")) return "/banners/avengers.svg";
  if(n.includes("inception")) return "/banners/inception.svg";
  return "/banners/cinema.svg";
}

async function init(){
  try{
    const r=await fetch("/api/movies",{cache:"no-store"});
    if(!r.ok)throw Error("API "+r.status);
    const data=await r.json();
    if(!Array.isArray(data)||!data.length)throw Error("No movies returned");
    state.movies=data;
    state.apiAvailable=true;
  }catch(e){
    console.warn("Movie API unavailable. Using local movie metadata for the booking UI.",e);
    state.movies=fallbackMovies;
    state.apiAvailable=false;
  }

  const id=Number(new URLSearchParams(location.search).get("movieId"));
  state.selectedMovie=state.movies.find(m=>m.id===id)||state.movies[0];

  if(!state.selectedMovie){
    $("selectedMovieTitle").textContent="Movie unavailable";
    $("selectedMovieMeta").textContent="Please return to the movies page and try again.";
    return;
  }

  $("selectedMovieTitle").textContent=state.selectedMovie.name;
  $("selectedMovieMeta").textContent=state.selectedMovie.genre+" · ₹"+state.selectedMovie.price+" per ticket";
  $("selectedMovieBanner").src=bannerFor(state.selectedMovie);
  $("selectedMovieBanner").alt=state.selectedMovie.name+" poster";
  renderSeats();
  updateSummary();
}

function renderSeats(){
  let html="";
  for(let r=0;r<5;r++)for(let c=1;c<=8;c++){
    const s=String.fromCharCode(65+r)+c,b=unavailable.has(s);
    html+='<button class="seat-btn '+(b?"unavailable ":"")+(state.selectedSeats.has(s)?"selected":"")+'" '+(b?"disabled":"")+' onclick="toggleSeat(''+s+'')" aria-label="Seat '+s+'"><i class="seat"></i></button>';
  }
  $("seatGrid").innerHTML=html;
}

function toggleSeat(s){
  if(state.selectedSeats.has(s))state.selectedSeats.delete(s);
  else if(state.selectedSeats.size<6)state.selectedSeats.add(s);
  else return toast("You can select up to 6 seats.");
  renderSeats();
  updateSummary();
}

function updateSummary(){
  const seats=[...state.selectedSeats].sort();
  $("seatSummary").textContent=seats.length?seats.join(", "):"None";
  $("ticketCount").textContent=seats.length;
  $("totalPrice").textContent="₹"+(state.selectedMovie?seats.length*state.selectedMovie.price:0);
  $("bookButton").disabled=!state.selectedMovie||!seats.length||state.submitting;
}

async function submitBooking(){
  if(!state.selectedMovie||!state.selectedSeats.size||state.submitting)return;
  const name=$("customerName").value.trim(),email=$("email").value.trim();
  if(!name)return toast("Please enter your full name.");
  if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return toast("Please enter a valid email.");

  state.submitting=true;
  updateSummary();
  $("bookButton").textContent="Booking…";

  try{
    const r=await fetch("/api/bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      movieId:state.selectedMovie.id,
      customerName:name,
      email,
      showTime:$("showtime").value,
      seats:[...state.selectedSeats].sort()
    })});
    const data=await r.json();
    if(!r.ok)throw Error(data.message||"Booking failed");
    $("bookingMessage").innerHTML="✓ Booking confirmed! <b>#"+data.bookingId+"</b> · "+esc(state.selectedMovie.name)+" · "+esc(data.showTime)+" · Seats "+esc(data.seats.join(", "))+" · ₹"+data.totalAmount;
    toast("Booking confirmed successfully!");
    state.selectedSeats.clear();
    renderSeats();
    updateSummary();
  }catch(e){
    toast(e.message||"Booking failed. Please try again.");
  }finally{
    state.submitting=false;
    $("bookButton").textContent="Confirm Booking →";
    updateSummary();
  }
}

function toast(m){
  const t=$("toast");
  t.textContent=m;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),3200);
}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",""":"&quot;","'":"&#039;"}[c]));}
$("bookButton").addEventListener("click",submitBooking);
init();