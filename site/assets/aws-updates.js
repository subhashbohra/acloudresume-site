/* aCloudResume AWS Weekly Updates
 * Local mode: loads data/sample-updates.json
 * API mode: loads your backend endpoint (API Gateway)
 */
const BRAND_CATEGORIES = [
  "All","Serverless","AI & GenAI","AI Agents","DevOps & Observability",
  "Containers & Kubernetes","Security","Data & Analytics","Databases","Storage","Networking","Other"
];

const state = { items: [], filtered: [], category:"All", query:"", source:"sample", apiUrl:"", page:1, pageSize:12 };
const el = (id)=>document.getElementById(id);
const safe = (s)=>(s||"").toString().replace(/[<>]/g,"");

function fmtDate(iso){
  try{ return new Date(iso).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"2-digit"}); }catch{ return iso||""; }
}
function isNew(iso,h=72){
  try{ const d=new Date(iso).getTime(); const diff=Date.now()-d; return diff>=0 && diff<=h*3600*1000; }catch{return false;}
}
function isoWeekKey(d){
  const date=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  const dayNum=date.getUTCDay()||7;
  date.setUTCDate(date.getUTCDate()+4-dayNum);
  const yearStart=new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo=Math.ceil((((date-yearStart)/86400000)+1)/7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,"0")}`;
}
function weekRangeLabel(weekKey){
  const [y,w]=weekKey.split("-W");
  const year=parseInt(y,10), week=parseInt(w,10);
  const simple=new Date(Date.UTC(year,0,1+(week-1)*7));
  const dow=simple.getUTCDay();
  const start=new Date(simple);
  if(dow<=4) start.setUTCDate(simple.getUTCDate()-(dow===0?6:dow-1));
  else start.setUTCDate(simple.getUTCDate()+(8-dow));
  const end=new Date(start); end.setUTCDate(start.getUTCDate()+6);
  const s=start.toLocaleDateString(undefined,{month:"short",day:"2-digit"});
  const e=end.toLocaleDateString(undefined,{month:"short",day:"2-digit",year:"numeric"});
  return `${s} – ${e}`;
}
function weekKeyFromQueryOrNow(){
  const p=new URLSearchParams(window.location.search);
  return p.get("week") || isoWeekKey(new Date());
}

function categoryBadge(category){
  const map={
    "Serverless":"bg-orange-50 text-orange-700 border-orange-100",
    "AI & GenAI":"bg-violet-50 text-violet-700 border-violet-100",
    "AI Agents":"bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
    "DevOps & Observability":"bg-slate-100 text-slate-700 border-slate-200",
    "Containers & Kubernetes":"bg-emerald-50 text-emerald-700 border-emerald-100",
    "Security":"bg-sky-50 text-sky-700 border-sky-100",
    "Data & Analytics":"bg-indigo-50 text-indigo-700 border-indigo-100",
    "Databases":"bg-teal-50 text-teal-700 border-teal-100",
    "Storage":"bg-amber-50 text-amber-700 border-amber-100",
    "Networking":"bg-cyan-50 text-cyan-700 border-cyan-100",
    "Other":"bg-gray-50 text-gray-700 border-gray-100"
  };
  const cls=map[category]||"bg-white text-slate-700 border-slate-200";
  return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${cls}">${safe(category||"Other")}</span>`;
}
function newBadge(it){
  return isNew(it.publishedAt) ? `<span class="inline-flex items-center px-2 py-1 rounded-full text-[10px] border border-orange-200 bg-orange-50 text-orange-700">NEW</span>` : "";
}

