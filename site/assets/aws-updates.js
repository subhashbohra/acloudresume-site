/* aCloudResume AWS Weekly Updates (API-first)
 * - Reads data/site-config.json for apiUrl + siteBaseUrl
 * - Fetches updates from API and renders cards
 * - Generates weekly LinkedIn summary (selected week)
 * - Share buttons share YOUR website card URL
 */

const BRAND_CATEGORIES = [
  "All","Serverless","AI & GenAI","AI Agents","DevOps & Observability",
  "Containers & Kubernetes","Security","Data & Analytics","Databases","Storage","Networking","Other"
];

const state = {
  items: [],
  filtered: [],
  category: "All",
  query: "",
  source: "api",
  apiUrl: "",
  siteBaseUrl: "https://acloudresume.com",
  page: 1,
  pageSize: 12,
  selectedWeek: ""
};

const el = (id) => document.getElementById(id);
const safe = (s) => (s || "").toString().replace(/[<>]/g, "");

function fmtDate(iso){
  try{ return new Date(iso).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"2-digit"}); }
  catch{ return iso || ""; }
}

function isoWeekKey(d){
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,"0")}`;
}

function weekRangeLabel(weekKey){
  try{
    const [y,w] = weekKey.split("-W");
    const year = parseInt(y,10), week = parseInt(w,10);
    const simple = new Date(Date.UTC(year,0,1+(week-1)*7));
    const dow = simple.getUTCDay();
    const start = new Date(simple);
    if(dow<=4) start.setUTCDate(simple.getUTCDate()-(dow===0?6:dow-1));
    else start.setUTCDate(simple.getUTCDate()+(8-dow));
    const end = new Date(start); end.setUTCDate(start.getUTCDate()+6);
    const s = start.toLocaleDateString(undefined,{month:"short",day:"2-digit"});
    const e = end.toLocaleDateString(undefined,{month:"short",day:"2-digit",year:"numeric"});
    return `${s} – ${e}`;
  }catch{
    return "";
  }
}

function stableIdFromItem(it){
  if(it.updateId) return it.updateId;
  const base = `${it.title||""}|${it.link||""}|${it.publishedAt||""}`;
  let h=0;
  for(let i=0;i<base.length;i++){ h=((h<<5)-h)+base.charCodeAt(i); h|=0; }
  return `u${Math.abs(h)}`;
}

function canonicalUrlFor(it){
  const id = stableIdFromItem(it);
  const wk = it.weekKey || state.selectedWeek || isoWeekKey(new Date());
  return `${state.siteBaseUrl}/aws-updates.html?week=${encodeURIComponent(wk)}#${encodeURIComponent(id)}`;
}

function buildShareLinks(targetUrl){
  const u = encodeURIComponent(targetUrl);
  return {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    x: `https://twitter.com/intent/tweet?url=${u}`
  };
}

function normalize(data){
  const arr = Array.isArray(data) ? data : (data?.items || []);
  return (arr||[]).map(x=>{
    let publishedAt = x.publishedAt || x.published_at || x.date || new Date().toISOString();
    // clamp future dates if backend bugged
    try{
      if(new Date(publishedAt).getTime() > Date.now() + 5*60*1000){
        publishedAt = new Date().toISOString();
      }
    }catch(e){}
    const wk = x.weekKey || x.week_key || isoWeekKey(new Date(publishedAt));
    return {
      title: x.title || "",
      link: x.link || "",
      publishedAt,
      weekKey: wk,
      category: x.category || "Other",
      tags: x.tags || [],
      summary: x.summary || "",
      imageUrl: x.imageUrl || x.image_url || "",
      updateId: x.updateId || x.update_id || ""
    };
  }).sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt));
}

function applyFilters(){
  const q = (state.query||"").trim().toLowerCase();
  state.filtered = state.items.filter(it=>{
    const catOK = state.category==="All" || it.category===state.category;
    if(!catOK) return false;
    if(!q) return true;
    const hay = `${it.title} ${it.summary} ${(it.tags||[]).join(" ")}`.toLowerCase();
    return hay.includes(q);
  });
}

function groupByWeek(items){
  const m = new Map();
  items.forEach(it=>{
    if(!m.has(it.weekKey)) m.set(it.weekKey, []);
    m.get(it.weekKey).push(it);
  });
  return Array.from(m.entries()).sort((a,b)=>a[0]<b[0]?1:-1);
}

function categoryBadge(category){
  return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs border border-slate-200 bg-slate-50 text-slate-700">${safe(category)}</span>`;
}

