const DEFAULTS = {
  enabled: true,
  blockOverview: true,
  blockAiMode: true,
  stripUdm50: true,
  webOnly: false,
  aggressive: false,
  blockedCount: 0
};

const ids = ['enabled','blockOverview','blockAiMode','stripUdm50','webOnly','aggressive'];
const els = Object.fromEntries(ids.map(id=>[id, document.getElementById(id)]));
const blockedEl = document.getElementById('blockedCount');
const enabledLabel = document.getElementById('enabledLabel');

function render(data) {
  ids.forEach(id => els[id].checked = !!data[id]);
  blockedEl.textContent = data.blockedCount ?? 0;
  enabledLabel.textContent = data.enabled ? 'on' : 'off — paused';
  // disable sub-toggles when off
  ids.slice(1).forEach(id => els[id].disabled = !data.enabled);
}

chrome.storage.sync.get(DEFAULTS, render);
chrome.storage.onChanged.addListener((c,a)=>{ if(a==='sync') chrome.storage.sync.get(DEFAULTS, render); });

ids.forEach(id=>{
  els[id].addEventListener('change', ()=> chrome.storage.sync.set({[id]: els[id].checked}));
});

document.getElementById('reset').addEventListener('click', ()=> chrome.storage.sync.set({blockedCount:0}));
document.getElementById('export').addEventListener('click', async ()=>{
  const data = await chrome.storage.sync.get(DEFAULTS);
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='no-ai-settings.json'; a.click();
  URL.revokeObjectURL(url);
});
