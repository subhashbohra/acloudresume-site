
async function loadJSON(path){
  const res = await fetch(path, {cache:"no-store"});
  if(!res.ok) throw new Error("Failed to load " + path);
  return await res.json();
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
  </div>`;
}

(async function(){
  const wrap = document.getElementById("homeReviews");
  if(!wrap) return;
  try{
    const reviews = await loadJSON("data/linkedin-reviews.json");
    wrap.innerHTML = reviews.slice(0,3).map(cardReview).join("");
  }catch(e){
    wrap.innerHTML = `<div class="text-sm text-slate-600 bg-white border border-slate-200 rounded-2xl p-5">Add reviews in <code>data/linkedin-reviews.json</code>.</div>`;
  }
})();
