/**
 * No AI — v0.8 — adds AI Mode blocking + udm handling
 */
(() => {
  const DEFAULTS = { enabled: true, blockOverview: true, blockAiMode: true, stripUdm50: true, blockedCount: 0 };
  let config = { ...DEFAULTS };
  chrome.storage.sync.get(DEFAULTS, d => { config = d; if (config.enabled) boot(); });
  chrome.storage.onChanged.addListener((c,a)=>{ if(a!=='sync') return; for(const k of Object.keys(c)) config[k]=c[k].newValue; });

  const AI_OVERVIEW_RE = /(AI\s*Overview|KI[-\s]*Übersicht|Vue d'ensemble par l'IA|Visão geral)/i;
  const AI_MODE_RE = /^\s*AI\s*Mode\s*$/i;
  function findBlock(el){ let cur=el; for(let i=0;i<8&&cur;i++){ if(cur.matches&&cur.matches('div.MjjYud, div.g, div[data-hveid], div.ULSxyf')) return cur; cur=cur.parentElement; } return el.parentElement?.parentElement||el; }
  function hide(el, reason){ if(!el||el.classList.contains('no-ai-hidden')) return; el.classList.add('no-ai-hidden'); el.setAttribute('data-no-ai',reason); config.blockedCount++; chrome.storage.sync.set({blockedCount:config.blockedCount}); }
  function handleUrl(){
    const url=new URL(location.href);
    if(config.stripUdm50 && url.searchParams.get('udm')==='50'){ url.searchParams.delete('udm'); history.replaceState(null,'',url.toString()); }
  }
  function scan(){
    if(!config.enabled) return;
    handleUrl();
    if(config.blockOverview){
      document.querySelectorAll('div[data-attrid*="AIOverview" i], div[data-subtree*="ai_overview" i]').forEach(e=>hide(findBlock(e),'attr'));
      document.querySelectorAll('h2, span, div[role="heading"]').forEach(el=>{
        const t=(el.textContent||'').trim();
        if(t.length>3&&t.length<50&&AI_OVERVIEW_RE.test(t)&&document.getElementById('search')?.contains(el)) hide(findBlock(el),'text');
      });
    }
    if(config.blockAiMode){
      document.querySelectorAll('a[href*="udm=50"]').forEach(a=>{ const tab=a.closest('div[role="navigation"] div, li, div.hdtb-mitem')||a; hide(tab,'ai-mode-link'); });
      const nav=document.querySelector('div[role="navigation"]')||document;
      nav.querySelectorAll('a, span').forEach(el=>{
        const t=(el.textContent||'').trim();
        if(AI_MODE_RE.test(t)&&t.length<20) hide(el.closest('a, li')||el,'ai-mode-text');
      });
    }
  }
  function boot(){ handleUrl(); scan(); new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true}); setInterval(()=>{ if(location.href!==boot.lastUrl){ boot.lastUrl=location.href; handleUrl(); scan(); } },500); boot.lastUrl=location.href; }
})();
