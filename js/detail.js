// ---------- detail modal ----------
function openDetail(id){
  const item = items.find(i=>i.id===id);
  if(!item) return;
  const st = getStatus(item);
  const modalRoot = document.getElementById('modal-root');
  const estLine = item.tracking_mode==='estimate'
    ? `<div class="stat-box"><div class="k">Opened on</div><div class="v">${item.opened_date||'-'}</div></div>`
    : `<div class="stat-box"><div class="k">On shelf</div><div class="v">${item.shelf_qty} unit(s)</div></div>`;
  modalRoot.innerHTML = `<div class="modal-overlay" onclick="if(event.target===this) closeModal()">
    <div class="modal-sheet">
      <div class="modal-close"></div>
      ${item.photo?`<img class="detail-photo" src="${item.photo}">`:''}
      <p class="detail-title">${escapeHtml(item.name)}</p>
      <p class="detail-sub">${escapeHtml(item.category)} · ${escapeHtml(item.location||'No location set')}</p>
      <div class="status-banner" style="background:var(--${st.level==='ok'?'teal':st.level==='warn'?'amber':st.level==='urgent'?'coral':'red'}-bg);color:var(--${st.level==='ok'?'teal':st.level==='warn'?'amber':st.level==='urgent'?'coral':'red'});">${escapeHtml(st.label)}</div>
      <div class="stat-row">
        <div class="stat-box"><div class="k">Storage (packs)</div><div class="v">${item.storage_qty}</div></div>
        ${estLine}
      </div>
      <div class="stat-row">
        <div class="stat-box"><div class="k">Expiry date</div><div class="v">${item.expiry_date||'None'}</div></div>
        <div class="stat-box"><div class="k">Tracking mode</div><div class="v">${item.tracking_mode==='exact'?'Exact':'Estimate'}</div></div>
      </div>
      ${item.note?`<p style="font-size:13px;color:var(--ink-soft);">${escapeHtml(item.note)}</p>`:''}
      <hr class="divider">
      ${item.tracking_mode==='exact'?`<button class="btn btn-secondary" onclick="pickOne('${item.id}')">Use 1 unit</button>`:`<button class="btn btn-secondary" onclick="openNewPack('${item.id}')">Open a new pack (reset start date)</button>`}
      <button class="btn btn-secondary" onclick="refillFromStorage('${item.id}')">Refill shelf from storage</button>
      <div class="btn-row">
        <button class="btn btn-outline" onclick="showCodeModal(items.find(i=>i.id==='${item.id}'))">View / copy code</button>
        <button class="btn btn-outline" onclick="startEdit('${item.id}')">Edit</button>
      </div>
      <button class="btn btn-danger" onclick="deleteItem('${item.id}')">Delete this item</button>
    </div>
  </div>`;
}
function closeModal(){ document.getElementById('modal-root').innerHTML=''; }
async function pickOne(id){
  const item = items.find(i=>i.id===id);
  if(item.shelf_qty>0){ item.shelf_qty -= 1; await persistItem(item); openDetail(id); render(); }
}
async function refillFromStorage(id){
  const item = items.find(i=>i.id===id);
  if(item.storage_qty<=0){ alert('No packs left in storage'); return; }
  item.storage_qty -= 1;
  item.shelf_qty += item.pack_size;
  if(item.tracking_mode==='estimate'){
    item.opened_date = new Date().toISOString().slice(0,10);
    item.open_qty_at_open = item.shelf_qty;
  }
  await persistItem(item); openDetail(id); render();
}
async function openNewPack(id){
  const item = items.find(i=>i.id===id);
  item.opened_date = new Date().toISOString().slice(0,10);
  item.open_qty_at_open = item.shelf_qty>0 ? item.shelf_qty : item.pack_size;
  if(item.shelf_qty<=0) item.shelf_qty = item.pack_size;
  await persistItem(item); openDetail(id); render();
}
function startEdit(id){ editingId=id; capturedPhoto=null; addMode='form'; formReturnTo='detail'; closeModal(); switchTab('add'); }
async function deleteItem(id){
  if(!confirm('Delete this item from the system?')) return;
  items = items.filter(i=>i.id!==id);
  await removeItemRemote(id); closeModal(); render();
}

// ---------- code display ----------
function showCodeModal(item){
  if(!item) return;
  const modalRoot = document.getElementById('modal-root');
  const title = item.unassigned ? 'Code not assigned yet' : item.name;
  const sub = 'Type this code into your label printer app so it generates the QR itself, then stick it on the item.';
  modalRoot.innerHTML = `<div class="modal-overlay" onclick="if(event.target===this) closeModal()">
    <div class="modal-sheet" style="text-align:center;">
      <div class="modal-close"></div>
      <p class="detail-title">${escapeHtml(title)}</p>
      <p class="detail-sub">${sub}</p>
      <div class="qr-wrap"><div style="font-family:'JetBrains Mono',monospace;font-size:26px;font-weight:700;color:#111;">${item.id}</div></div>
      <button class="btn btn-secondary" onclick="copyText('${item.id}')">Copy code</button>
      <button class="btn btn-primary" onclick="closeModal()">Done</button>
    </div>
  </div>`;
}
