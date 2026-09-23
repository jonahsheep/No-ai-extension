const DEFAULTS = {
  enabled: true,
  blockOverview: true,
  blockAiMode: true,
  stripUdm50: true,
  webOnly: false,
  aggressive: false,
  hideAds: false,
  hideShopping: false,
  hideDiscussions: false,
  hideVideos: false,
  hidePAA: false,
  hideWhatPeopleSaying: false,
  blockedCount: 0
};
const ids = Object.keys(DEFAULTS);
const els = {};
ids.forEach(id => { const e=document.getElementById(id); if(e) els[id]=e; });
const statusEl=document.getElementById('status');
const blockedEl=document.getElementById('blockedCount');

function render(data){
  ids.forEach(k=>{
    if(els[k] && els[k].type==='checkbox'){
      els[k].checked=!!data[k];
      els[k].disabled = !data.enabled && k!=='enabled';
    }
  });
  blockedEl.textContent=data.blockedCount??0;
  if(!data.enabled){ statusEl.textContent='Paused — OFF'; statusEl.className='status off'; }
  else if(data.webOnly){ statusEl.textContent='Web-only (udm=14) — AI completely disabled server-side'; statusEl.className='status'; }
  else { statusEl.textContent='AI Overviews hidden — Bye Bye parity active'; statusEl.className='status'; }
}

chrome.storage.sync.get(DEFAULTS, render);
chrome.storage.onChanged.addListener((_,a)=>{ if(a==='sync') chrome.storage.sync.get(DEFAULTS, render); });

ids.forEach(k=>{
  const el=els[k];
  if(!el || el.type!=='checkbox') return;
  el.addEventListener('change', ()=> chrome.storage.sync.set({[k]: el.checked}));
});

document.getElementById('reset')?.addEventListener('click', e=>{ e.preventDefault(); chrome.storage.sync.set({blockedCount:0}); });
document.getElementById('optionsLink')?.addEventListener('click', e=>{
  e.preventDefault();
  if(chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
  else window.open('options.html');
});
