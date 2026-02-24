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
  weeksUrl: "",
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

  // Generate unique image based on category and title
  const imageUrl = it.imageUrl || generateCategoryImage(it.category, it.title);
  
  const img = `<div class="relative w-full h-44 rounded-xl overflow-hidden border border-slate-100">
    <img src="${imageUrl}" alt="${safe(it.title)}" class="w-full h-full object-cover" loading="lazy" onerror="this.src='https://via.placeholder.com/400x176/232F3E/FF9900?text=AWS+Update'" />
  </div>`;

  const tags = (it.tags||[]).slice(0,4).map(t=>`<span class="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-700">${safe(t)}</span>`).join("");

  return `
  <article id="${encodeURIComponent(id)}" class="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col gap-3 hover:shadow-md transition">
    ${img}
    <div class="flex items-center justify-between gap-2">
      ${categoryBadge(it.category)}
      <span class="text-xs text-slate-500">${fmtDate(it.publishedAt)}</span>
    </div>
    <h3 class="text-base md:text-lg font-semibold leading-snug line-clamp-2">${safe(it.title)}</h3>
    <p class="text-sm text-slate-600 line-clamp-2">${safe(it.summary||"")}</p>
    <div class="flex flex-wrap gap-2">${tags}</div>
    <div class="mt-auto flex items-center justify-between gap-3">
      <a href="${it.link || "#"}" target="_blank" rel="noreferrer" class="text-sm hover:underline" style="color: var(--aws-orange); font-weight:600;">Official →</a>
      <div class="flex items-center gap-2 text-xs">
        <a href="${share.linkedin}" target="_blank" rel="noreferrer" class="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">LinkedIn</a>
        <a href="${share.x}" target="_blank" rel="noreferrer" class="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">X</a>
      </div>
    </div>
  </article>`;
}

function generateCategoryImage(category, title){
  // Multiple images per category for variety
  const categoryImages = {
    'Serverless': [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=176&fit=crop&q=80'
    ],
    'AI & GenAI': [
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1676277791608-ac5c30d8f6a8?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=176&fit=crop&q=80'
    ],
    'AI Agents': [
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?w=400&h=176&fit=crop&q=80'
    ],
    'DevOps & Observability': [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=400&h=176&fit=crop&q=80'
    ],
    'Containers & Kubernetes': [
      'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1667372335937-d03be6fb0a9c?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1667372393086-9d4001d51cf1?w=400&h=176&fit=crop&q=80'
    ],
    'Security': [
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=176&fit=crop&q=80'
    ],
    'Data & Analytics': [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=400&h=176&fit=crop&q=80'
    ],
    'Databases': [
      'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?w=400&h=176&fit=crop&q=80'
    ],
    'Storage': [
      'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600267185393-e158a98703de?w=400&h=176&fit=crop&q=80'
    ],
    'Networking': [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1516192518150-0d8fee5425e3?w=400&h=176&fit=crop&q=80'
    ],
    'Other': [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=176&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=176&fit=crop&q=80'
    ]
  };
  
  // Get images for category
  const images = categoryImages[category] || categoryImages['Other'];
  
  // Use title hash to consistently select same image for same update
  let hash = 0;
  for(let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i);
    hash = hash & hash;
  }
  
  const index = Math.abs(hash) % images.length;
  return images[index];
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
    const res = await fetch("data/site-config.json", { cache: "no-store" });

    if(!res.ok){
      console.warn("site-config.json not found:", res.status);
      return;
    }

    const cfg = await res.json();
    const c = cfg?.awsUpdates || {};

    // Only apply if present
    if (typeof c.siteBaseUrl === "string" && c.siteBaseUrl.trim()) {
      state.siteBaseUrl = c.siteBaseUrl.trim().replace(/\/$/, "");
    }

    if (typeof c.apiUrl === "string" && c.apiUrl.trim()) {
      state.apiUrl = c.apiUrl.trim().replace(/\/$/, "");
    }

    if (typeof c.weeksUrl === "string" && c.weeksUrl.trim()) {
      state.weeksUrl = c.weeksUrl.trim().replace(/\/$/, "");
    }

    state.source = "api";

    const apiInput = el("api-url");
    if (apiInput) apiInput.value = state.apiUrl || "";
  } catch (e) {
    console.error("initFromConfig failed:", e);
  }
}