function renderTabs(){
  const wrap = el("category-tabs");
  if(!wrap) return;
  wrap.innerHTML = "";
  BRAND_CATEGORIES.forEach(c=>{
    const active = c===state.category;
    const b = document.createElement("button");
    b.className = active
      ? "px-3 py-2 rounded-xl text-sm border bg-slate-900 text-white border-slate-900"
      : "px-3 py-2 rounded-xl text-sm border bg-white border-slate-200 hover:bg-slate-50";
    b.textContent = c;
    b.onclick = ()=>{ state.category=c; state.page=1; applyFilters(); renderAll(); renderTabs(); };
    wrap.appendChild(b);
  });
}

function cardHtml(it){
  const id = stableIdFromItem(it);
  const canonical = canonicalUrlFor(it);
  const share = buildShareLinks(canonical);

  const img = it.imageUrl
    ? `<img src="${it.imageUrl}" alt="${safe(it.title)}" class="w-full h-44 object-cover rounded-xl border border-slate-100" loading="lazy" />`
    : `<img src="assets/sample-card.svg" alt="AWS Weekly Updates" class="w-full h-44 object-cover rounded-xl border border-slate-100" loading="lazy" />`;

  const tags = (it.tags||[]).slice(0,4).map(t=>`<span class="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-700">${safe(t)}</span>`).join("");

  return `
  <article id="${encodeURIComponent(id)}" class="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col gap-3 hover:shadow-md transition">
    ${img}
    <div class="flex items-center justify-between gap-2">
      ${categoryBadge(it.category)}
      <span class="text-xs text-slate-500">${fmtDate(it.publishedAt)}</span>
    </div>
    <h3 class="text-lg font-semibold leading-snug">${safe(it.title)}</h3>
    <p class="text-sm text-slate-600">${safe(it.summary||"")}</p>
    <div class="flex flex-wrap gap-2">${tags}</div>
    <div class="mt-1 flex items-center justify-between gap-3">
      <a href="${it.link || "#"}" target="_blank" rel="noreferrer" class="hover:underline" style="color: var(--aws-orange); font-weight:600;">Official →</a>
      <div class="flex items-center gap-2 text-xs">
        <a href="${share.linkedin}" target="_blank" rel="noreferrer" class="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">LinkedIn</a>
        <a href="${share.x}" target="_blank" rel="noreferrer" class="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">X</a>
      </div>
    </div>
  </article>`;
}

function weeklySummaryText(items, wk){
  const range = weekRangeLabel(wk);
  const weekItems = items.filter(x=>x.weekKey===wk).slice(0,30);

  const byCat = {};
  weekItems.forEach(x=>{
    const c = x.category || "Other";
    (byCat[c]=byCat[c]||[]).push(x);
  });

  const hashtags = [
    "#AWS", "#AWSWeekly", "#Cloud",
    "#Serverless", "#AWSLambda", "#EventBridge",
    "#GenAI", "#AmazonBedrock",
    "#DevOps", "#Observability"
  ].slice(0,14).join(" ");

  const icon = {
    "Serverless":"⚡","AI & GenAI":"🤖","AI Agents":"🧠","DevOps & Observability":"🔧",
    "Containers & Kubernetes":"🧩","Security":"🔒","Data & Analytics":"📊","Databases":"🗄️",
    "Storage":"🪣","Networking":"🌐","Other":"🗞️"
  };

  const lines = [];
  lines.push(`🚀 AWS Weekly Roundup — ${wk} (${range})`);
  lines.push(`📣 Skimmable updates for Serverless • AI/GenAI • Agents • DevOps`);
  lines.push("");

  Object.keys(byCat).forEach(cat=>{
    lines.push(`${icon[cat]||"🗞️"} ${cat}`);
    byCat[cat].slice(0,7).forEach(x=>{
      lines.push(`• ${x.title} — ${canonicalUrlFor(x)}`);
    });
    lines.push("");
  });

  lines.push(`🔗 Full list: ${state.siteBaseUrl}/aws-updates.html?week=${wk}`);
  lines.push("");
  lines.push(hashtags);
  return lines.join("\n");
}

