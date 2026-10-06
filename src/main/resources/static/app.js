const state={movies:[],filter:"all",hero:0};
const $=id=>document.getElementById(id);

function bannerFor(movie){
  const n=(movie.name||"").toLowerCase();
  if(n.includes("avatar"))return{image:"/banners/avatar.svg",tag:"SCI-FI"};
  if(n.includes("avengers"))return{image:"/banners/avengers.svg",tag:"ACTION"};
  if(n.includes("inception"))return{image:"/banners/inception.svg",tag:"THRILLER"};
  return{image:"/banners/cinema.svg",tag:(movie.genre||"MOVIE").toUpperCase()};
}

async function loadMovies(){
  try{
    const r=await fetch("/api/movies",{cache:"no-store"});
    if(!r.ok)throw Error("API "+r.status);
    state.movies=await r.json();
    renderMovies();
    renderHero();
    renderQuickMovie();
  }catch(e){
    $("movieGrid").innerHTML='<div class="error-card"><strong>Movies could not be loaded.</strong><span>Check the application and database, then refresh.</span><button onclick="loadMovies()">Retry</button></div>';
    $("movieCount").textContent="Unavailable";
  }
}

function renderHero(){
  if(!state.movies.length)return;
  const movie=state.movies[state.hero%state.movies.length];
  const b=bannerFor(movie);
  $("heroBackdrop").style.backgroundImage="url('"+b.image+"')";
  $("heroPoster").src=b.image;
  $("heroPoster").alt=movie.name+" poster";
  $("heroTitle").textContent=movie.name;
  $("heroDescription").textContent=movie.description||"Experience the story on the big screen.";
  $("heroMeta").innerHTML="<span>"+esc(movie.genre||"Movie")+"</span><i>•</i><span>₹"+movie.price+" per ticket</span><i>•</i><span>Chennai</span>";
  $("heroBook").onclick=()=>goToBooking(movie.id);
  $("heroDots").innerHTML=state.movies.slice(0,5).map((m,i)=>'<button class="hero-dot '+(i===state.hero?'active':'')+'" onclick="setHero('+i+')" aria-label="Show '+esc(m.name)+'"></button>').join("");
}

function setHero(i){
  if(!state.movies.length)return;
  state.hero=(i+state.movies.length)%state.movies.length;
  renderHero();
}
function changeHero(d){setHero(state.hero+d);}

function renderQuickMovie(){
  const select=$("quickMovie");
  select.innerHTML=state.movies.map(m=>'<option value="'+m.id+'">'+esc(m.name)+" · ₹"+m.price+"</option>").join("");
  select.value=state.movies[state.hero]?.id||state.movies[0]?.id;
}
function renderMovies(){
  const filtered=state.movies.filter(m=>state.filter==="all"||(m.genre||"").toLowerCase().includes(state.filter));
  $("movieCount").textContent=filtered.length+" movie"+(filtered.length===1?"":"s");
  if(!filtered.length){$("movieGrid").innerHTML='<div class="error-card"><strong>No movies found</strong><span>Try another genre.</span></div>';return;}
  $("movieGrid").innerHTML=filtered.map((m,i)=>{
    const b=bannerFor(m);
    return '<article class="movie-card" onclick="goToBooking('+m.id+')"><div class="poster-wrap"><img src="'+b.image+'" alt="'+esc(m.name)+' poster"><div class="poster-shade"></div><span class="poster-tag">'+esc(b.tag)+'</span><span class="poster-index">'+String(i+1).padStart(2,"0")+'</span><button class="quick-book" onclick="event.stopPropagation();goToBooking('+m.id+')">Book Ticket <span>→</span></button></div><div class="movie-body"><div class="movie-topline"><span>'+esc(m.genre||"Movie")+'</span><b>₹'+m.price+'</b></div><h3>'+esc(m.name)+'</h3><p>'+esc(m.description||"Book your seats for the next show.")+'</p><div class="card-bottom"><span>Available today</span><strong>View details →</strong></div></div></article>';
  }).join("");
}

function goToBooking(id){window.location.href="/booking.html?movieId="+encodeURIComponent(id);}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

document.querySelectorAll(".filter").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");state.filter=btn.dataset.filter;renderMovies();
}));

$("movieSearch").addEventListener("input",e=>{
  const q=e.target.value.toLowerCase().trim();
  document.querySelectorAll(".movie-card").forEach(c=>c.style.display=c.textContent.toLowerCase().includes(q)?"":"none");
});

$("heroPrev").addEventListener("click",()=>changeHero(-1));
$("heroNext").addEventListener("click",()=>changeHero(1));
$("quickBook").addEventListener("click",()=>goToBooking(Number($("quickMovie").value)));

setInterval(()=>{if(state.movies.length)changeHero(1);},7000);
loadMovies();