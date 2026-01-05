
(async function(){
  const badge = document.getElementById("visitorCount");
  if(!badge) return;

  const localKey = "acloudresume_visitors";
  const localCount = () => {
    const n = parseInt(localStorage.getItem(localKey) || "0", 10) + 1;
    localStorage.setItem(localKey, String(n));
    badge.textContent = `${n.toLocaleString()} (local)`;
  };

  const api = window.VISITOR_API;
  if(!api){ localCount(); return; }

  try{
    const res = await fetch(api, { method:"POST" });
    const data = await res.json();
    badge.textContent = (data.count ?? 0).toLocaleString();
  }catch(e){
    localCount();
  }
})();
