// ---------- render root ----------
function switchTab(tab){
  currentTab = tab;
  document.body.dataset.tab = tab; // lets CSS lay out dashboard/list as a grid on wider screens
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  if(tab!=='scan') stopScan();
  render();
}
function render(){
  const main = document.getElementById('main-content');
  if(currentTab==='dashboard') main.innerHTML = renderDashboard();
  else if(currentTab==='list') main.innerHTML = renderList();
  else if(currentTab==='add') main.innerHTML = addMode==='form' ? renderAddForm() : renderAddHub();
  else if(currentTab==='scan'){ main.innerHTML = renderScan(); setTimeout(startScan, 50); }
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===currentTab));
}

// ---------- init ----------
(async function init(){
  const main = document.getElementById('main-content');
  main.innerHTML = `<p class="spinner-line">Loading...</p>`;
  await Promise.all([loadItems(), loadMasterData()]);
  switchTab('dashboard');
})();