function buildShareLinks(targetUrl){
  const u=encodeURIComponent(targetUrl);
  return {
    linkedin:`https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    x:`https://twitter.com/intent/tweet?url=${u}`,
  };
}
function normalize(items){
  return (items||[]).map(x=>{
    const publishedAt=x.publishedAt||x.published_at||x.published||new Date().toISOString();
    const wk=x.weekKey||x.week_key||isoWeekKey(new Date(publishedAt));
    return {
      title:x.title, link:x.link, publishedAt, weekKey:wk,
      category:x.category||"Other", tags:x.tags||[],
      summary:x.summary||x.shortSummary||"",
      imageUrl:x.imageUrl||x.image_url||""
    };
  }).sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt));
}
function applyFilters(){
  const q=(state.query||"").trim().toLowerCase();
  state.filtered = state.items.filter(it=>{
    const catOK = state.category==="All" || (it.category||"Other")===state.category;
    if(!catOK) return false;
    if(!q) return true;
    const hay = `${it.title||""} ${it.summary||""} ${(it.tags||[]).join(" ")}`.toLowerCase();
    return hay.includes(q);
  });
}
function paginate(items){
  const total=items.length;
  const pages=Math.max(1, Math.ceil(total/state.pageSize));
  state.page=Math.min(state.page,pages);
  const start=(state.page-1)*state.pageSize;
  return { pageItems: items.slice(start,start+state.pageSize), total, pages };
}
function cardHtml(it){
  const img = it.imageUrl
    ? `<img src="${it.imageUrl}" alt="${safe(it.title)}" class="w-full h-44 object-cover rounded-xl border border-slate-100" loading="lazy" />`
    : `<div class="w-full h-44 rounded-xl border border-slate-200 bg-gradient-to-br from-orange-50 to-slate-50 flex items-center justify-center">
         <div class="text-xs text-slate-500 px-6 text-center">Image appears once backend enables Bedrock generation.</div>
       </div>`;
  const tags=(it.tags||[]).slice(0,4).map(t=>`<span class="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-700">${safe(t)}</span>`).join("");
  const share=buildShareLinks(it.link||"https://acloudresume.com/aws-updates.html");
  return `
  <article class="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col gap-3 hover:shadow-md transition">
    ${img}
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">${categoryBadge(it.category)} ${newBadge(it)}</div>
      <span class="text-xs text-slate-500">${fmtDate(it.publishedAt)}</span>
    </div>
    <h3 class="text-lg font-semibold leading-snug">${safe(it.title)}</h3>
    <p class="text-sm text-slate-600">${safe(it.summary||"")}</p>
    <div class="flex flex-wrap gap-2">${tags}</div>
    <div class="mt-1 flex items-center justify-between gap-3">
      <a href="${it.link}" target="_blank" rel="noreferrer" class="hover:underline" style="color: var(--aws-orange); font-weight:600;">Official →</a>
      <div class="flex items-center gap-2 text-xs">
        <a href="${share.linkedin}" target="_blank" rel="noreferrer" class="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">LinkedIn</a>
        <a href="${share.x}" target="_blank" rel="noreferrer" class="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">X</a>
      </div>
    </div>
  </article>`;
}
function bindTabs(){
  const wrap=el("category-tabs"); wrap.innerHTML="";
  BRAND_CATEGORIES.forEach(c=>{
    const active=c===state.category;
    const b=document.createElement("button");
    b.className = ["px-3 py-2 rounded-xl text-sm border",
      active ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 hover:bg-slate-50"].join(" ");
    b.textContent=c;
    b.onclick=()=>{ state.category=c; state.page=1; applyFilters(); bindTabs(); renderAll(); };
    wrap.appendChild(b);
  });
}
async function fetchSample(){
  const res=await fetch("data/sample-updates.json",{cache:"no-store"});
  if(!res.ok) throw new Error("Failed to load sample data");
  return await res.json();
}
async function fetchFromApi(url){
  const res=await fetch(url,{cache:"no-store"});
  if(!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
}
function groupByWeek(items){
  const m=new Map();
  items.forEach(it=>{ if(!m.has(it.weekKey)) m.set(it.weekKey,[]); m.get(it.weekKey).push(it); });
  return Array.from(m.entries()).sort((a,b)=>a[0]<b[0]?1:-1);
}
function renderTopPicks(items){
  const score=(it)=>{
    const c={ "Serverless":50,"AI & GenAI":45,"AI Agents":42,"DevOps & Observability":38,"Containers & Kubernetes":30 }[it.category]||10;
    const n=isNew(it.publishedAt)?15:0;
    const kw=(it.title+" "+(it.summary||"")).toLowerCase();
    const k=(kw.includes("lambda")||kw.includes("bedrock")||kw.includes("eventbridge")||kw.includes("eks")||kw.includes("amazon q"))?8:0;
    return c+n+k;
  };
  const picks=[...items].sort((a,b)=>score(b)-score(a)).slice(0,3);
  if(!picks.length){ el("top-picks-wrap").classList.add("hidden"); return; }
  el("top-picks-wrap").classList.remove("hidden");
  el("top-picks").innerHTML=picks.map(cardHtml).join("");
}
function renderThisWeek(items){
  const wk=weekKeyFromQueryOrNow();
  el("this-week-range").textContent = `${wk} · ${weekRangeLabel(wk)}`;
  const weekItems=items.filter(x=>x.weekKey===wk);
  const {pageItems,total,pages}=paginate(weekItems);

  el("count").textContent=String(total);
  el("btn-prev").disabled = state.page<=1;
  el("btn-next").disabled = state.page>=pages;

  el("btn-prev").onclick=()=>{ if(state.page>1){ state.page--; renderThisWeek(state.filtered.length?state.filtered:state.items);} };
  el("btn-next").onclick=()=>{ if(state.page<pages){ state.page++; renderThisWeek(state.filtered.length?state.filtered:state.items);} };

  el("btn-share-week").onclick=()=>{
    const url=`https://acloudresume.com/aws-updates.html?week=${encodeURIComponent(wk)}`;
    window.open(buildShareLinks(url).linkedin,"_blank");
  };

  const grid=el("grid"), empty=el("empty");
  if(!pageItems.length){ grid.innerHTML=""; empty.classList.remove("hidden"); }
  else { empty.classList.add("hidden"); grid.innerHTML=pageItems.map(cardHtml).join(""); }
}
function renderPastWeeks(items){
  const cur=weekKeyFromQueryOrNow();
  const grouped=groupByWeek(items).filter(([wk])=>wk!==cur).slice(0,6);
  const wrap=el("past-weeks"); wrap.innerHTML="";
  if(!grouped.length){ wrap.innerHTML=`<div class="text-sm text-slate-600 bg-white border border-slate-200 rounded-2xl p-5">No past weeks yet.</div>`; return; }
  grouped.forEach(([wk,arr])=>{
    const url=`https://acloudresume.com/aws-updates.html?week=${encodeURIComponent(wk)}`;
    const share=buildShareLinks(url).linkedin;
    const d=document.createElement("details");
    d.className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden";
    d.innerHTML=`
      <summary class="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <div class="font-semibold">${wk} · ${weekRangeLabel(wk)}</div>
          <div class="text-xs text-slate-500">${arr.length} updates</div>
        </div>
        <a href="${share}" target="_blank" rel="noreferrer" class="text-xs px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50">Share</a>
      </summary>
      <div class="px-5 pb-5">
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">${arr.slice(0,12).map(cardHtml).join("")}</div>
      </div>`;
    wrap.appendChild(d);
  });
}

function weeklySummaryText(items){
  const wk=weekKeyFromQueryOrNow();
  const range=weekRangeLabel(wk);
  const weekItems=items.filter(x=>x.weekKey===wk).slice(0,18);
  const byCat={};
  weekItems.forEach(x=>{ const c=x.category||"Other"; (byCat[c]=byCat[c]||[]).push(x); });

  const tagSet=new Set(["#AWS","#AWSWeekly","#Cloud"]);
  const catToTags={
    "Serverless":["#Serverless","#AWSLambda","#EventBridge"],
    "AI & GenAI":["#GenAI","#AmazonBedrock","#LLM"],
    "AI Agents":["#AIAgents","#AmazonQ"],
    "DevOps & Observability":["#DevOps","#Observability","#CloudWatch"],
    "Containers & Kubernetes":["#Kubernetes","#EKS"],
    "Security":["#CloudSecurity","#IAM"],
    "Storage":["#S3"],
    "Networking":["#VPC"],
    "Data & Analytics":["#Analytics"]
  };
  Object.keys(byCat).forEach(c=>(catToTags[c]||[]).forEach(t=>tagSet.add(t)));
  const hashtags=Array.from(tagSet).slice(0,12).join(" ");

  const icon={ "Serverless":"⚡","AI & GenAI":"🤖","AI Agents":"🧠","DevOps & Observability":"🔧","Containers & Kubernetes":"🧩","Security":"🔒","Data & Analytics":"📊","Databases":"🗄️","Storage":"🪣","Networking":"🌐","Other":"🗞️" };

  const lines=[];
  lines.push(`🚀 AWS Weekly Roundup — ${wk} (${range})`);
  lines.push(`📣 Skimmable updates for Serverless • AI/GenAI • Agents • DevOps`);
  lines.push("");
  Object.keys(byCat).forEach(cat=>{
    lines.push(`${icon[cat]||"🗞️"} ${cat}`);
    byCat[cat].slice(0,5).forEach(x=>lines.push(`• ${x.title} — ${x.link}`));
    lines.push("");
  });
  lines.push(`🔗 Full list: https://acloudresume.com/aws-updates.html?week=${wk}`);
  lines.push("");
  lines.push(hashtags);
  return lines.join("\n");
}

function bindControls(){
  el("search").addEventListener("input",(e)=>{ state.query=e.target.value||""; state.page=1; applyFilters(); renderAll(); });
  el("btn-refresh").addEventListener("click", refresh);
  el("source-select").addEventListener("change",(e)=>{
    state.source=e.target.value;
    const api=el("api-url");
    if(state.source==="api") api.classList.remove("hidden"); else api.classList.add("hidden");
  });
  el("api-url").addEventListener("input",(e)=>{ state.apiUrl=e.target.value.trim(); });
  el("btn-generate-weekly").addEventListener("click", ()=>{
    const items=state.filtered.length?state.filtered:state.items;
    el("weekly-output").value = weeklySummaryText(items);
  });
  el("btn-copy-weekly").addEventListener("click", async ()=>{
    const v=el("weekly-output").value;
    if(!v) return;
    try{ await navigator.clipboard.writeText(v); el("btn-copy-weekly").textContent="Copied"; setTimeout(()=>el("btn-copy-weekly").textContent="Copy",800); }catch{ alert("Copy failed"); }
  });
}

async function refresh(){
  try{
    el("btn-refresh").disabled=true;
    const data = (state.source==="api" && state.apiUrl) ? await fetchFromApi(state.apiUrl) : await fetchSample();
    state.items = normalize(data);
    applyFilters();
    renderAll();
    el("updated-at").textContent = new Date().toLocaleString();
  }catch(e){
    console.error(e);
    alert("Refresh failed: "+e.message);
  }finally{
    el("btn-refresh").disabled=false;
  }
}
function renderAll(){
  const items=state.filtered.length?state.filtered:state.items;
  renderTopPicks(items);
  renderThisWeek(items);
  renderPastWeeks(items);
}
document.addEventListener("DOMContentLoaded", ()=>{
  bindTabs();
  bindControls();
  renderAll();
  refresh();
});