function renderAll(){
  const items = state.filtered.length ? state.filtered : state.items;
  const wk = state.selectedWeek || new URLSearchParams(location.search).get("week") || isoWeekKey(new Date());

  // Header week display
  const rangeEl = el("this-week-range");
  if(rangeEl) rangeEl.textContent = `${wk} · ${weekRangeLabel(wk)}`;

  // Populate week selector
  const weekSelect = el("week-select");
  if(weekSelect && weekSelect.options.length <= 1){
    weekSelect.innerHTML = "";
    groupByWeek(state.items).slice(0,30).forEach(([key])=>{
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = `${key} (${weekRangeLabel(key)})`;
      weekSelect.appendChild(opt);
    });
  }
  if(weekSelect) weekSelect.value = wk;

  // Render grid for selected week
  const weekItems = items.filter(x=>x.weekKey===wk);
  const grid = el("grid");
  const empty = el("empty");
  if(grid){
    if(weekItems.length === 0){
      grid.innerHTML = "";
      empty?.classList.remove("hidden");
    }else{
      empty?.classList.add("hidden");
      grid.innerHTML = weekItems.map(cardHtml).join("");
    }
  }

  // Count
  const countEl = el("count");
  if(countEl) countEl.textContent = String(weekItems.length);
}

async function initFromConfig(){
  try{
    const res = await fetch("data/site-config.json", { cache:"no-store" });
    if(!res.ok) return;
    const cfg = await res.json();
    const c = cfg?.awsUpdates || {};
    if(c.siteBaseUrl) state.siteBaseUrl = c.siteBaseUrl;
    if(c.apiUrl) state.apiUrl = c.apiUrl;
    if(c.defaultSource) state.source = c.defaultSource;
    state.apiUrl = c.apiUrl;
    state.source = "api";

    // reflect UI
    const sourceSelect = el("source-select");
    const apiInput = el("api-url");
    if(sourceSelect) sourceSelect.value = state.source;
    if(apiInput) apiInput.value = state.apiUrl;
    if(state.source==="api") apiInput?.classList.remove("hidden");
  }catch(e){}
}

async function refresh(){
  try{
    const btn = el("btn-refresh");
    if(btn) btn.disabled = true;

    let data = [];
    if(state.source === "api"){
      if(!state.apiUrl){
        throw new Error("API URL is empty. Set data/site-config.json");
      }

      const wk =
        state.selectedWeek ||
        new URLSearchParams(location.search).get("week") ||
        isoWeekKey(new Date());
        state.selectedWeek = wk;  // ✅ ADD THIS LINE
      const apiUrl = `${state.apiUrl}?week=${encodeURIComponent(wk)}`;

      const res = await fetch(apiUrl, { cache:"no-store" });
      if(!res.ok){
        const txt = await res.text();
        throw new Error(`API error ${res.status}: ${txt}`);
      }
      data = await res.json();
      // ✅ Force weekKey for rendering consistency even if backend doesn't return it or formats it differently
      if (Array.isArray(data)) {
        data = data.map(x => ({ ...x, weekKey: wk }));
      } else if (data?.items && Array.isArray(data.items)) {
        data.items = data.items.map(x => ({ ...x, weekKey: wk }));
      }

    }


    state.items = normalize(data);
    applyFilters();
    renderAll();

    const updated = el("updated-at");
    if(updated) updated.textContent = new Date().toLocaleString();
  } catch(e){
    console.error(e);
    alert(`Refresh failed: ${e.message}`);
  } finally {
    const btn = el("btn-refresh");
    if(btn) btn.disabled = false;
  }
}

function bindControls(){
  el("search")?.addEventListener("input",(e)=>{
    state.query = e.target.value || "";
    applyFilters();
    renderAll();
  });

  el("btn-refresh")?.addEventListener("click", refresh);

 

  el("api-url")?.addEventListener("input",(e)=>{ state.apiUrl = e.target.value.trim(); });

  el("week-select")?.addEventListener("change",(e)=>{
    state.selectedWeek = e.target.value;
    renderAll();
  });

  el("btn-generate-weekly")?.addEventListener("click", ()=>{
    const wk = state.selectedWeek || new URLSearchParams(location.search).get("week") || isoWeekKey(new Date());
    const items = state.filtered.length ? state.filtered : state.items;
    const out = el("weekly-output");
    if(out) out.value = weeklySummaryText(items, wk);
  });

  el("btn-copy-weekly")?.addEventListener("click", async ()=>{
    const out = el("weekly-output");
    const v = out ? out.value : "";
    if(!v) return;
    try{
      await navigator.clipboard.writeText(v);
      const b = el("btn-copy-weekly");
      if(b){
        const old = b.textContent;
        b.textContent = "Copied";
        setTimeout(()=>{ b.textContent = old || "Copy"; }, 800);
      }
    }catch{
      alert("Copy failed");
    }
  });
}

document.addEventListener("DOMContentLoaded", async ()=>{
  await initFromConfig();
  renderTabs();
  bindControls();
  await refresh();
});
