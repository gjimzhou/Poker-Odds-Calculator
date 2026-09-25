(() => {
  'use strict';
  if (window.SiteAnalytics || location.hostname !== 'gjimzhou.github.io' || navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return;
  const project = document.currentScript.dataset.project;
  if (!/^[A-Za-z0-9-]+$/.test(project || '')) return;
  const prefix = '/' + project;
  let last = '', pending = [], ready = false;
  window.goatcounter = {no_onload: true, no_events: true, endpoint: 'https://gjimzhou.goatcounter.com/count'};
  function send(event) {
    if (!ready) { if (pending.length < 60) pending.push(event); return; }
    try { window.goatcounter.count(event); } catch { /* Reading must survive a blocked service. */ }
  }
  function view(path, title) {
    if (typeof path !== 'string' || !path.startsWith('/') || path.includes('?') || path.includes('#')) return;
    const full = prefix + path;
    if (last === full) return;
    last = full;
    send({path: full, title: project + ' · ' + title, referrer: ''});
    send({path: prefix + '/page-open' + path, title: project + ' · ' + title, event: true, no_session: true, referrer: ''});
  }
  window.SiteAnalytics = {view};
  const script = document.createElement('script');
  script.src = 'https://gc.zgo.at/count.js'; script.async = true;
  script.setAttribute('data-goatcounter', 'https://gjimzhou.goatcounter.com/count');
  script.onload = () => { ready = typeof window.goatcounter.count === 'function'; const q=pending;pending=[];if(ready)q.forEach(send); };
  script.onerror = () => { pending=[]; };
  document.head.append(script);
  function initial() {
    const cfg = window.SITE_CONFIG;
    if (cfg?.guides && document.body.dataset.page === 'guide') {
      const slug = new URLSearchParams(location.search).get('guide');
      const guide = cfg.guides.find(g => g.slug === slug) || cfg.guides[0];
      if (guide) view('/guide/' + guide.slug, guide.title);
    } else {
      const relative = location.pathname.startsWith(prefix + '/') ? location.pathname.slice(prefix.length) : '/';
      view(relative.replace(/index\.html$/, ''), document.title);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initial, {once:true});
  else initial();
})();
