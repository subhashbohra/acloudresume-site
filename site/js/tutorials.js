const CATEGORIES = ["All", "Serverless", "AI & GenAI", "Agentic AI", "DevOps", "Programming"];

const state = {
  tutorials: [],
  filtered: [],
  category: "All",
  query: ""
};

const el = (id) => document.getElementById(id);

async function loadTutorials(){
  const res = await fetch("data/tutorials.json", {cache:"no-store"});
  return await res.json();
}

function applyFilters(){
  const q = (state.query||"").trim().toLowerCase();
  state.filtered = state.tutorials.filter(t=>{
    const catOK = state.category==="All" || t.category===state.category;
    if(!catOK) return false;
    if(!q) return true;
    const hay = `${t.title} ${t.description} ${(t.tags||[]).join(" ")}`.toLowerCase();
    return hay.includes(q);
  });
}

function difficultyBadge(diff){
  const colors = {
    "Beginner": "bg-green-50 text-green-700 border-green-200",
    "Intermediate": "bg-blue-50 text-blue-700 border-blue-200",
    "Advanced": "bg-orange-50 text-orange-700 border-orange-200"
  };
  return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${colors[diff]||colors.Beginner}">${diff}</span>`;
}

function tutorialCard(t){
  const tags = (t.tags||[]).slice(0,4).map(tag=>`<span class="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-700">${tag}</span>`).join("");
  
  return `
  <article class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition">
    <div class="flex items-center justify-between gap-2">
      ${difficultyBadge(t.difficulty)}
      <span class="text-xs text-slate-500">⏱️ ${t.duration}</span>
    </div>
    <h3 class="mt-3 text-lg font-semibold leading-snug">${t.title}</h3>
    <p class="mt-2 text-sm text-slate-600">${t.description}</p>
    <div class="mt-3 flex flex-wrap gap-2">${tags}</div>
    <div class="mt-4 flex items-center justify-between">
      <a href="${t.url}" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold" style="background: var(--aws-slate)">
        Start <span aria-hidden="true">→</span>
      </a>
      <button onclick="shareLinkedIn('${t.id}')" class="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm">
        Share
      </button>
    </div>
  </article>`;
}

function renderTabs(){
  const wrap = el("category-tabs");
  if(!wrap) return;
  wrap.innerHTML = "";
  CATEGORIES.forEach(c=>{
    const active = c===state.category;
    const b = document.createElement("button");
    b.className = active
      ? "px-3 py-2 rounded-xl text-sm border bg-slate-900 text-white border-slate-900"
      : "px-3 py-2 rounded-xl text-sm border bg-white border-slate-200 hover:bg-slate-50";
    b.textContent = c;
    b.onclick = ()=>{ state.category=c; applyFilters(); render(); renderTabs(); };
    wrap.appendChild(b);
  });
}

function render(){
  const grid = el("grid");
  const empty = el("empty");
  const count = el("count");
  
  if(state.filtered.length === 0){
    grid.innerHTML = "";
    empty?.classList.remove("hidden");
  }else{
    empty?.classList.add("hidden");
    grid.innerHTML = state.filtered.map(tutorialCard).join("");
  }
  
  if(count) count.textContent = String(state.filtered.length);
}

function shareLinkedIn(tutorialId){
  const t = state.tutorials.find(x=>x.id===tutorialId);
  if(!t) return;
  
  const url = `https://acloudresume.com/tutorial-viewer.html?id=${tutorialId}`;
  const text = `🚀 Check out this AWS tutorial: ${t.title}\n\n⏱️ ${t.duration} | 🎯 ${t.difficulty}\n\n`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  
  window.open(linkedinUrl, '_blank');
}

document.addEventListener("DOMContentLoaded", async ()=>{
  state.tutorials = await loadTutorials();
  applyFilters();
  renderTabs();
  render();
  
  el("search")?.addEventListener("input",(e)=>{
    state.query = e.target.value || "";
    applyFilters();
    render();
  });
});
