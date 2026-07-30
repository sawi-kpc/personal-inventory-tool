// ---------- add hub (pre-generated code pool) ----------
function goAddHub(){ addMode='hub'; editingId=null; capturedPhoto=null; switchTab('add'); }
function goNewItemForm(){ addMode='form'; formReturnTo='hub'; editingId=null; capturedPhoto=null; switchTab('add'); }

function renderAddHub(){
  const blanks = items.filter(i=>i.unassigned);
  return `<h2 class="section-title">Generate codes</h2>
  <p style="font-size:13px;color:var(--ink-soft);margin:-4px 0 14px;">Generate codes first, print them as QR codes in your label printer app (it can turn text into a QR itself), then scan or type the code back in later to fill in the item.</p>
  <label class="field"><span class="lbl">How many codes to generate</span><input type="number" id="genQty" min="1" max="50" value="1"></label>
  <button class="btn btn-primary" onclick="generateBlankBatch()">Generate codes</button>
  ${blanks.length?`<button class="btn btn-outline" onclick="showAllCodesList()">View / copy all codes (${blanks.length})</button>`:''}
  <hr class="divider">
  <h2 class="section-title" style="margin-top:0;">Codes ready to stick (${blanks.length})</h2>
  ${blanks.length? blanks.map(blankCodeCardHtml).join('') : `<p style="font-size:13px;color:var(--ink-faint);">No codes waiting yet. Use the button above to generate some.</p>`}
  <hr class="divider">
  <button class="btn btn-secondary" onclick="goNewItemForm()">Add an item right now (skip pre-printed codes)</button>
  `;
}
async function generateBlankBatch(){
  const n = Math.max(1, Math.min(50, Number(document.getElementById('genQty').value)||1));
  const newItems = [];
  for(let i=0;i<n;i++){
    const it = {
      id: genCode(), unassigned:true, name:'', category:CATS[0], location:'',
      pack_size:1, storage_qty:0, shelf_qty:0, tracking_mode:'exact', usage_rate_per_day:1,
      expiry_date:null, note:'', photo:null, opened_date:null, open_qty_at_open:null,
      created_at: Date.now()
    };
    items.push(it);
    newItems.push(it);
  }
  await Promise.all(newItems.map(persistItem));
  render();
}
function blankCodeCardHtml(item){
  return `<div class="item-card lv-ok" style="cursor:default;">
    <div class="item-thumb empty">code</div>
    <div class="item-body">
      <p class="item-name" style="font-family:'JetBrains Mono',monospace;font-size:15px;letter-spacing:0.5px;">${item.id}</p>
      <p class="item-meta">Not assigned to an item yet</p>
      <div class="btn-row">
        <button class="btn btn-outline" style="padding:8px;font-size:12px;" onclick="copyText('${item.id}')">Copy</button>
        <button class="btn btn-outline" style="padding:8px;font-size:12px;" onclick="deleteBlank('${item.id}')">Delete</button>
      </div>
    </div>
  </div>`;
}
async function deleteBlank(id){
  if(!confirm('Delete this unused code from the system?')) return;
  items = items.filter(i=>i.id!==id);
  await removeItemRemote(id); render();
}
function showAllCodesList(){
  const blanks = items.filter(i=>i.unassigned);
  const listText = blanks.map(b=>b.id).join('\n');
  const modalRoot = document.getElementById('modal-root');
  modalRoot.innerHTML = `<div class="modal-overlay" onclick="if(event.target===this) closeModal()">
    <div class="modal-sheet">
      <div class="modal-close"></div>
      <p class="detail-title">All codes (${blanks.length})</p>
      <p class="detail-sub">Copy these into your printer app one at a time, or copy the whole list for reference.</p>
      <textarea readonly style="width:100%;min-height:180px;font-family:'JetBrains Mono',monospace;font-size:14px;padding:12px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--ink);" id="allCodesArea">${listText}</textarea>
      <button class="btn btn-primary" onclick="copyText(document.getElementById('allCodesArea').value)" style="margin-top:12px;">Copy all</button>
      <button class="btn btn-outline" onclick="closeModal()">Close</button>
    </div>
  </div>`;
}

