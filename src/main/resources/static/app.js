const state={movies:[]};
const $=id=>document.getElementById(id);

async function loadMovies(){
  try{
    const r=await fetch("/api/movies");
    if(!r.ok) throw Error();
    state.movies=await r.json();
    renderMovies();
  }catch(e){
    $("movieGrid").innerHTML='<div class="error-card">Unable to load movies. Please refresh and try again.</div>';
    $("movieCount").textContent="Unavailable";
  }
}

function bannerFor(movie){
  const n=(movie.name||"").toLowerCase();
  if(n.includes("avatar")) return {image:"/banners/avatar.svg",tag:"SCI-FI"};
  if(n.includes("avengers")) return {image:"/banners/avengers.svg",tag:"ACTION"};
  if(n.includes("inception")) return {image:"/banners/inception.svg",tag:"THRILLER"};
  return {image:"/banners/cinema.svg",tag:(movie.genre||"MOVIE").toUpperCase()};
}

function renderMovies(){
  $("movieCount").textContent=state.movies.length+" movies available";
  $("movieGrid").innerHTML=state.movies.map(m=>{
    const b=bannerFor(m);
    return '<article class="movie-card" onclick="goToBooking('+m.id+')">'+
      '<div class="movie-banner"><img src="'+b.image+'" alt="'+esc(m.name)+' banner"><span class="banner-tag">'+esc(b.tag)+'</span></div>'+
      '<div class="movie-body"><div class="movie-meta"><span>'+esc(m.genre)+'</span><strong>₹'+m.price+'</strong></div>'+
      '<h3>'+esc(m.name)+'</h3><p>'+esc(m.description||"A great night at the movies.")+'</p>'+
      '<button class="book-card-btn" onclick="event.stopPropagation();goToBooking('+m.id+')">Select & Book <span>→</span></button></div>'+
      '</article>';
  }).join("");
}

function goToBooking(id){
  window.location.href="/booking.html?movieId="+encodeURIComponent(id);
}

function esc(v){
  return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

loadMovies();