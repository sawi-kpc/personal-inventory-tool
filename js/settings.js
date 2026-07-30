// ---------- settings: manage master data (locations, categories, sub-categories) ----------
// Note: these lists are managed here but not yet wired into the add/edit item
// form — that form still uses the hardcoded CATS list and free-text location.
function openSettings(){
  const modalRoot = document.getElementById('modal-root');
  modalRoot.innerHTML = `<div class="modal-overlay" onclick="if(event.target===this) closeModal()">
    <div class="modal-sheet">
      <div class="modal-close"></div>
      <p class="detail-title">Settings</p>
      <p class="detail-sub">Manage the storage locations, categories, and sub-categories used across the app.</p>
      ${masterSectionHtml('location', 'Storage / location')}
      <hr class="divider">
      ${masterSectionHtml('category', 'Category')}
      <hr class="divider">
      ${subCategorySectionHtml()}
      <button class="btn btn-outline" onclick="closeModal()">Close</button>
    </div>
  </div>`;
}

function masterEntriesOfType(type){ return masterData.filter(m=>m.type===type); }

function masterRowHtml(id, label){
  return `<div class="item-card" style="cursor:default;padding:10px 12px;">
    <div class="item-body" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
      <span style="font-size:14px;">${label}</span>
      <button class="btn btn-outline" style="width:auto;padding:6px 10px;font-size:12px;" onclick="removeMasterEntry('${id}')">Delete</button>
    </div>
  </div>`;
}

function masterSectionHtml(type, title){
  const entries = masterEntriesOfType(type);
  return `<h2 class="section-title">${title}</h2>
  ${entries.length ? entries.map(e=>masterRowHtml(e.id, escapeHtml(e.value))).join('') : `<p style="font-size:13px;color:var(--ink-faint);margin:0 0 10px;">No entries yet.</p>`}
  <div class="two-col">
    <label class="field"><input type="text" id="new-${type}-input" placeholder="Add new..." onkeydown="if(event.key==='Enter') addMasterEntry('${type}')"></label>
    <button class="btn btn-secondary" style="width:auto;padding:11px 16px;flex:0 0 auto;" onclick="addMasterEntry('${type}')">Add</button>
  </div>`;
}

function subCategorySectionHtml(){
  const cats = masterEntriesOfType('category');
  const subs = masterEntriesOfType('subcategory');
  const rows = subs.map(s=>{
    const parentName = cats.find(c=>c.id===s.parent)?.value || 'Unknown category';
    return masterRowHtml(s.id, `${escapeHtml(s.value)} <span style="color:var(--ink-faint);font-weight:400;">(${escapeHtml(parentName)})</span>`);
  }).join('');
  if(!cats.length){
    return `<h2 class="section-title">Sub-category</h2>
    <p style="font-size:13px;color:var(--ink-faint);margin:0;">Add a category first.</p>`;
  }
  const catOptions = cats.map(c=>`<option value="${c.id}">${escapeHtml(c.value)}</option>`).join('');
  return `<h2 class="section-title">Sub-category</h2>
  ${subs.length ? rows : `<p style="font-size:13px;color:var(--ink-faint);margin:0 0 10px;">No entries yet.</p>`}
  <label class="field"><span class="lbl">Category</span><select id="new-subcategory-parent">${catOptions}</select></label>
  <div class="two-col">
    <label class="field"><input type="text" id="new-subcategory-input" placeholder="Add new..." onkeydown="if(event.key==='Enter') addMasterEntry('subcategory')"></label>
    <button class="btn btn-secondary" style="width:auto;padding:11px 16px;flex:0 0 auto;" onclick="addMasterEntry('subcategory')">Add</button>
  </div>`;
}

async function addMasterEntry(type){
  const input = document.getElementById(`new-${type}-input`);
  const value = input.value.trim();
  if(!value) return;
  const entry = { id: genId(), type, value, parent: null };
  if(type === 'subcategory'){
    entry.parent = document.getElementById('new-subcategory-parent').value;
  }
  masterData.push(entry);
  await persistMasterEntry(entry);
  openSettings();
}

async function removeMasterEntry(id){
  if(!confirm('Delete this entry?')) return;
  masterData = masterData.filter(m=>m.id!==id);
  await removeMasterEntryRemote(id);
  openSettings();
}
