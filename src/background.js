// Bye Bye Google AI — background (MV3)
// Defaults match Bye Bye: only AI hidden by default, others opt-in. webOnly off by default.
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

chrome.runtime.onInstalled.addListener(async (details) => {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  const toSet = {};
  for (const k of Object.keys(DEFAULTS)) if (stored[k] === undefined) toSet[k] = DEFAULTS[k];
  if (Object.keys(toSet).length) await chrome.storage.sync.set(toSet);
  updateBadge(stored.enabled ?? true);
  if (details.reason === 'install') chrome.storage.sync.set({ blockedCount: 0 });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.enabled) updateBadge(changes.enabled.newValue);
});

async function updateBadge(enabled) {
  if (enabled) {
    await chrome.action.setBadgeText({ text: '' });
  } else {
    await chrome.action.setBadgeText({ text: 'OFF' });
    await chrome.action.setBadgeBackgroundColor({ color: '#9CA3AF' });
  }
}

// COMPLETE BLOCK via webNavigation (when webOnly ON)
let cached = { ...DEFAULTS };
chrome.storage.sync.get(DEFAULTS).then(d => cached = d);
chrome.storage.onChanged.addListener((c, area) => {
  if (area === 'sync') for (const k of Object.keys(c)) cached[k] = c[k].newValue;
});

function shouldForceWebOnly(url) {
  try {
    const u = new URL(url);
    return u.hostname.includes('google') && u.pathname === '/search' && u.searchParams.has('q');
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
  chrome.tabs.update(details.tabId, { url: u.toString() });
}, { url: [{ hostSuffix: 'google.com' }, { hostSuffix: 'google.co.uk' }, { hostSuffix: 'google.de' }, { hostSuffix: 'google.fr' }] });

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  const s = cached.enabled && cached.stripUdm50 ? cached : await chrome.storage.sync.get(DEFAULTS);
  if (!s.enabled || !s.stripUdm50) return;
  const u = new URL(details.url);
  if (u.searchParams.get('udm') !== '50') return;
  u.searchParams.delete('udm');
  chrome.tabs.update(details.tabId, { url: u.toString() });
}, { url: [{ hostSuffix: 'google.com' }, { hostSuffix: 'google.co.uk' }] });

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getState') { chrome.storage.sync.get(DEFAULTS).then(sendResponse); return true; }
});
