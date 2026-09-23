// No AI — background service worker (MV3)
// Handles install defaults, badge, and optional DNR if needed.

const DEFAULTS = {
  enabled: true,
  blockOverview: true,
  blockAiMode: true,
  stripUdm50: true,
  webOnly: true, // COMPLETE BLOCK: udm=14 forces Google Web-only (no AI) server-side
  aggressive: true, // also hide any residual AI badges
  blockedCount: 0
};

chrome.runtime.onInstalled.addListener(async (details) => {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  // Initialize missing keys
  const toSet = {};
  for (const k of Object.keys(DEFAULTS)) {
    if (stored[k] === undefined) toSet[k] = DEFAULTS[k];
  }
  if (Object.keys(toSet).length) await chrome.storage.sync.set(toSet);
  updateBadge(stored.enabled ?? true);
  if (details.reason === 'install') {
    chrome.storage.sync.set({ blockedCount: 0 });
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.enabled) {
    updateBadge(changes.enabled.newValue);
  }
});

async function updateBadge(enabled) {
  if (enabled) {
    await chrome.action.setBadgeText({ text: '' });
    await chrome.action.setIcon({
      path: {
        16: '../icons/icon16.png',
        48: '../icons/icon48.png',
        128: '../icons/icon128.png'
      }
    });
  } else {
    await chrome.action.setBadgeText({ text: 'OFF' });
    await chrome.action.setBadgeBackgroundColor({ color: '#9CA3AF' });
  }
}

// --- COMPLETE BLOCK: server-side udm=14 enforcement (before page loads) ---
let cached = { ...DEFAULTS };
chrome.storage.sync.get(DEFAULTS).then(d => cached = d);
chrome.storage.onChanged.addListener((c, area) => {
  if (area === 'sync') for (const k of Object.keys(c)) cached[k] = c[k].newValue;
});

function shouldForceWebOnly(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('google')) return false;
    if (u.pathname !== '/search') return false;
    if (!u.searchParams.has('q')) return false;
    return true;
  } catch { return false; }
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  const s = cached.enabled && cached.webOnly ? cached : await chrome.storage.sync.get(DEFAULTS);
  if (!s.enabled || !s.webOnly) return;
  if (!shouldForceWebOnly(details.url)) return;
  const u = new URL(details.url);
  if (u.searchParams.get('udm') === '14') return;
  u.searchParams.set('udm', '14');
  // strip AI Mode param if present
  if (u.searchParams.get('udm') === '50') u.searchParams.delete('udm');
  chrome.tabs.update(details.tabId, { url: u.toString() });
}, { url: [{ hostSuffix: 'google.com' }, { hostSuffix: 'google.co.uk' }, { hostSuffix: 'google.de' }, { hostSuffix: 'google.fr' }, { hostSuffix: 'google.es' }, { hostSuffix: 'google.it' }, { hostSuffix: 'google.ca' }, { hostSuffix: 'google.com.au' }, { hostSuffix: 'google.co.jp' }, { hostSuffix: 'google.co.in' }] });

// Strip udm=50 even when webOnly is off
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  const s = cached.enabled && cached.stripUdm50 ? cached : await chrome.storage.sync.get(DEFAULTS);
  if (!s.enabled || !s.stripUdm50) return;
  const u = new URL(details.url);
  if (u.searchParams.get('udm') !== '50') return;
  u.searchParams.delete('udm');
  chrome.tabs.update(details.tabId, { url: u.toString() });
}, { url: [{ hostSuffix: 'google.com' }, { hostSuffix: 'google.co.uk' }, { hostSuffix: 'google.de' }] });

// Allow popup to request scan
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getState') {
    chrome.storage.sync.get(DEFAULTS).then(sendResponse);
    return true;
  }
});
