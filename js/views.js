// ---------- shared rendering helpers ----------
function itemCardHtml(item){
  const st = getStatus(item);
  const qtyLine = item.tracking_mode==='estimate'
    ? `In use · ${item.category}`
    : `${item.shelf_qty} left on shelf · ${item.category}`;
  const thumb = item.photo
    ? `<img class="item-thumb" src="${item.photo}" alt="">`
    : `<div class="item-thumb empty">No<br>photo</div>`;
  return `<div class="item-card lv-${st.level}" onclick="openDetail('${item.id}')">
    ${thumb}
    <div class="item-body">
      <p class="item-name">${escapeHtml(item.name)}</p>
      <p class="item-meta">${escapeHtml(qtyLine)}</p>
      <span class="badge lv-${st.level}">${escapeHtml(st.label)}</span>
    </div>
  </div>`;
}
function emptyState(title, sub){
  return `<div class="empty-state">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 7l2-4h14l2 4"/><path d="M9 11h6"/></svg>
    <p style="font-weight:600;color:var(--ink-soft);margin:0 0 4px;">${title}</p>
    <p style="font-size:13px;margin:0;">${sub}</p>
  </div>`;
}

// ---------- dashboard ----------
function renderDashboard(){
  const realItems = items.filter(i=>!i.unassigned);
  if(realItems.length===0){
    return `<h2 class="section-title">Overview</h2>${emptyState('No items yet','Go to the "Add" tab to pre-generate codes, or add an item right away')}`;
  }
  const sorted = [...realItems].sort((a,b)=>{
    const sa=getStatus(a), sb=getStatus(b);
    if(LEVEL_ORDER[sa.level]!==LEVEL_ORDER[sb.level]) return LEVEL_ORDER[sa.level]-LEVEL_ORDER[sb.level];
    return sa.sortKey-sb.sortKey;
  });
  const needAttention = sorted.filter(i=>getStatus(i).level!=='ok');
  const ok = sorted.filter(i=>getStatus(i).level==='ok');
  let html = '';
  if(needAttention.length){
    html += `<h2 class="section-title">Needs attention (${needAttention.length})</h2>`;
    html += needAttention.map(itemCardHtml).join('');
  }
  if(ok.length){
    html += `<h2 class="section-title">All good</h2>`;
    html += ok.map(itemCardHtml).join('');
  }
  return html;
}

// ---------- list ----------
function renderList(){
  const filtered = items.filter(i=>{
    if(i.unassigned) return false;
    const t = norm(searchTerm);
    if(!t) return true;
    return norm(i.name).includes(t) || norm(i.category).includes(t) || norm(i.location).includes(t);
  });
  let html = `<div class="search-box">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
    <input type="text" placeholder="Search name, category, location..." value="${escapeHtml(searchTerm)}" oninput="handleSearch(this.value)">
  </div>`;
  if(filtered.length===0){
    html += emptyState('No matches','Try a different word or check spelling');
  } else {
    html += filtered.map(itemCardHtml).join('');
  }
  return html;
}
function handleSearch(v){ searchTerm=v; const main=document.getElementById('main-content'); main.innerHTML = renderList(); document.getElementById('main-content').querySelector('input').focus(); }
