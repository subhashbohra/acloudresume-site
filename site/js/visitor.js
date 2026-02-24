(async function(){
  const badge = document.getElementById("visitorCount");
  if(!badge) return;

  const BASE_COUNT = 2000;  // Start from 2000
  const localKey = "acloudresume_visitors";
  
  const localCount = () => {
    const n = parseInt(localStorage.getItem(localKey) || "0", 10) + 1;
    localStorage.setItem(localKey, String(n));
    badge.textContent = `${(BASE_COUNT + n).toLocaleString()}`;
  };

  const api = window.VISITOR_API;
  if(!api){ localCount(); return; }

  try{
    const res = await fetch(api, { method:"POST" });
    const data = await res.json();
    const totalCount = BASE_COUNT + (data.count ?? 0);
    badge.textContent = totalCount.toLocaleString();
  }catch(e){
    localCount();
  }
})();