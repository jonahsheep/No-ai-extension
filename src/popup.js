const DEFAULTS = {
  enabled: true,
  blockOverview: true,
  blockAiMode: true,
  stripUdm50: true,
  webOnly: false,
  aggressive: false,
  blockedCount: 0
};

const els = {};
['enabled','blockOverview','blockAiMode','stripUdm50','webOnly','aggressive','blockedCount','status'].forEach(id => els[id]=document.getElementById(id));

function render(data) {
  for (const k of Object.keys(DEFAULTS)) {
    if (els[k] && els[k].type === 'checkbox') {
      els[k].checked = !!data[k];
      els[k].disabled = !data.enabled && k !== 'enabled';
    }
  }
  els.blockedCount.textContent = data.blockedCount ?? 0;
  if (data.enabled) {
    els.status.textContent = data.webOnly ? 'Web-only (udm=14) active — cleanest results.' : data.aggressive ? 'Aggressive AI blocking on.' : 'Blocking AI Overviews & AI Mode.';
    els.status.className = 'status';
  } else {
    els.status.textContent = 'Paused — extension is off. Toggle to re-enable.';
    els.status.className = 'status off';
  }
}

chrome.storage.sync.get(DEFAULTS, render);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  chrome.storage.sync.get(DEFAULTS, render);
});

for (const k of ['enabled','blockOverview','blockAiMode','stripUdm50','webOnly','aggressive']) {
  els[k].addEventListener('change', () => {
    const patch = { [k]: els[k].checked };
    // Safety: enabling aggressive warns? just set
    chrome.storage.sync.set(patch);
    if (k === 'webOnly' && els[k].checked) {
      // confirm with user in background — we already handle redirect in content.js
    }
  });
}

document.getElementById('reset').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.storage.sync.set({ blockedCount: 0 });
});

document.getElementById('optionsLink').addEventListener('click', (e) => {
  e.preventDefault();
  if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
  else window.open('options.html');
});