// ---------- add / edit form ----------
function renderAddForm(){
  const e = editingId ? items.find(i=>i.id===editingId) : null;
  const v = e || {name:'',category:CATS[0],location:'',pack_size:1,storage_qty:0,shelf_qty:0,tracking_mode:'exact',usage_rate_per_day:1,expiry_date:'',note:''};
  if(e && capturedPhoto===null) capturedPhoto = e.photo || null;
  const formTitle = e && e.unassigned ? 'Fill in this item' : e ? 'Edit item' : 'Add new item';
  return `<h2 class="section-title">${formTitle}</h2>
  ${e && e.unassigned ? `<p style="font-size:12px;color:var(--ink-soft);margin:-4px 0 14px;font-family:'JetBrains Mono',monospace;">Code: ${e.id}</p>` : ''}
  <div class="photo-picker" onclick="document.getElementById('photoInput').click()">
    ${capturedPhoto?`<img src="${capturedPhoto}">`:`<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 7l2-4h14l2 4"/><circle cx="12" cy="14" r="3.5"/></svg><span style="font-size:13px;">Tap to take / choose a photo</span>`}
  </div>
  <input type="file" id="photoInput" accept="image/*" capture="environment" style="display:none" onchange="handlePhotoSelect(this)">

  <label class="field"><span class="lbl">Item name</span><input type="text" id="f-name" value="${escapeHtml(v.name)}" placeholder="e.g. Face mask"></label>
  <label class="field"><span class="lbl">Category</span><select id="f-category">${CATS.map(c=>`<option ${c===v.category?'selected':''}>${c}</option>`).join('')}</select></label>
  <label class="field"><span class="lbl">Storage location</span><input type="text" id="f-location" value="${escapeHtml(v.location)}" placeholder="e.g. Fridge, shelf 2"></label>

  <div class="two-col">
    <label class="field"><span class="lbl">Pack size (units/pack)</span><input type="number" id="f-packsize" min="1" value="${v.pack_size}"></label>
    <label class="field"><span class="lbl">In storage (packs)</span><input type="number" id="f-storageqty" min="0" value="${v.storage_qty}"></label>
  </div>
  <label class="field"><span class="lbl">On shelf (units)</span><input type="number" id="f-shelfqty" min="0" value="${v.shelf_qty}"></label>

  <label class="field"><span class="lbl">How to track shelf stock</span>
    <div class="radio-group">
      <div class="radio-opt ${v.tracking_mode==='exact'?'sel':''}" onclick="setMode('exact')" id="mode-exact">Exact<br><span style="font-size:11px;">Log every time you use it</span></div>
      <div class="radio-opt ${v.tracking_mode==='estimate'?'sel':''}" onclick="setMode('estimate')" id="mode-estimate">Estimate<br><span style="font-size:11px;">Used often, skip per-use logging</span></div>
    </div>
  </label>
  <div id="estimate-fields" style="display:${v.tracking_mode==='estimate'?'block':'none'}">
    <label class="field"><span class="lbl">Approx. units used per day</span><input type="number" id="f-usagerate" min="0.1" step="0.1" value="${v.usage_rate_per_day||1}"></label>
  </div>

  <label class="field"><span class="lbl">Expiry date (optional)</span><input type="date" id="f-expiry" value="${v.expiry_date||''}"></label>
  <label class="field"><span class="lbl">Notes</span><textarea id="f-note" placeholder="e.g. how to use it, price">${escapeHtml(v.note||'')}</textarea></label>

  <button class="btn btn-primary" onclick="submitForm()">${e && !e.unassigned ? 'Save changes' : e && e.unassigned ? 'Save this item' : 'Save & generate code'}</button>
  <button class="btn btn-outline" onclick="cancelAddForm()">Cancel</button>
  `;
}
function setMode(m){
  document.getElementById('mode-exact').classList.toggle('sel', m==='exact');
  document.getElementById('mode-estimate').classList.toggle('sel', m==='estimate');
  document.getElementById('estimate-fields').style.display = m==='estimate' ? 'block':'none';
  window._pendingMode = m;
}
async function handlePhotoSelect(input){
  const file = input.files[0];
  if(!file) return;
  capturedPhoto = await compressImage(file, 360, 0.6);
  render();
}
function compressImage(file, maxDim, quality){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = e=>{
      const img = new Image();
      img.onload = ()=>{
        let w=img.width, h=img.height;
        if(w>h && w>maxDim){ h=h*maxDim/w; w=maxDim; }
        else if(h>=w && h>maxDim){ w=w*maxDim/h; h=maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width=w; canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
async function submitForm(){
  const name = document.getElementById('f-name').value.trim();
  if(!name){ alert('Please enter an item name'); return; }
  const mode = window._pendingMode || (editingId ? (items.find(i=>i.id===editingId)?.tracking_mode||'exact') : 'exact');
  const data = {
    name,
    category: document.getElementById('f-category').value,
    location: document.getElementById('f-location').value.trim(),
    pack_size: Number(document.getElementById('f-packsize').value)||1,
    storage_qty: Number(document.getElementById('f-storageqty').value)||0,
    shelf_qty: Number(document.getElementById('f-shelfqty').value)||0,
    tracking_mode: mode,
    usage_rate_per_day: Number(document.getElementById('f-usagerate')?.value)||1,
    expiry_date: document.getElementById('f-expiry').value || null,
    note: document.getElementById('f-note').value.trim(),
    photo: capturedPhoto || null,
  };
  if(editingId){
    const idx = items.findIndex(i=>i.id===editingId);
    items[idx] = {...items[idx], ...data, unassigned:false};
    await persistItem(items[idx]);
    const savedId = editingId;
    editingId = null; capturedPhoto = null; window._pendingMode=null;
    switchTab('list');
    openDetail(savedId);
  } else {
    const newItem = {
      id: genCode(), ...data,
      opened_date: mode==='estimate' ? new Date().toISOString().slice(0,10) : null,
      open_qty_at_open: mode==='estimate' ? data.shelf_qty : null,
      created_at: Date.now(),
    };
    items.push(newItem);
    await persistItem(newItem);
    capturedPhoto = null; window._pendingMode=null;
    showCodeModal(newItem);
  }
}
function cancelAddForm(){
  const wasEditing = editingId;
  const returnTo = formReturnTo;
  editingId=null; capturedPhoto=null; window._pendingMode=null;
  if(returnTo==='detail' && wasEditing){ switchTab('list'); openDetail(wasEditing); }
  else { goAddHub(); }
}
