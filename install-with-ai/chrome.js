/* Builds the shared app chrome around each page's [data-page] content.
   Pages set window.PROTO = { nav, crumb, trial, variant, why } before loading this. */
(function () {
  const P = window.PROTO || {};

  const NAV = (active) => `
    <div class="glow"></div>
    <div class="logorow"><span class="lmark">&#8599;</span><span class="chev">&#8676;</span></div>
    <div class="proj"><span>&#9410; my-project</span><span class="chev">&#9662;</span></div>
    <div class="navitem"><span class="nico">&#8962;</span>Home</div>
    <div class="navitem"><span class="nico">&#8981;</span>Search</div>
    <div class="navitem"><span class="nico">&#65291;</span><span class="grow">Create</span><span class="chev">&#8250;</span></div>
    <div class="navitem"><span class="nico">&#9745;</span>Approvals</div>
    <div class="navitem"><span class="nico">&#10022;</span>Vega</div>
    <div class="seg"><span class="on">&lt;/&gt; Code</span><span>&#8983; Agents</span></div>
    <div class="navitem ${active === 'installsdk' ? 'active' : ''}"><span class="nico">&#10210;</span>Install SDK</div>
    <div class="navitem"><span class="nico">&#9889;</span><span class="grow">Shortcuts</span><span class="chev">&#8250;</span></div>
    <div class="navitem"><span class="nico">&#9673;</span><span class="grow">Features</span><span class="chev">&#8964;</span></div>
    <div class="navitem sub ${active === 'flags' ? 'active' : ''}">Flags</div>
    <div class="navitem sub">Segments</div>
    <div class="navitem sub">Contexts</div>
    <div class="navitem sub">Live events</div>
    <div class="navitem"><span class="nico">&#9651;</span><span class="grow">Experimentation</span><span class="chev">&#8250;</span></div>
    <div class="navitem"><span class="nico">&#8767;</span><span class="grow">Telemetry</span><span class="chev">&#8250;</span></div>
    <div class="navitem"><span class="nico">&#9636;</span><span class="grow">Data</span><span class="chev">&#8250;</span></div>
    <div class="navitem"><span class="nico">&#11041;</span><span class="grow">Factory</span><span class="chev">&#8250;</span></div>
    <div class="navfoot"><span class="avatar">NF</span><span>&#9881;</span><span>&#10210;</span><span>?</span><span>&#128276;</span></div>`;

  const page = document.querySelector('[data-page]');
  const sidebar = document.querySelector('[data-sidebar]');

  if (P.trial !== false) {
    const trial = document.createElement('div');
    trial.className = 'trialbar';
    trial.innerHTML = '<b>LaunchDarkly trial</b>&nbsp;&mdash; 14 days remaining <span class="tbtn">Contact sales</span><span class="tbtn solid">Explore plans &#8599;</span>';
    document.body.prepend(trial);
  }

  const row = document.createElement('div');
  row.className = 'approw';
  const nav = document.createElement('div');
  nav.className = 'nav';
  nav.innerHTML = NAV(P.nav || 'installsdk');
  const main = document.createElement('div');
  main.className = 'main';
  main.innerHTML = `<div class="titlerow"><span class="bigcrumb">${P.crumb || ''}</span><span class="iconstrip">${sidebar ? '' : '<span>&#8677;</span><span>&#128279;</span><span>&#128276;</span><span>&#9889;</span><span>&#128344;</span><span>&#8942;</span>'}</span></div>`;
  const content = document.createElement('div');
  content.className = 'content';
  page.classList.add('page');
  content.appendChild(page);
  if (sidebar) { sidebar.classList.add('sidebar'); content.appendChild(sidebar); }
  main.appendChild(content);
  row.appendChild(nav);
  row.appendChild(main);
  document.body.appendChild(row);

  // variant switcher
  const LINKS = [
    ['index.html', 'Index'],
    ['today.html', 'Today'],
    ['option-1.html', 'Option 1'],
    ['option-2.html', 'Option 2'],
    ['option-3.html', 'Option 3'],
    ['option-4.html', 'Option 4'],
  ];
  const here = location.pathname.split('/').pop() || 'index.html';
  const sw = document.createElement('div');
  sw.className = 'switcher';
  sw.innerHTML = '<span class="slabel">Prototype</span>' +
    LINKS.map(([href, label]) => `<a href="${href}" class="${href === here ? 'on' : ''}">${label}</a>`).join('') +
    (P.why ? '<button class="why" id="whybtn">Why this option</button>' : '');
  document.body.appendChild(sw);
  if (P.why) {
    const wp = document.createElement('div');
    wp.className = 'whypanel';
    wp.innerHTML = P.why;
    document.body.appendChild(wp);
    document.getElementById('whybtn').addEventListener('click', () => wp.classList.toggle('open'));
  }

  // toast + copy behavior
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = 'Copied to clipboard';
  document.body.appendChild(toast);
  let toastTimer;
  window.flashToast = (msg) => {
    toast.textContent = msg || 'Copied to clipboard';
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
  };
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const original = btn.innerHTML;
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-copy');
      if (navigator.clipboard) { navigator.clipboard.writeText(text).catch(() => {}); }
      btn.classList.add('copied');
      btn.innerHTML = btn.classList.contains('dark') ? 'Copied' : '&#10003; Copied';
      window.flashToast();
      const tool = btn.closest('.tool');
      if (tool) {
        tool.classList.add('done');
        const tc = tool.querySelector('.tcheck');
        if (tc) { tc.innerHTML = '&#10003;'; }
      }
      setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = original; }, 2200);
    });
  });
})();