async function selectLatestAvailableWeek(){
  // if URL explicitly sets week, respect it
  const urlWeek = new URLSearchParams(location.search).get("week");
  if(urlWeek){
    state.selectedWeek = urlWeek;
    return;
  }
  if(!state.weeksUrl) return;

  const res = await fetch(state.weeksUrl, { cache:"no-store" });
  if(!res.ok) return;

  const weeks = await res.json();
  if(Array.isArray(weeks) && weeks.length){
    state.selectedWeek = weeks[0]; // newest week
  }
}



async function populateWeekSelect(){
  const weekSelect = el("week-select");
  if(!weekSelect) return;

  if(state.weeksUrl){
    try{
      const res = await fetch(state.weeksUrl, { cache:"no-store" });
      if(res.ok){
        const weeks = await res.json();
        if(Array.isArray(weeks) && weeks.length){
          weekSelect.innerHTML = "";
          weeks.slice(0,30).forEach(key=>{
            const opt = document.createElement("option");
            opt.value = key;
            opt.textContent = `${key} (${weekRangeLabel(key)})`;
            weekSelect.appendChild(opt);
          });
        }
      }
    }catch(e){
      console.error("populateWeekSelect failed:", e);
    }
  }
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

      let apiUrl = state.apiUrl;

      const wk = state.selectedWeek || new URLSearchParams(location.search).get("week") || "";

      if (wk) {
        state.selectedWeek = wk;
        apiUrl = `${state.apiUrl}?week=${encodeURIComponent(wk)}`;
      }

      const res = await fetch(apiUrl, { cache:"no-store" });

      if(!res.ok){
        const txt = await res.text();
        throw new Error(`API error ${res.status}: ${txt}`);
      }
      data = await res.json();
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

  el("week-select")?.addEventListener("change", async (e)=>{
    state.selectedWeek = e.target.value;
    await refresh();
  });

  el("btn-prev")?.addEventListener("click", async ()=>{
    const weeks = Array.from(el("week-select")?.options || []).map(o=>o.value);
    const idx = weeks.indexOf(state.selectedWeek);
    if(idx < weeks.length - 1){
      state.selectedWeek = weeks[idx + 1];
      el("week-select").value = state.selectedWeek;
      await refresh();
    }
  });

  el("btn-next")?.addEventListener("click", async ()=>{
    const weeks = Array.from(el("week-select")?.options || []).map(o=>o.value);
    const idx = weeks.indexOf(state.selectedWeek);
    if(idx > 0){
      state.selectedWeek = weeks[idx - 1];
      el("week-select").value = state.selectedWeek;
      await refresh();
    }
  });

  el("btn-share-week")?.addEventListener("click", ()=>{
    const wk = state.selectedWeek || isoWeekKey(new Date());
    const url = `${state.siteBaseUrl}/aws-updates.html?week=${encodeURIComponent(wk)}`;
    navigator.clipboard.writeText(url).then(()=>{
      const b = el("btn-share-week");
      if(b){
        const old = b.textContent;
        b.textContent = "Copied!";
        setTimeout(()=>{ b.textContent = old; }, 1000);
      }
    }).catch(()=>alert("Copy failed"));
  });

  el("btn-generate-weekly")?.addEventListener("click", ()=>{
    const wk = state.selectedWeek || isoWeekKey(new Date());
    const items = state.items;
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

  if (!state.apiUrl) {
    state.apiUrl = "https://ejlppub2ah.execute-api.us-east-1.amazonaws.com/prod/updates";
  }
  if (!state.weeksUrl) {
    state.weeksUrl = "https://ejlppub2ah.execute-api.us-east-1.amazonaws.com/prod/weeks";
  }

  await selectLatestAvailableWeek();
  await populateWeekSelect();

  renderTabs();
  bindControls();
  await refresh();
});

