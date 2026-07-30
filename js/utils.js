function genCode(){
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code, tries=0;
  do{
    let s='';
    for(let i=0;i<7;i++) s += chars[Math.floor(Math.random()*chars.length)];
    code = s;
    tries++;
  } while(items.some(it=>it.id===code) && tries<50);
  return code;
}
function copyText(text){
  navigator.clipboard.writeText(text).then(()=>{
    alert('Copied: '+text);
  }).catch(()=>{
    prompt('Could not copy automatically. Copy manually:', text);
  });
}
function norm(s){ return (s||'').toLowerCase().replace(/\s+/g,''); }
function genId(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function escapeHtml(s){ const d=document.createElement('div'); d.textContent=s??''; return d.innerHTML; }
