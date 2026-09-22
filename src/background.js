// No AI — background service worker (MV3)
// Handles install defaults, badge, and optional DNR if needed.

const DEFAULTS = {
  enabled: true,
  blockOverview: true,
  blockAiMode: true,
  stripUdm50: true,
  webOnly: false,
  aggressive: false,
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

// Allow popup to request scan
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getState') {
    chrome.storage.sync.get(DEFAULTS).then(sendResponse);
    return true;
  }
});
