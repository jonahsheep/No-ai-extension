(() => {
  const DEFAULTS = { enabled: true, blockOverview: true, blockedCount: 0 };
  let config = { ...DEFAULTS };
  chrome.storage.sync.get(DEFAULTS, d => { config = d; if (config.enabled) boot(); });
  chrome.storage.onChanged.addListener((c,a)=>{ if(a==='sync') Object.assign(config, ...Object.values(c).map(v=>({[Object.keys(c).find(k=>c[k]===v)]:v.newValue}))); });

  const AI_OVERVIEW_RE = /(AI\s*Overview|KI[-\s]*Übersicht|Vue d'ensemble par l'IA|Visão geral)/i;
  function findBlock(el){ let cur=el; for(let i=0;i<6&&cur;i++){ if(cur.matches&&cur.matches('div.MjjYud, div.g, div[data-hveid]')) return cur; cur=cur.parentElement; } return el.parentElement?.parentElement||el; }
  function hide(el){ if(el.classList.contains('no-ai-hidden'))return; el.classList.add('no-ai-hidden'); config.blockedCount++; chrome.storage.sync.set({blockedCount:config.blockedCount}); }
  function scan(){
    document.querySelectorAll('div[data-attrid*="AIOverview" i], div[data-subtree*="ai_overview" i]').forEach(e=>hide(findBlock(e)));
    document.querySelectorAll('h2, span').forEach(el=>{
      const t=(el.textContent||'').trim();
      if(t.length>3&&t.length<50&&AI_OVERVIEW_RE.test(t)&&document.getElementById('search')?.contains(el)) hide(findBlock(el));
    });
  }
  function boot(){ scan(); new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true}); }
})();
