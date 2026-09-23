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
const els = Object.fromEntries(ids.map(id=>[id, document.getElementById(id)]));
const blockedEl=document.getElementById('blockedCount');

function render(data){
  ids.forEach(id=>{ if(els[id] && els[id].type==='checkbox') { els[id].checked=!!data[id]; if(id!=='enabled') els[id].disabled=!data.enabled; } });
  if(blockedEl) blockedEl.textContent=data.blockedCount??0;
}

chrome.storage.sync.get(DEFAULTS, render);
chrome.storage.onChanged.addListener((_,a)=>{ if(a==='sync') chrome.storage.sync.get(DEFAULTS, render); });

ids.forEach(id=>{
  const el=els[id];
  if(!el || el.type!=='checkbox') return;
  el.addEventListener('change', ()=> chrome.storage.sync.set({[id]: el.checked}));
});

document.getElementById('reset')?.addEventListener('click', ()=> chrome.storage.sync.set({blockedCount:0}));
document.getElementById('export')?.addEventListener('click', async ()=>{
  const data=await chrome.storage.sync.get(DEFAULTS);
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='bye-bye-settings.json'; a.click();
  URL.revokeObjectURL(url);
});
