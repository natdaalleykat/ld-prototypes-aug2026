/* Session replay nudge: end-to-end save-flow mock.
   Four variants share one targeting page and one save flow; they differ only in
   where the nudge appears after a direct save and where its CTA leads. */
(function () {
  const qs = new URLSearchParams(location.search);
  const VARIANTS = ['baseline', 'proposed', 'v1', 'v2', 'v3'];
  const variant = VARIANTS.includes(qs.get('v')) ? qs.get('v') : 'baseline';

  const LABEL = {
    baseline: 'Current (shipped)',
    proposed: 'Proposed',
    v1: 'Alt: footer strip',
    v2: 'Alt: save success step',
    v3: 'Alt: in-view card + drawer',
  };

  const WHY = {
    baseline:
      '<b>Exactly what is in production (observability arm).</b> Trigger: a save on the flag Targeting page that applies immediately (not an approval request, not a scheduled change). Where: the card is appended after the save footer, then scrolls itself into view and takes focus. Gates checked: arm = observability, session replay available on this instance (not EU), this project+flag not dismissed in this browser, project has no replay data yet. <b>Not checked:</b> whether the flag is on, whether anything new reached users, whether the account has a client-side SDK. CTA is a primary button to Monitoring › Sessions, which shows the generic "Set up Observability" box (Explore sandbox / View documentation hidden under the arm flag). Dismiss writes <code>session-replay-nudge[project:flag]</code> to localStorage; nothing is written on render, so the card returns on the next page session after any direct save, and on every other flag.<div class="dl">Try: turn the flag <b>off</b> and save: the card still says "what you just shipped". Toggle "client SDK" off in the bar: it still shows. Save twice: it shows twice.</div>',
    proposed:
      '<b>Same moment, three gates, once, and a destination that finishes the job.</b> Keep the post-save moment (it is the one place we know the person is looking) but only fire when the save turns the flag <b>on</b> or changes a rule on a flag that is on, the account has a <b>client-side SDK</b> connected (otherwise replay cannot work for them), and the project has no sessions yet. Show it in the save footer that is already in view: one line, a real button, no animation. Dismiss or "Not now" is <b>member-level and permanent</b>; it is also marked seen on render, so a member sees it once, ever. The CTA lands on a replay-led Monitoring › Sessions page: detected SDK preselected, three steps (install, add plugins, redeploy), "I have deployed" flips to "listening for your first session". That same page is the Sessions empty state for anyone who arrives on their own, so the nudge is not the only path. The PRD alternative (anchor on the Monitor tab only, no post-save prompt) is one toggle away: turn the footer strip off and the destination page is still the treatment.<div class="dl">Try: flag off + save: nothing. Client SDK off + save: nothing. Flag on + SDK + save: strip, once. Reset to see it again.</div>',
    v1:
      '<b>The footer you just used becomes the nudge.</b> The sticky save footer is the one element guaranteed to be in view at the moment of saving. Instead of unsticking and disappearing, it confirms the save and offers the one next step, in one line, with a real button. No illustration, no animation. It stays until the user acts, dismisses, or leaves the page. Dismiss is <b>member-level and permanent</b>: this member never sees it again on any flag; teammates on the same account still get it once. CTA goes to Monitoring › Sessions, but that page is rewritten to be replay-led with the detected SDK preselected and a 3-step path that sets expectations (two packages, one config change, redeploy).<div class="dl">Cheapest to build: the footer slot and the Notice slot already exist in the targeting layout.</div>',
    v2:
      '<b>Ask inside the save flow, once.</b> The Review and save modal already has the user’s full attention and the browser’s focus. On the first qualifying save it shows a success step: change confirmed, then one offer with a static replay frame that shows the payoff (a session tagged with the variation the user saw), the "Included in your plan" signal, honest steps, and a primary button. "Done" closes it and the modal never shows the step again for this member; later saves close instantly as today. Teammates get their own single showing. The risk is one extra click on the first save; the upside is a guaranteed impression with zero page-position problems, and a clean viewed → clicked funnel.<div class="dl">Trade-off to weigh: this touches the review modal, which E1 (experiment moment) also wants to use. One success step could host both offers by gate.</div>',
    v3:
      '<b>Adalene’s card, kept in view, no page hop.</b> The card renders in the layout’s Notice slot between the rules and the footer, scrolls itself into view, and takes focus, so it is never below the fold. It keeps the illustration but static, with a variation chip so it reads as "a recording of your users on this flag" rather than a generic animation. The CTA opens a drawer on the targeting page: detected SDK, three steps, a copy-prompt for a coding agent, and an "I’ve deployed" button that flips to "Listening for your first session" so the user knows setup finished and what happens next. Dismiss is member-level and permanent. This version best matches the PRD’s "setup is effortless" test because the user never leaves the flag.<div class="dl">Most build: the drawer is new, though the snippets and the integration-listener already exist in the observability package.</div>',
  };

  // ---------- persistent "member" state (dismissed = never again for this member) ----------
  const KEY = 'srn-mock-' + variant;
  const mem = JSON.parse(localStorage.getItem(KEY) || '{}');
  function persist() { localStorage.setItem(KEY, JSON.stringify(mem)); }

  // ---------- page-session state ----------
  const S = {
    view: 'targeting',        // targeting | monitoring
    flagOn: true,
    rollout: 25,              // rule 2 rollout % to new-checkout
    saved: { flagOn: true, rollout: 25 },
    modal: null,              // null | 'review' | 'success'
    nudge: false,             // nudge is showing (post-save, this page session)
    drawer: false,
    listening: null,          // null | 'waiting' | 'got'
    clientSdk: qs.get('sdk') !== '0',   // scenario: does the account have a client-side SDK connected
  };
  const dirty = () => S.flagOn !== S.saved.flagOn || S.rollout !== S.saved.rollout;
  const changeCount = () => (S.flagOn !== S.saved.flagOn ? 1 : 0) + (S.rollout !== S.saved.rollout ? 1 : 0);

  // ---------- chrome ----------
  const NAV = `
    <div class="glow"></div>
    <div class="logorow"><span class="lmark">&#8599;</span><span class="chev">&#8676;</span></div>
    <div class="proj"><span>&#9410; acme-web</span><span class="chev">&#9662;</span></div>
    <div class="navitem"><span class="nico">&#8962;</span>Home</div>
    <div class="navitem"><span class="nico">&#8981;</span>Search</div>
    <div class="navitem"><span class="nico">&#65291;</span><span class="grow">Create</span><span class="chev">&#8250;</span></div>
    <div class="navitem"><span class="nico">&#9745;</span>Approvals</div>
    <div class="navitem"><span class="nico">&#10022;</span>Vega</div>
    <div class="seg"><span class="on">&lt;/&gt; Code</span><span>&#8983; Agents</span></div>
    <div class="navitem"><span class="nico">&#10210;</span>Install SDK</div>
    <div class="navitem"><span class="nico">&#9889;</span><span class="grow">Shortcuts</span><span class="chev">&#8250;</span></div>
    <div class="navitem"><span class="nico">&#9673;</span><span class="grow">Features</span><span class="chev">&#8964;</span></div>
    <div class="navitem sub active">Flags</div>
    <div class="navitem sub">Segments</div>
    <div class="navitem sub">Contexts</div>
    <div class="navitem sub">Live events</div>
    <div class="navitem"><span class="nico">&#9651;</span><span class="grow">Experimentation</span><span class="chev">&#8250;</span></div>
    <div class="navitem"><span class="nico">&#8767;</span><span class="grow">Telemetry</span><span class="chev">&#8250;</span></div>
    <div class="navitem"><span class="nico">&#9636;</span><span class="grow">Data</span><span class="chev">&#8250;</span></div>
    <div class="navitem"><span class="nico">&#11041;</span><span class="grow">Factory</span><span class="chev">&#8250;</span></div>
    <div class="navfoot"><span class="avatar">NF</span><span>&#9881;</span><span>&#10210;</span><span>?</span><span>&#128276;</span></div>`;

  const page = document.getElementById('page');
  const sidebar = document.getElementById('sidebar');
  const row = document.createElement('div'); row.className = 'approw';
  const nav = document.createElement('div'); nav.className = 'nav'; nav.innerHTML = NAV;
  const main = document.createElement('div'); main.className = 'main';
  const crumb = document.createElement('div'); crumb.className = 'titlerow';
  main.appendChild(crumb);
  const content = document.createElement('div'); content.className = 'content';
  page.classList.add('page'); sidebar.classList.add('sidebar');
  content.appendChild(page); content.appendChild(sidebar);
  main.appendChild(content); row.appendChild(nav); row.appendChild(main);
  document.body.appendChild(row);

  // overlays live outside the scroll column
  const layer = document.createElement('div'); document.body.appendChild(layer);
  const snack = document.createElement('div'); snack.className = 'snack'; document.body.appendChild(snack);
  const fold = document.createElement('div'); fold.className = 'foldnote'; document.body.appendChild(fold);

  function toast(html) {
    snack.innerHTML = html; snack.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => snack.classList.remove('show'), 3200);
  }

  // ---------- shared fragments ----------
  const TABS = (active) => `<div class="tabs">${['Targeting', 'Variations', 'Monitoring', 'Audience', 'Feedback', 'Code'].map(t =>
    `<div class="tab ${t === active ? 'active' : ''}" data-tab="${t}" style="cursor:pointer">${t}</div>`).join('')}</div>`;
  const ENVTABS = `<div class="envtabs"><div class="envtab active"><span class="edot prod"></span>Production</div><div class="envtab"><span class="edot"></span>Test</div><div class="envplus">&#65291;</div></div>`;

  const stillFrame = () => `<div class="stillframe" aria-hidden="true"><div class="bar"><i style="left:6px"></i><i style="left:14px"></i><i style="left:22px"></i></div>
    <div class="ln" style="top:24px;width:64px"></div><div class="ln" style="top:36px;width:88px"></div><div class="ln" style="top:48px;width:52px"></div>
    <div class="vchip"><i></i>new-checkout</div><div class="play">&#9654;</div><div class="tl"></div></div>`;

  const NUDGE = {
    title: 'Replay real user sessions on what you just shipped',
    body: 'Watch recordings of real users on <b>new-checkout-flow</b>, tagged with the variation they were served. Errors, logs, and traces turn on with the same setup.',
    steps: 'Two packages, one config change, then redeploy. About 10 minutes.',
    cta: 'Set up session replay',
  };

  // ---------- targeting page ----------
  function renderTargeting() {
    crumb.innerHTML = `<span class="bigcrumb"><span class="dim">Flags /</span> new-checkout-flow <span class="dim">/ Targeting</span></span>`;
    const isDirty = dirty();
    const showV1Strip = (variant === 'v1' || variant === 'proposed') && S.nudge && !mem.dismissed;
    const showV3Card = variant === 'v3' && S.nudge && !mem.dismissed;
    const showBaseline = variant === 'baseline' && S.nudge && !(mem.dismissedFlags || {})['new-checkout-flow'];

    page.innerHTML = `
      ${TABS('Targeting')}
      ${ENVTABS}
      <div class="theadrow"><div class="thead">Targeting configuration for <span class="edot prod" style="display:inline-block;margin:0 2px"></span> Production</div>
        <div class="viewseg"><span class="vbtn on">&#9638; Visual</span><span class="vbtn">{ } JSON</span><span class="vico">&#9881;</span><span class="vico">&#8677;</span></div></div>

      <div class="stage">
        <div class="cnode">
          <div class="alltraffic">All traffic</div><div class="cline"></div>
          <div class="ccard" style="display:flex;align-items:center;gap:12px">
            <span>Flag is</span>
            <button class="toggle ${S.flagOn ? 'on' : 'off'}" id="toggle" aria-pressed="${S.flagOn}">${S.flagOn ? 'On' : 'Off'}<span class="knob"></span></button>
            <span>${S.flagOn ? 'serving variations based on rules' : 'serving <span class="diamond d-gray"></span><b>legacy-checkout</b> to all traffic'}</span>
          </div>
          <div class="cline"></div><div class="plusnode">&#65291;</div><div class="cline"></div>

          <div class="rulecard">
            <div class="rulehead"><b>Rule 1</b><span class="editbtn">&#9998; Edit</span></div>
            <div class="rl">If <span class="cond">country</span> is one of <span class="cond">US</span> <span class="cond">CA</span></div>
            <div class="rl">Serve <span class="diamond d-blue"></span><b>new-checkout</b></div>
          </div>
          <div class="cline"></div><div class="plusnode">&#65291;</div><div class="cline"></div>

          <div class="rulecard">
            <div class="rulehead"><b>Rule 2</b><span class="editbtn" id="editrule" style="cursor:pointer" title="Mock: switches the rollout to 50/50">&#9998; Edit</span></div>
            <div class="rl">If <span class="cond">plan</span> is one of <span class="cond">enterprise</span> <span class="cond">business</span></div>
            <div class="rl">Serve a percentage rollout</div>
            <div class="rollbar"><span style="width:${S.rollout}%;background:var(--blue500)"></span><span style="width:${100 - S.rollout}%;background:var(--gray300)"></span></div>
            <div class="rollleg"><span><i style="background:var(--blue500)"></i>new-checkout ${S.rollout}%</span><span><i style="background:var(--gray300)"></i>legacy-checkout ${100 - S.rollout}%</span></div>
          </div>
          <div class="cline"></div><div class="plusnode">&#65291;</div><div class="cline"></div>

          <div class="rulecard">
            <div class="rulehead"><b>Default rule</b><span style="display:flex;gap:8px"><span class="editbtn">&#9651; Create experiment from rule</span><span class="editbtn">&#9998; Edit</span></span></div>
            <div class="rl">Serve <span class="diamond d-gray"></span><b>legacy-checkout</b></div>
          </div>
        </div>
      </div>
      <div class="footnote" style="margin-top:12px">If LaunchDarkly is unreachable, SDKs will serve the default defined in your code.</div>

      <div id="noticeslot">${showV3Card ? v3Card() : ''}</div>

      <div class="tfooter ${isDirty || showV1Strip ? 'sticky' : ''}" id="tfooter">
        ${showV1Strip ? v1Strip() : `
        <div class="tfooterinner">
          <span class="fmsg">${isDirty ? `${changeCount()} unsaved change${changeCount() > 1 ? 's' : ''} to targeting` : '<span class="dim">No unsaved changes</span>'}</span>
          <span class="btnrow">${isDirty ? '<button class="ghostbtn" id="discard">Discard</button>' : ''}<button class="savebtn ${isDirty ? '' : 'dim'}" id="reviewsave" ${isDirty ? '' : 'disabled'}>Review and save</button></span>
        </div>`}
      </div>

      ${showBaseline ? baselineCard() : ''}
    `;

    renderSidebar();

    page.querySelectorAll('[data-tab]').forEach(t => t.addEventListener('click', () => {
      if (t.dataset.tab === 'Monitoring') go('monitoring', variant === 'baseline' ? 'current' : 'improved');
      if (t.dataset.tab === 'Variations' || t.dataset.tab === 'Audience' || t.dataset.tab === 'Feedback' || t.dataset.tab === 'Code') toast('Mock: only Targeting and Monitoring are built');
    }));
    page.querySelector('#toggle').addEventListener('click', () => { S.flagOn = !S.flagOn; renderTargeting(); });
    page.querySelector('#editrule').addEventListener('click', () => { S.rollout = S.rollout === 25 ? 50 : 25; renderTargeting(); });
    const d = page.querySelector('#discard'); if (d) d.addEventListener('click', () => { S.flagOn = S.saved.flagOn; S.rollout = S.saved.rollout; renderTargeting(); });
    const rs = page.querySelector('#reviewsave'); if (rs) rs.addEventListener('click', () => { S.modal = 'review'; renderModal(); });

    wireNudge();
    measureFold();
  }

  function renderSidebar() {
    sidebar.innerHTML = `
      <div class="sactrow"><span>&#8677;</span><span>&#128279;</span><span>&#128276;</span><span>&#9889;</span><span>&#128344;</span><span>&#8942;</span></div>
      <div class="prop"><div class="pt">Key</div><div class="pv" style="display:flex;justify-content:space-between;align-items:center;color:var(--gray700)">new-checkout-flow <span style="color:var(--gray400)">&#10697;</span></div></div>
      <div class="prop"><div class="pt">Description</div><div class="pv">Rewritten one-page checkout</div></div>
      <div class="prop"><div class="pt">Maintainer <span class="pencil">&#9998;</span></div><div class="pv" style="margin-top:4px"><span class="mchip"><span class="avatar">NF</span> Natalie Friedman <span style="color:var(--gray400)">&#9430;</span></span></div></div>
      <div class="prop"><div class="pt">Tags <span class="pencil">&#9998;</span></div><div class="pv"><span class="ftag">checkout</span><span class="ftag">q3</span></div></div>
      <div class="prop"><div class="pt">Variations <span class="pencil">&#9998;</span></div><div class="pv"><span class="diamond d-blue"></span>new-checkout<br><span class="diamond d-gray"></span>legacy-checkout</div></div>
      <div class="prop"><div class="pt">Connected SDKs</div><div class="pv">${S.clientSdk ? 'React (web) &middot; Node.js server' : 'Node.js server <span style="color:var(--gray500)">(no client-side SDK)</span>'}</div></div>
      <div class="prop"><div class="pt">Experiments <span class="pencil">&#65291;</span></div><div class="pv">None &middot; <span class="sublink">Add experiment</span></div></div>
      <div class="prop" style="border-bottom:none"><div class="pt">Telemetry</div><div class="pv">${S.listening === 'got' ? '<span style="color:var(--greenText);font-weight:600">Sessions connected</span>' : S.listening === 'waiting' ? 'Waiting for first session…' : 'Not connected'}</div></div>`;
  }

  // ---------- nudge variants ----------
  function baselineCard() {
    return `<div class="aricard" id="nudgecard" data-test-id="session-replay-cta">
      <div class="copy">
        <h3>Replay real user sessions on what you just shipped <span class="inclchip" style="font-weight:500;vertical-align:middle">5K sessions a month included</span></h3>
        <p>Watch recordings of real users on this flag, tagged with the flag variation they were served. Errors, logs, and traces turn on with the same setup.</p>
        <p style="margin-top:8px"><button class="nudgebtn" id="nudgecta">Set up session replay</button></p>
      </div>
      <div class="preview" aria-hidden="true">
        <div class="frame"><div class="bar"><i style="left:7px"></i><i style="left:16px"></i><i style="left:25px"></i></div>
          <div class="ln" style="top:28px;width:76px"></div><div class="ln" style="top:42px;width:110px"></div><div class="ln" style="top:56px;width:60px"></div>
          <div class="btn"></div><div class="panel"></div><div class="cur">&#10148;</div></div>
        <div class="scrub"><span style="font-size:11px;color:var(--gray600)">&#10074;&#10074;</span><div class="tr"><div class="pg"></div></div></div>
      </div>
      <button class="x" id="nudgedismiss" aria-label="Dismiss recommendation">&#10005;</button>
    </div>`;
  }

  function v1Strip() {
    return `<div class="strip" id="nudgecard" role="status">
      <span class="savedmark"><span class="check">&#10003;</span>Saved to Production</span>
      <span class="stext"><b>${variant === 'proposed' ? 'Watch real users on new-checkout-flow' : NUDGE.title}</b> <span class="inclchip">5,000 sessions a month included</span><span class="sub">${variant === 'proposed' ? 'Your React app can record sessions tagged with the variation each user got. Two packages, one config change, redeploy.' : 'Watch recordings of real users on this flag, tagged with the variation they were served. Two packages, one config change, then redeploy.'}</span></span>
      <span class="btnrow"><button class="nudgebtn" id="nudgecta">${NUDGE.cta}</button><button class="nudgeghost" id="nudgedismiss">Not now</button></span>
    </div>`;
  }

  function v3Card() {
    return `<div class="notice enter" id="nudgecard">
      ${stillFrame()}
      <div class="nbody">
        <div class="nt">${NUDGE.title} <span class="inclchip">5,000 sessions a month included</span></div>
        <p>${NUDGE.body} <span style="color:var(--gray500)">${NUDGE.steps}</span></p>
        <div class="btnrow"><button class="nudgebtn" id="nudgecta">${NUDGE.cta}</button><button class="nudgeghost" id="nudgedismiss">Not now</button></div>
      </div>
      <button class="x" id="nudgex" aria-label="Dismiss">&#10005;</button>
    </div>`;
  }

  function wireNudge() {
    const cta = page.querySelector('#nudgecta');
    if (cta) cta.addEventListener('click', (e) => {
      e.preventDefault();
      if (variant === 'v3') { S.drawer = true; renderDrawer(); }
      else go('monitoring', variant === 'baseline' ? 'current' : 'improved');
    });
    const dis = page.querySelector('#nudgedismiss') || page.querySelector('#nudgex');
    const dis2 = page.querySelector('#nudgex');
    [dis, dis2].filter(Boolean).forEach(b => b.addEventListener('click', () => dismiss()));
    if (variant === 'baseline' && S.nudge) {
      const card = page.querySelector('#nudgecard');
      if (card && !card.dataset.focused) {
        card.dataset.focused = '1'; card.setAttribute('tabindex', '-1'); card.setAttribute('role', 'status');
        // Production: scrollIntoView({ block: 'nearest', behavior: 'smooth' }) then focus. Instant here so screenshots match.
        card.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        card.focus({ preventScroll: true });
      }
    }
    if (variant === 'proposed' && S.nudge && !mem.dismissed && !mem.seen) { mem.seen = true; persist(); renderSwitcher(); }
    if (variant === 'v3' && S.nudge && !mem.dismissed) {
      const card = page.querySelector('#nudgecard');
      if (card && !card.dataset.focused) {
        card.dataset.focused = '1';
        card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        setTimeout(() => cta && cta.focus({ preventScroll: true }), 300);
      }
    }
  }

  function dismiss() {
    if (variant === 'baseline') {
      mem.dismissedFlags = mem.dismissedFlags || {}; mem.dismissedFlags['new-checkout-flow'] = true;
      toast('Dismissed for <b>this flag</b> in <b>this browser</b> only. Other flags, other browsers, and teammates still get it.');
    } else {
      mem.dismissed = true;
      toast('Dismissed for <b>you</b>, permanently. Teammates on this account still see it once.');
    }
    persist(); S.nudge = false; renderTargeting(); renderSwitcher();
  }

  function measureFold() {
    fold.classList.remove('show', 'ok');
    if (variant !== 'baseline' || !S.nudge || S.view !== 'targeting') return;
    const card = page.querySelector('#nudgecard'); if (!card) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const c = card.getBoundingClientRect(), p = page.getBoundingClientRect();
      const below = Math.round(c.top - p.bottom);
      if (c.bottom <= p.bottom) { fold.className = 'foldnote ok show'; fold.innerHTML = '<b>Card is in view</b>It scrolled itself here and took focus (production behavior since Sep 10).'; }
      else if (c.top < p.bottom) { fold.className = 'foldnote show'; fold.innerHTML = `<b>Card is cut off</b>${Math.round(c.bottom - p.bottom)}px of it is below the fold.`; }
      else { fold.className = 'foldnote show'; fold.innerHTML = `<b>Card is below the fold</b>Its top edge is ${below}px under the visible area.`; }
    }));
  }
  page.addEventListener('scroll', () => { if (variant === 'baseline' && S.nudge) measureFold(); });
  window.addEventListener('resize', () => { if (variant === 'baseline' && S.nudge) measureFold(); });

  // ---------- review and save modal ----------
  function diffRows() {
    const rows = [];
    if (S.flagOn !== S.saved.flagOn) rows.push(`<div class="diffrow"><span class="dk">Flag targeting</span><span class="dv"><span class="was">${S.saved.flagOn ? 'On' : 'Off'}</span>${S.flagOn ? 'On' : 'Off'}</span></div>`);
    if (S.rollout !== S.saved.rollout) rows.push(`<div class="diffrow"><span class="dk">Rule 2 rollout</span><span class="dv"><span class="was">${S.saved.rollout}/${100 - S.saved.rollout}</span>new-checkout ${S.rollout}% / legacy-checkout ${100 - S.rollout}%</span></div>`);
    return rows.join('');
  }

  function renderModal() {
    if (!S.modal) { layer.innerHTML = ''; return; }
    if (S.modal === 'review') {
      layer.innerHTML = `<div class="overlay" id="overlay"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt">
        <div class="mhead"><h2 id="mt">Review and save</h2><div class="msub">Changes to <b>new-checkout-flow</b> in <span class="edot prod" style="display:inline-block"></span> <b>Production</b></div></div>
        <div class="mbody">
          <div class="difflist">${diffRows()}</div>
          <div class="mlabel">Comment <span class="opt">(optional)</span></div>
          <div class="textarea">Describe this change for the audit log</div>
        </div>
        <div class="mfoot"><button class="ghostbtn" id="mcancel">Cancel</button><button class="savebtn" id="msave">Save changes</button></div>
      </div></div>`;
      layer.querySelector('#mcancel').addEventListener('click', () => { S.modal = null; renderModal(); });
      layer.querySelector('#msave').addEventListener('click', save);
      setTimeout(() => { const b = layer.querySelector('#msave'); if (b) b.focus(); }, 0);
      return;
    }
    if (S.modal === 'success') {
      layer.innerHTML = `<div class="overlay"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="st">
        <div class="successhead"><span class="check">&#10003;</span><div><h2 id="st">Saved to Production</h2><div class="msub">${changeSummary()} &middot; live for your users now</div></div></div>
        <div class="offer">
          ${stillFrame()}
          <div style="flex:1;min-width:0">
            <div class="ot">${NUDGE.title} <span class="inclchip">5,000 sessions a month included</span></div>
            <p>${NUDGE.body}</p>
            <div class="steps"><span>1 &middot; Install two packages</span><span class="arr">&#8250;</span><span>2 &middot; Add the plugins</span><span class="arr">&#8250;</span><span>3 &middot; Redeploy</span><span class="arr">&nbsp;</span><span style="border:none;background:none;padding:0">~10 min</span></div>
            <div class="btnrow"><button class="nudgebtn" id="scta">${NUDGE.cta}</button><button class="nudgeghost" id="sdone">Done</button></div>
          </div>
        </div>
        <div class="onceline">You’ll only see this once. You can set up session replay any time from Monitoring › Sessions.</div>
      </div></div>`;
      layer.querySelector('#scta').addEventListener('click', () => { S.modal = null; renderModal(); go('monitoring', 'improved'); });
      layer.querySelector('#sdone').addEventListener('click', () => { S.modal = null; renderModal(); toast('<span class="ok">&#10003;</span> Flag saved'); });
      setTimeout(() => { const b = layer.querySelector('#scta'); if (b) b.focus(); }, 0);
    }
  }
  function changeSummary() {
    const parts = [];
    if (S.saved.flagOn !== undefined && S._last) {
      if (S._last.flagOn !== S.saved.flagOn) parts.push(`Flag turned ${S.saved.flagOn ? 'on' : 'off'}`);
      if (S._last.rollout !== S.saved.rollout) parts.push(`Rule 2 rollout now ${S.saved.rollout}/${100 - S.saved.rollout}`);
    }
    return parts.join(' and ') || 'Targeting updated';
  }

  function save() {
    S._last = { ...S.saved };
    S.saved = { flagOn: S.flagOn, rollout: S.rollout };
    // Eligibility. Current (shipped): any direct save, no flag-on or SDK check. Proposed: flag on after save, client SDK, no sessions, not seen.
    const eligible = variant === 'baseline'
      ? S.listening !== 'got'
      : variant === 'proposed'
        ? (S.flagOn && S.clientSdk && S.listening !== 'got' && !mem.seen && !mem.dismissed)
        : (S.flagOn && S.listening !== 'got');

    if (variant === 'v2') {
      if (eligible && !mem.dismissed) {
        mem.dismissed = true; persist(); renderSwitcher();   // "once" is recorded on show, not on Done
        S.modal = 'success'; renderModal(); renderTargeting(); return;
      }
      S.modal = null; renderModal(); renderTargeting(); toast('<span class="ok">&#10003;</span> Flag saved'); return;
    }

    S.modal = null; renderModal();
    S.nudge = eligible;
    renderTargeting();
    if (variant === 'proposed' && !eligible) {
      const why = !S.flagOn ? 'flag is off, nothing shipped' : !S.clientSdk ? 'no client-side SDK, replay cannot work here' : (mem.seen || mem.dismissed) ? 'this member already saw it once' : 'sessions already connected';
      toast('<span class="ok">&#10003;</span> Flag saved <span style="color:var(--gray500)">&middot; no nudge: ' + why + '</span>');
    } else {
      toast('<span class="ok">&#10003;</span> Flag saved');
    }
    if (variant !== 'baseline') { const rs = page.querySelector('#reviewsave'); if (rs) rs.focus(); }
    setTimeout(measureFold, 800);
  }

  // ---------- monitoring destination ----------
  function go(view, dest) {
    S.view = view; S.dest = dest; fold.classList.remove('show');
    if (view === 'monitoring') renderMonitoring(dest); else renderTargeting();
    page.scrollTop = 0;
  }

  const SNIPPET = `<span class="kw">import</span> { Observability } <span class="kw">from</span> <span class="str">'@launchdarkly/observability'</span>;
<span class="kw">import</span> { SessionReplay } <span class="kw">from</span> <span class="str">'@launchdarkly/session-replay'</span>;

<span class="kw">const</span> client = <span class="fn">initialize</span>(clientSideId, context, {
  plugins: [<span class="kw">new</span> <span class="fn">Observability</span>(), <span class="kw">new</span> <span class="fn">SessionReplay</span>({ privacySetting: <span class="str">'strict'</span> })],
});`;

  function setupSteps() {
    const done = S.listening;
    return `<div class="steps3">
      <div class="step"><div class="num ${done ? 'done' : ''}">${done ? '&#10003;' : '1'}</div><div class="sb">
        <div class="st">Install two packages</div>
        <div class="sdsc">In the app where <b>new-checkout-flow</b> is evaluated.</div>
        <div class="codeblock">npm install @launchdarkly/observability @launchdarkly/session-replay<button class="copybtn dark" data-copy="npm install @launchdarkly/observability @launchdarkly/session-replay">Copy</button></div>
      </div></div>
      <div class="step"><div class="num ${done ? 'done' : ''}">${done ? '&#10003;' : '2'}</div><div class="sb">
        <div class="st">Add the plugins where you initialize the SDK</div>
        <div class="sdsc">Text and inputs are masked by default. You control sampling and retention.</div>
        <div class="codeblock">${SNIPPET}<button class="copybtn dark" data-copy="plugins">Copy</button></div>
      </div></div>
      <div class="step"><div class="num ${done ? 'done' : ''}">${done ? '&#10003;' : '3'}</div><div class="sb">
        <div class="st">Redeploy</div>
        <div class="sdsc">Sessions appear here within a minute of the first user hitting the new build.</div>
        ${!done ? '<button class="primarybtn" id="deployed" style="padding:7px 14px;font-size:13px">I’ve deployed</button>' :
          done === 'waiting' ? '<div class="listen"><span class="spinner"></span>Listening for your first session in Production… <span style="color:var(--gray500)">We’ll email you when it lands.</span></div>' :
          '<div class="listen got"><span class="check">&#10003;</span>First session recorded 12 seconds ago &middot; <a href="#" style="color:inherit;text-decoration:underline">Watch it</a></div>'}
      </div></div>
    </div>
    <div class="promptline"><span>&#10022;</span><span class="grow">Prefer your coding agent? One prompt does all three steps against your codebase.</span><button class="copybtn" data-copy="Add LaunchDarkly observability and session replay to this app...">Copy prompt</button></div>`;
  }

  function renderMonitoring(dest) {
    crumb.innerHTML = `<span class="bigcrumb"><span class="dim">Flags /</span> new-checkout-flow <span class="dim">/ Monitoring</span></span>`;
    const sub = ['Evaluations', 'Errors', 'Sessions', 'Logs', 'Traces'].map(s => `<span class="subtab ${s === 'Sessions' ? 'on' : ''}">${s === 'Sessions' ? '&#9655; ' : ''}${s}</span>`).join('');
    let body;
    if (dest === 'current') {
      body = `<div class="setupwrapper"><div class="setupbox">
        <div class="badge">&#8767;</div>
        <h2>Set up Observability</h2>
        <div class="sd">Connect the Observability SDK to see errors, logs, traces, and sessions tied to your feature flag variations.</div>
        <div class="langrow" style="opacity:.45;text-decoration:line-through" title="Hidden under the cross-product-expansion flag in the PR"><span class="ghostbtn">&#9635; Explore sandbox</span><span class="ghostbtn">&#128214; View documentation</span></div>
        <div class="manual">
          <h3>Add observability plugins to your SDK</h3>
          <div style="display:flex;gap:10px;margin-bottom:12px"><span class="fselect" style="min-width:200px">JavaScript <span class="chev">&#9662;</span></span><span class="fselect" style="min-width:120px">npm <span class="chev">&#9662;</span></span></div>
          <div class="codeblock" style="margin-bottom:10px">npm install @launchdarkly/observability @launchdarkly/session-replay</div>
          <div class="codeblock">${SNIPPET}</div>
          <div class="helper" style="margin-top:10px">Read the <a href="#">JavaScript observability docs</a>.</div>
        </div>
      </div></div>`;
    } else {
      body = `<div class="setupwrapper"><div class="setupbox" style="text-align:left">
        <div style="display:flex;gap:14px;align-items:flex-start">
          ${stillFrame()}
          <div style="flex:1">
            <h2 style="margin-top:2px">Set up session replay for new-checkout-flow</h2>
            <div class="sd" style="margin:0 0 10px">Sessions show up on this tab tagged with the variation each user was served. Errors, logs, and traces turn on with the same setup. <span class="inclchip">5,000 sessions a month included</span></div>
            <div class="detected"><span class="dot"></span>React (web) &middot; connected to Production <a href="#" class="chg">Change</a></div>
          </div>
        </div>
        <div class="manual" id="steps">${setupSteps()}</div>
      </div></div>`;
    }
    page.innerHTML = `${TABS('Monitoring')}${ENVTABS}<div class="subtabs">${sub}</div>${body}`;
    renderSidebar();
    page.querySelectorAll('[data-tab]').forEach(t => t.addEventListener('click', () => { if (t.dataset.tab === 'Targeting') go('targeting'); }));
    wireSetup(page);
  }

  function wireSetup(root) {
    root.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => { b.textContent = 'Copied'; b.classList.add('copied'); setTimeout(() => { b.textContent = b.dataset.copy.startsWith('Add') ? 'Copy prompt' : 'Copy'; b.classList.remove('copied'); }, 1400); }));
    const dep = root.querySelector('#deployed');
    if (dep) dep.addEventListener('click', () => {
      S.listening = 'waiting'; refreshSteps(root);
      setTimeout(() => { S.listening = 'got'; refreshSteps(root); toast('<span class="ok">&#9655;</span> First session recorded on new-checkout-flow'); }, 3500);
    });
  }
  function refreshSteps(root) {
    const s = root.querySelector('#steps'); if (s) { s.innerHTML = setupSteps(); wireSetup(root); }
    renderSidebar();
  }

  // ---------- V3 drawer ----------
  function renderDrawer() {
    if (!S.drawer) { const d = document.getElementById('drawer'); if (d) d.remove(); const o = document.getElementById('doverlay'); if (o) o.remove(); return; }
    const o = document.createElement('div'); o.id = 'doverlay'; o.className = 'overlay'; o.style.background = 'rgba(24,26,31,.25)';
    o.addEventListener('click', (e) => { if (e.target === o) { S.drawer = false; renderDrawer(); } });
    const d = document.createElement('div'); d.id = 'drawer'; d.className = 'drawer'; d.setAttribute('role', 'dialog');
    d.innerHTML = `<div class="dhead"><div><h2>Set up session replay</h2><p class="dsub">For <b>new-checkout-flow</b> in Production &middot; <span class="inclchip">5,000 sessions a month included</span></p></div><button class="dclose" id="dclose" aria-label="Close">&#10005;</button></div>
      <div class="dbody">
        <div style="margin:12px 0 4px"><div class="detected"><span class="dot"></span>React (web) &middot; connected to Production <a href="#" class="chg">Change</a></div></div>
        <div id="steps">${setupSteps()}</div>
        <div class="helper" style="margin-top:14px">Once sessions arrive they live under <b>Monitoring › Sessions</b> on this flag, and in Telemetry for the whole project.</div>
      </div>`;
    document.body.appendChild(o); document.body.appendChild(d);
    d.querySelector('#dclose').addEventListener('click', () => { S.drawer = false; renderDrawer(); });
    wireSetup(d);
  }

  // ---------- flow map: where in the flow each version puts the nudge ----------
  const fmap = document.createElement('div'); fmap.className = 'fmap'; document.body.appendChild(fmap);
  let fmapOpen = qs.get('map') !== '0';
  function renderFlowMap() {
    if (!fmapOpen) { fmap.classList.remove('show'); return; }
    const cur = variant === 'baseline';
    const nodes = [
      { t: 'Open flag', s: 'Targeting tab' },
      { t: 'Edit targeting', s: 'rule / toggle' },
      { t: 'Review and save', s: 'modal' },
      { t: 'Save applies', s: 'direct save', markCur: true, markProp: true },
      { t: 'Stay / leave', s: 'median 20 s, then reload or move on' },
      { t: 'Monitoring › Sessions', s: 'empty state', markPrd: true },
    ];
    fmap.innerHTML = `<div class="fmhead"><b>Where the nudge sits in the flow</b><span class="fmlegend"><i class="cur"></i>current (shipped)<i class="prop"></i>proposed<i class="prd"></i>PRD alternative</span><button class="fmx" id="fmx" title="Hide">&#10005;</button></div>
      <div class="fmrow">${nodes.map((n, i) => `
        <div class="fmnode ${i === 3 ? 'hot' : ''}">
          <div class="fmt">${n.t}</div><div class="fms">${n.s}</div>
          ${n.markCur ? '<div class="fmpin cur">Current: card below the footer, any direct save, every time until X on this flag in this browser</div>' : ''}
          ${n.markProp ? '<div class="fmpin prop">Proposed: one line in the save confirmation, only if flag on + client SDK + no sessions, once per member</div>' : ''}
          ${n.markPrd ? '<div class="fmpin prd">PRD: replay-led empty state here, gated the same way (also the destination of the proposed line)</div>' : ''}
        </div>${i < nodes.length - 1 ? '<div class="fmarrow">&#8594;</div>' : ''}`).join('')}
      </div>
      <div class="fmnote">You are looking at: <b>${LABEL[variant]}</b>. ${cur ? 'Save with the flag off or with no client SDK and the card still shows.' : 'Save with the flag off or with no client SDK and nothing shows; the proposed line only appears when replay can actually work for this account.'}</div>`;
    fmap.classList.add('show');
    fmap.querySelector('#fmx').addEventListener('click', () => { fmapOpen = false; renderFlowMap(); });
  }

  // ---------- coach: tells you what to click to reach the nudge ----------
  const coach = document.createElement('div'); coach.className = 'coach'; document.body.appendChild(coach);
  let coachHidden = qs.get('coach') === '0';
  function highlight(sel) {
    document.querySelectorAll('.coach-target').forEach(e => e.classList.remove('coach-target'));
    if (!sel) return;
    const el = document.querySelector(sel); if (el) el.classList.add('coach-target');
  }
  function renderCoach() {
    if (coachHidden) { coach.innerHTML = ''; coach.classList.remove('show'); highlight(null); return; }
    const nudgeVisible = !!document.querySelector('#nudgecard');
    let step, text, target;
    if (S.view === 'monitoring') {
      step = 'Step 4 of 4'; target = null;
      text = variant === 'baseline'
        ? 'This is where the current button lands: the generic <b>Set up Observability</b> box. Nothing says "session replay" or knows which SDK you use. Click <b>Targeting</b> to go back.'
        : 'Proposed destination: replay-led, SDK detected, three steps. Click <b>I\u2019ve deployed</b> to see the listening state. Click <b>Targeting</b> to go back.';
    } else if (S.modal === 'review') {
      step = 'Step 3 of 4'; target = '#msave';
      text = 'Click <b>Save changes</b>. In production this is the trigger: a save that applies immediately (not an approval request, not scheduled).';
    } else if (nudgeVisible) {
      step = 'Step 4 of 4'; target = '#nudgecard';
      text = variant === 'baseline'
        ? 'The nudge. It appeared because you saved, nothing else was checked: flag ' + (S.flagOn ? 'on' : '<b>off</b>') + ', client SDK ' + (S.clientSdk ? 'yes' : '<b>no</b>') + '. Click <b>Set up session replay</b> to see where it goes, or <b>X</b> to dismiss (this flag, this browser only). Then save again: it comes back.'
        : 'The proposed nudge, in the footer you just used. It only appeared because the flag is on, a client SDK is connected, and you have not seen it before. <b>Not now</b> hides it for you forever.';
    } else if (dirty()) {
      step = 'Step 2 of 4'; target = '#reviewsave';
      text = 'Now click <b>Review and save</b> in the footer.';
    } else {
      step = 'Step 1 of 4';
      if (variant === 'proposed' && (mem.seen || mem.dismissed)) {
        target = null;
        text = 'This member already saw the proposed nudge once, so it will not show again. Click <b>Reset</b> in the top bar to start over.';
      } else if (variant === 'baseline' && (mem.dismissedFlags || {})['new-checkout-flow']) {
        target = '#toggle';
        text = 'Dismissed for this flag in this browser. Save again on this flag: nothing. (On any other flag it would show.) Click <b>Reset</b> to clear.';
      } else {
        target = '#editrule';
        text = 'Make a targeting change: click <b>Edit</b> on Rule 2 (switches the rollout to 50/50) or flip the <b>flag toggle</b>. Tip: turn the flag <b>off</b> to see the difference between current and proposed.';
      }
    }
    coach.innerHTML = `<div class="ctop"><span class="cstep">${step}</span><span class="cvar">${LABEL[variant]}</span><button class="cx" id="coachx" title="Hide guide">&#10005;</button></div><div class="ctext">${text}</div><div class="cbtns"><button class="cplay" id="coachplay">&#9654; Play the flow for me</button></div>`;
    coach.classList.add('show');
    highlight(target);
    coach.querySelector('#coachx').addEventListener('click', () => { coachHidden = true; renderCoach(); });
    coach.querySelector('#coachplay').addEventListener('click', playFlow);
  }
  function playFlow() {
    if (S.view !== 'targeting') go('targeting');
    const steps = [
      () => { if (!dirty()) { S.rollout = S.rollout === 25 ? 50 : 25; renderTargeting(); } },
      () => { S.modal = 'review'; renderModal(); renderCoach(); },
      () => { save(); },
    ];
    let i = 0; const tick = () => { if (i < steps.length) { steps[i++](); setTimeout(tick, 900); } };
    tick();
  }
  const _rt = renderTargeting, _rm = renderModal, _rmon = renderMonitoring;
  renderTargeting = function () { _rt(); renderCoach(); renderFlowMap(); };
  renderModal = function () { _rm(); renderCoach(); };
  renderMonitoring = function (d) { _rmon(d); renderCoach(); };

  // ---------- switcher ----------
  const sw = document.createElement('div'); sw.className = 'switcher'; document.body.appendChild(sw);
  const wp = document.createElement('div'); wp.className = 'whypanel'; document.body.appendChild(wp);
  function renderSwitcher() {
    const dismissedTxt = variant === 'baseline'
      ? ((mem.dismissedFlags || {})['new-checkout-flow'] ? 'dismissed: this flag, this browser' : 'not dismissed')
      : variant === 'proposed'
        ? (mem.dismissed ? 'dismissed for this member, forever' : mem.seen ? 'seen once by this member' : 'not seen yet')
        : (mem.dismissed ? (variant === 'v2' ? 'shown once already' : 'dismissed for this member') : 'not dismissed');
    const sdkUrl = new URL(location.href); sdkUrl.searchParams.set('sdk', S.clientSdk ? '0' : '1');
    sw.innerHTML = '<span class="slabel">Mock</span>' +
      VARIANTS.map(v => `<a href="?v=${v}" class="${v === variant ? 'on' : ''}">${LABEL[v]}</a>`).join('') +
      `<button class="why" id="whybtn">What this is</button><button class="why" id="mapbtn">Flow map</button><button class="resetbtn" id="resetbtn" title="Clears this member's dismissal for this variant">Reset</button><span class="statuspill">${dismissedTxt}</span><a class="${S.clientSdk ? 'on' : ''}" href="${sdkUrl.pathname + sdkUrl.search}" title="Scenario: does this account have a client-side SDK connected?">client SDK: ${S.clientSdk ? 'yes' : 'no'}</a>`;
    wp.innerHTML = WHY[variant];
    sw.querySelector('#whybtn').addEventListener('click', () => wp.classList.toggle('open'));
    sw.querySelector('#mapbtn').addEventListener('click', () => { fmapOpen = !fmapOpen; renderFlowMap(); });
    sw.querySelector('#resetbtn').addEventListener('click', () => { localStorage.removeItem(KEY); location.reload(); });
  }

  renderSwitcher();
  renderTargeting();

  // ---------- deep links for screenshots / demos ----------
  // ?auto=save  : edit Rule 2 (25 -> 50) and save immediately.  ?auto=off : turn the flag off and save.
  // ?view=monitoring&dest=current|improved : open the Sessions destination directly.
  const auto = qs.get('auto');
  if (auto === 'save' || auto === 'off') {
    if (auto === 'off') S.flagOn = false; else S.rollout = 50;
    renderTargeting();
    S.modal = 'review'; renderModal();
    setTimeout(save, 50);
  }
  if (qs.get('view') === 'monitoring') go('monitoring', qs.get('dest') || (variant === 'baseline' ? 'current' : 'improved'));
})();
