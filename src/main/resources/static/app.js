const state={movies:[],filter:"all",hero:0};
const $=id=>document.getElementById(id);

async function loadMovies(){
  try{
    const r=await fetch("/api/movies",{cache:"no-store"});
    if(!r.ok)throw Error("API "+r.status);
    state.movies=await r.json();
    renderMovies();
  }catch(e){
    $("movieGrid").innerHTML='<div class="error-card"><strong>Movies could not be loaded.</strong><span>Check the application and database, then refresh.</span><button onclick="loadMovies()">Retry</button></div>';
    $("movieCount").textContent="Unavailable";
  }
}
function bannerFor(movie){
  const n=(movie.name||"").toLowerCase();
  if(n.includes("avatar"))return{image:"/banners/avatar.svg",tag:"SCI-FI"};
  if(n.includes("avengers"))return{image:"/banners/avengers.svg",tag:"ACTION"};
  if(n.includes("inception"))return{image:"/banners/inception.svg",tag:"THRILLER"};
  return{image:"/banners/cinema.svg",tag:(movie.genre||"MOVIE").toUpperCase()};
}
function renderMovies(){
  const filtered=state.movies.filter(m=>state.filter==="all"||(m.genre||"").toLowerCase().includes(state.filter));
  $("movieCount").textContent=filtered.length+" movie"+(filtered.length===1?"":"s");
  if(!filtered.length){$("movieGrid").innerHTML='<div class="error-card"><strong>No movies found</strong><span>Try another genre.</span></div>';return;}
  $("movieGrid").innerHTML=filtered.map(m=>{
    const b=bannerFor(m);
    return '<article class="movie-card" onclick="goToBooking('+m.id+')"><div class="poster-wrap"><img src="'+b.image+'" alt="'+esc(m.name)+'"><span class="poster-tag">'+esc(b.tag)+'</span><button class="quick-book" onclick="event.stopPropagation();goToBooking('+m.id+')">Book</button></div><div class="movie-body"><h3>'+esc(m.name)+'</h3><div class="movie-info"><span>'+esc(m.genre)+'</span><b>₹'+m.price+'</b></div><p>'+esc(m.description||"Book your seats now.")+'</p></div></article>';
  }).join("");
}
function goToBooking(id){window.location.href="/booking.html?movieId="+encodeURIComponent(id);}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function setHero(i){state.hero=i;document.querySelectorAll(".hero-slide").forEach((x,n)=>x.classList.toggle("active",n===i));document.querySelectorAll(".dot").forEach((x,n)=>x.classList.toggle("active",n===i));}
function changeHero(d){setHero((state.hero+d+3)%3);}
document.querySelectorAll(".filter").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));btn.classList.add("active");state.filter=btn.dataset.filter;renderMovies();}));
$("movieSearch").addEventListener("input",e=>{const q=e.target.value.toLowerCase().trim();document.querySelectorAll(".movie-card").forEach(c=>c.style.display=c.textContent.toLowerCase().includes(q)?"":"none");});
setInterval(()=>changeHero(1),6000);
loadMovies();