// ---------- backend (Google Apps Script Web App) ----------
async function loadItems(){
  try{
    const res = await fetch(API_URL + '?action=list');
    const data = await res.json();
    items = (data && data.items) ? data.items : [];
  }catch(e){ console.error('load failed', e); items = []; }
}
async function persistItem(item){
  try{
    await fetch(API_URL, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'}, // avoids CORS preflight on Apps Script
      body: JSON.stringify({action:'save', item})
    });
  }catch(e){ console.error('save failed', e); }
}
async function removeItemRemote(id){
  try{
    await fetch(API_URL, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify({action:'delete', id})
    });
  }catch(e){ console.error('delete failed', e); }
}

// ---------- master data (locations, categories, sub-categories) ----------
async function loadMasterData(){
  try{
    const res = await fetch(API_URL + '?action=list_master');
    const data = await res.json();
    masterData = (data && data.master) ? data.master : [];
  }catch(e){ console.error('load master failed', e); masterData = []; }
}
async function persistMasterEntry(entry){
  try{
    await fetch(API_URL, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify({action:'save_master', entry})
    });
  }catch(e){ console.error('save master failed', e); }
}
async function removeMasterEntryRemote(id){
  try{
    await fetch(API_URL, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify({action:'delete_master', id})
    });
  }catch(e){ console.error('delete master failed', e); }
}
