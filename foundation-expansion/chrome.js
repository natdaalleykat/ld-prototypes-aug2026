/* Shared chrome for the Foundation expansion prototype. Pages set window.PROTO
   { nav, crumb, why } before loading this. No trial banner: these are paying
   Foundation customers. */
(function () {
  const P = window.PROTO || {};

  const NAV = (active) => `
    <div class="glow"></div>
    <div class="logorow"><span class="lmark">&#8599;</span><span class="chev">&#8676;</span></div>
    <div class="proj"><span>&#9410; acme-web</span><span class="chev">&#9662;</span></div>
    <div class="navitem ${active === 'home' ? 'active' : ''}"><span class="nico">&#8962;</span>Home</div>
    <div class="navitem"><span class="nico">&#8981;</span>Search</div>
    <div class="navitem"><span class="nico">&#65291;</span><span class="grow">Create</span><span class="chev">&#8250;</span></div>
    <div class="navitem"><span class="nico">&#9745;</span>Approvals</div>
    <div class="navitem"><span class="nico">&#10022;</span>Vega</div>
    <div class="seg"><span class="on">&lt;/&gt; Code</span><span>&#8983; Agents</span></div>
    <div class="navitem ${active === 'install' ? 'active' : ''}"><span class="nico">&#10210;</span>Install SDK</div>
    <div class="navitem"><span class="nico">&#9889;</span><span class="grow">Shortcuts</span><span class="chev">&#8250;</span></div>
    <div class="navitem"><span class="nico">&#9673;</span><span class="grow">Features</span><span class="chev">&#8964;</span></div>
    <div class="navitem sub ${active === 'flags' ? 'active' : ''}">Flags</div>
    <div class="navitem sub">Segments</div>
    <div class="navitem sub">Contexts</div>
    <div class="navitem sub">Live events</div>
    <div class="navitem ${active === 'experiments' ? 'active' : ''}"><span class="nico">&#9651;</span><span class="grow">Experimentation</span><span class="chev">&#8250;</span></div>
    <div class="navitem ${active === 'telemetry' ? 'active' : ''}"><span class="nico">&#8767;</span><span class="grow">Telemetry</span><span class="chev">&#8250;</span></div>
    <div class="navitem"><span class="nico">&#9636;</span><span class="grow">Data</span><span class="chev">&#8250;</span></div>
    <div class="navitem"><span class="nico">&#11041;</span><span class="grow">Factory</span><span class="chev">&#8250;</span></div>
    <div class="navfoot"><span class="avatar">NF</span><span>&#9881;</span><span>&#10210;</span><span>?</span><span>&#128276;</span></div>`;

  const page = document.querySelector('[data-page]');
  const sidebar = document.querySelector('[data-sidebar]');

  const row = document.createElement('div');
  row.className = 'approw';
  const nav = document.createElement('div');
  nav.className = 'nav';
  nav.innerHTML = NAV(P.nav || 'flags');
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

  const LINKS = [
    ['index.html', 'Index'],
    ['moment-1-rollout.html', '1 Rollout'],
    ['moment-2-save.html', '2 Save'],
    ['moment-3-replay.html', '3 Replay'],
    ['moment-4-retro.html', '4 Retro'],
    ['moment-5-candidates.html', '5 Empty state'],
    ['moment-6-guarded.html', '6 Guarded'],
    ['moment-7-o11y-install.html', '7 Install'],
  ];
  const here = location.pathname.split('/').pop() || 'index.html';
  const sw = document.createElement('div');
  sw.className = 'switcher';
  sw.innerHTML = '<span class="slabel">Prototype</span>' +
    LINKS.map(([href, label]) => `<a href="${href}" class="${href === here ? 'on' : ''}">${label}</a>`).join('') +
    (P.why ? '<button class="why" id="whybtn">Why this moment</button>' : '');
  document.body.appendChild(sw);
  if (P.why) {
    const wp = document.createElement('div');
    wp.className = 'whypanel';
    wp.innerHTML = P.why;
    document.body.appendChild(wp);
    document.getElementById('whybtn').addEventListener('click', () => wp.classList.toggle('open'));
  }
})();
