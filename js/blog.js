
async function loadJSON(path){
  const res = await fetch(path, {cache:"no-store"});
  if(!res.ok) throw new Error("Failed to load " + path);
  return await res.json();
}

function cardPost(p){
  const tags = (p.tags||[]).slice(0,4).map(t=>`<span class="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-700">${t}</span>`).join("");
  const host = (p.url||"").includes("dev.to") ? "Dev.to" : "Website";
  return `
  <article class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition">
    <div class="flex items-center justify-between gap-2">
      <span class="text-xs px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">${host}</span>
      <span class="text-xs text-slate-500">${p.date||""}</span>
    </div>
    <h3 class="mt-3 text-lg font-semibold">${p.title}</h3>
    <p class="mt-2 text-sm text-slate-600">${p.description||""}</p>
    <div class="mt-3 flex flex-wrap gap-2">${tags}</div>
    <div class="mt-4">
      <a class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold" style="background: var(--aws-slate)" href="${p.url}" target="_blank" rel="noreferrer">
        Read <span aria-hidden="true">→</span>
      </a>
    </div>
  </article>`;
}

function cardReview(r){
  return `
  <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
    <div class="flex items-center gap-3">
      <div class="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold">${(r.name||"?").slice(0,1)}</div>
      <div>
        <div class="font-semibold">${r.name||""}</div>
        <div class="text-xs text-slate-500">${r.title||""}</div>
      </div>
    </div>
    <p class="mt-3 text-sm text-slate-700 leading-relaxed">“${r.text||""}”</p>
    ${r.url ? `<a class="mt-3 inline-block text-sm hover:underline" style="color: var(--aws-blue)" href="${r.url}" target="_blank" rel="noreferrer">View on LinkedIn →</a>` : ""}
  </div>`;
}

(async function(){
  const postsWrap = document.getElementById("posts");
  const reviewsWrap = document.getElementById("reviews");
  const posts = await loadJSON("data/posts.json");
  postsWrap.innerHTML = posts.map(cardPost).join("");
  const reviews = await loadJSON("data/linkedin-reviews.json");
  reviewsWrap.innerHTML = reviews.map(cardReview).join("");
})();
