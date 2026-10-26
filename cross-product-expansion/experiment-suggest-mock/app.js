/* Experiment suggestion mock: where and how to SUGGEST an experiment from flag targeting.
   Every option suggests and hands off to the normal experiment design flow (with defaults prefilled).
   None of them create an experiment inline. */
(function () {
  const qs = new URLSearchParams(location.search);
  const VARIANTS = ['current', 'a', 'b', 'c', 'd'];
  const variant = VARIANTS.includes(qs.get('v')) ? qs.get('v') : 'current';
  const LABEL = {
    current: 'Current (shipped)',
    a: 'A: while setting a rollout',
    b: 'B: after saving a rollout',
    c: 'C: in Review and save',
    d: 'D: rule hint + explainer',
  };
  const WHY = {
    current: '<b>What shipped (experimentation arm).</b> A permanent "Create experiment from rule" button on the <b>default rule</b>, on every targeting page view, with no trigger and no reason. Clicking it opens the existing modal: name + hypothesis, nothing else. Submitting creates a <i>draft</i> and sends the user to the experiment design page with no metric chosen. The PRD said not to anchor on the default rule and asked for a card while configuring a percentage rollout. 15 of 15 clickers opened the modal; 2 submitted; 0 started.',
    a: '<b>Suggest at the moment of intent: while the user is setting a percentage split.</b> The rollout editor is the one place we know the person is deciding to divide traffic. The card explains, in their terms, why an experiment is the same action plus a metric, that it is included in their plan, and that error rate can be measured with no code. The CTA does not create anything: it remembers the intent, lets the save finish as normal, then opens the standard experiment design page with the rule, hypothesis and a suggested metric prefilled. "Not now" is per member. This is the PRD moment.',
    b: '<b>Suggest right after a save that created or changed a split.</b> Same slot as the proposed o11y line: the save confirmation in the footer. Only fires when the saved config has a percentage rollout on a rule, and only once per member per flag. The line says what the rule now does and offers to measure it. The CTA opens the standard design page with defaults. Cheapest to build.',
    c: '<b>Suggest inside Review and save.</b> When the diff contains a percentage rollout, the modal adds a note under the changes: what the split means, that an experiment can measure it, included in plan. A secondary button "Save and set up experiment" saves normally and then opens the design page. Primary stays "Save changes". Guaranteed impression at the point of commitment, one extra line in a modal E1 and E2 both want to use.',
    d: '<b>A hint on rollout rules, with an explainer before any flow.</b> Rules that split traffic get a small "Measure this split" control next to Edit (not on the default rule). Clicking opens a popover that explains why, what it needs, and what changes, then offers "Set up experiment" into the standard design page. Closest to the shipped button, but attached to the right rule and with a reason attached. Lowest urgency, always available.',
  };

  const KEY = 'exs-mock-' + variant;
  const mem = JSON.parse(localStorage.getItem(KEY) || '{}');
  function persist() { localStorage.setItem(KEY, JSON.stringify(mem)); }

  const S = {
    view: 'targeting',      // targeting | design
    editing: false,         // rule 2 editor open
    rollout: 100,           // % new-checkout on rule 2 (100 = no split)
    saved: { rollout: 100 },
    modal: null,            // null | 'review' | 'create'
    intent: false,          // A: user clicked "set up after saving"
    strip: false,           // B: post-save suggestion showing
    pop: false,             // D: explainer open
    coachHidden: qs.get('coach') === '0',
  };
  const dirty = () => S.rollout !== S.saved.rollout;
  const isSplit = (v) => v > 0 && v < 100;

  // ---------- chrome (same as the nudge mock) ----------
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
  const crumb = document.createElement('div'); crumb.className = 'titlerow'; main.appendChild(crumb);
  const content = document.createElement('div'); content.className = 'content';
  page.classList.add('page'); sidebar.classList.add('sidebar');
  content.appendChild(page); content.appendChild(sidebar); main.appendChild(content); row.appendChild(nav); row.appendChild(main);
  document.body.appendChild(row);
  const layer = document.createElement('div'); document.body.appendChild(layer);
  const snack = document.createElement('div'); snack.className = 'snack'; document.body.appendChild(snack);
  function toast(html) { snack.innerHTML = html; snack.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => snack.classList.remove('show'), 3200); }

  const TABS = (active) => `<div class="tabs">${['Targeting', 'Variations', 'Monitoring', 'Audience', 'Feedback', 'Code'].map(t => `<div class="tab ${t === active ? 'active' : ''}" data-tab="${t}" style="cursor:pointer">${t}</div>`).join('')}</div>`;
  const ENVTABS = `<div class="envtabs"><div class="envtab active"><span class="edot prod"></span>Production</div><div class="envtab"><span class="edot"></span>Test</div><div class="envplus">&#65291;</div></div>`;

  const SUGGEST = {
    title: 'Want to know which checkout actually performs better?',
    body: 'This rule already gives each enterprise and business user a random variation. An experiment adds one metric so you can see the difference. Included in your plan.',
    metaIncl: 'Included in your plan',
    metaMetric: 'Error rate measured automatically, no code',
    metaSplit: 'Same audience, same split',
    cta: 'Set up an experiment',
  };

  function suggestCard(ctaId, dismissId, ctaLabel) {
    return `<div class="suggest" id="suggestcard" role="status">
      <div class="sico">&#9651;</div>
      <div style="flex:1;min-width:0">
        <div class="st">${SUGGEST.title}</div>
        <p>${SUGGEST.body}</p>
        <div class="meta"><span>&#10003; ${SUGGEST.metaIncl}</span><span>&#10003; ${SUGGEST.metaMetric}</span><span>&#10003; ${SUGGEST.metaSplit}</span></div>
        <div class="btnrow"><button class="nudgebtn" id="${ctaId}">${ctaLabel || SUGGEST.cta}</button><button class="nudgeghost" id="${dismissId}">Not now</button></div>
      </div>
    </div>`;
  }

  // ---------- targeting ----------
  function renderTargeting() {
    crumb.innerHTML = `<span class="bigcrumb"><span class="dim">Flags /</span> new-checkout-flow <span class="dim">/ Targeting</span></span>`;
    const isDirty = dirty();
    const showA = variant === 'a' && S.editing && isSplit(S.rollout) && !mem.dismissed;
    const showB = variant === 'b' && S.strip && !mem.dismissed;
    const rule2Body = S.editing ? `
        <div class="rl">If <span class="cond">plan</span> is one of <span class="cond">enterprise</span> <span class="cond">business</span></div>
        <div class="rolleditor">
          <div style="font-size:13px;font-weight:600">Serve</div>
          <div class="presets">
            <button class="preset ${S.rollout === 100 ? 'on' : ''}" data-r="100">new-checkout to everyone</button>
            <button class="preset ${S.rollout === 25 ? 'on' : ''}" data-r="25">25 / 75 rollout</button>
            <button class="preset ${S.rollout === 50 ? 'on' : ''}" data-r="50">50 / 50 rollout</button>
            <button class="preset ${S.rollout === 10 ? 'on' : ''}" data-r="10">10 / 90 rollout</button>
          </div>
          ${isSplit(S.rollout) ? `<div class="rollbar"><span style="width:${S.rollout}%;background:var(--blue500)"></span><span style="width:${100 - S.rollout}%;background:var(--gray300)"></span></div>
          <div class="rollleg"><span><i style="background:var(--blue500)"></i>new-checkout ${S.rollout}%</span><span><i style="background:var(--gray300)"></i>legacy-checkout ${100 - S.rollout}%</span></div>` : ''}
          <div style="margin-top:10px"><button class="ghostbtn" id="doneedit">Done</button></div>
          ${showA ? suggestCard('actaA', 'adisA', 'Set up an experiment after saving') : ''}
          ${variant === 'a' && S.intent ? '<div class="helper" style="margin-top:8px;color:#4f46e5">&#10003; We will open experiment setup for this rule after you save.</div>' : ''}
        </div>` : `
        <div class="rl">If <span class="cond">plan</span> is one of <span class="cond">enterprise</span> <span class="cond">business</span></div>
        ${isSplit(S.rollout) ? `<div class="rl">Serve a percentage rollout</div>
        <div class="rollbar"><span style="width:${S.rollout}%;background:var(--blue500)"></span><span style="width:${100 - S.rollout}%;background:var(--gray300)"></span></div>
        <div class="rollleg"><span><i style="background:var(--blue500)"></i>new-checkout ${S.rollout}%</span><span><i style="background:var(--gray300)"></i>legacy-checkout ${100 - S.rollout}%</span></div>` :
        `<div class="rl">Serve <span class="diamond d-blue"></span><b>new-checkout</b></div>`}`;

    const rule2Head = `<div class="rulehead"><b>Rule 2</b><span style="display:flex;gap:8px;position:relative">
        ${variant === 'd' && isSplit(S.saved.rollout) && !S.editing ? `<button class="hintbtn" id="hintbtn" title="Measure which variation performs better">&#9651; Measure this split</button>` : ''}
        <span class="editbtn" id="editrule" style="cursor:pointer">&#9998; Edit</span>
        ${variant === 'd' && S.pop ? dPopover() : ''}
      </span></div>`;

    const defaultHead = `<div class="rulehead"><b>Default rule</b><span style="display:flex;gap:8px">
        ${variant === 'current' ? '<span class="editbtn" id="createexp" style="cursor:pointer">&#9651; Create experiment from rule</span>' : '<span class="editbtn" style="opacity:.5" title="Kebab menu (unchanged)">&#8942;</span>'}
        <span class="editbtn">&#9998; Edit</span></span></div>`;

    page.innerHTML = `
      ${TABS('Targeting')}
      ${ENVTABS}
      <div class="theadrow"><div class="thead">Targeting configuration for <span class="edot prod" style="display:inline-block;margin:0 2px"></span> Production</div>
        <div class="viewseg"><span class="vbtn on">&#9638; Visual</span><span class="vbtn">{ } JSON</span><span class="vico">&#9881;</span><span class="vico">&#8677;</span></div></div>
      <div class="stage"><div class="cnode">
        <div class="alltraffic">All traffic</div><div class="cline"></div>
        <div class="ccard" style="display:flex;align-items:center;gap:12px"><span>Flag is</span><button class="toggle on" aria-pressed="true">On<span class="knob"></span></button><span>serving variations based on rules</span></div>
        <div class="cline"></div><div class="plusnode">&#65291;</div><div class="cline"></div>
        <div class="rulecard"><div class="rulehead"><b>Rule 1</b><span class="editbtn">&#9998; Edit</span></div>
          <div class="rl">If <span class="cond">country</span> is one of <span class="cond">US</span> <span class="cond">CA</span></div>
          <div class="rl">Serve <span class="diamond d-blue"></span><b>new-checkout</b></div></div>
        <div class="cline"></div><div class="plusnode">&#65291;</div><div class="cline"></div>
        <div class="rulecard" id="rule2">${rule2Head}${rule2Body}</div>
        <div class="cline"></div><div class="plusnode">&#65291;</div><div class="cline"></div>
        <div class="rulecard">${defaultHead}<div class="rl">Serve <span class="diamond d-gray"></span><b>legacy-checkout</b></div></div>
      </div></div>
      <div class="footnote" style="margin-top:12px">If LaunchDarkly is unreachable, SDKs will serve the default defined in your code.</div>
      <div class="tfooter ${isDirty || showB ? 'sticky' : ''}" id="tfooter">
        ${showB ? bStrip() : `<div class="tfooterinner">
          <span class="fmsg">${isDirty ? '1 unsaved change to targeting' : '<span class="dim">No unsaved changes</span>'}</span>
          <span class="btnrow">${isDirty ? '<button class="ghostbtn" id="discard">Discard</button>' : ''}<button class="savebtn ${isDirty ? '' : 'dim'}" id="reviewsave" ${isDirty ? '' : 'disabled'}>Review and save</button></span>
        </div>`}
      </div>`;
    renderSidebar();

    page.querySelectorAll('[data-tab]').forEach(t => t.addEventListener('click', () => toast('Mock: only Targeting and the experiment design page are built')));
    page.querySelector('#editrule').addEventListener('click', () => { S.editing = !S.editing; S.pop = false; renderTargeting(); });
    const de = page.querySelector('#doneedit'); if (de) de.addEventListener('click', () => { S.editing = false; renderTargeting(); });
    page.querySelectorAll('.preset').forEach(b => b.addEventListener('click', () => { S.rollout = Number(b.dataset.r); renderTargeting(); }));
    const d = page.querySelector('#discard'); if (d) d.addEventListener('click', () => { S.rollout = S.saved.rollout; S.intent = false; S.editing = false; renderTargeting(); });
    const rs = page.querySelector('#reviewsave'); if (rs) rs.addEventListener('click', () => { S.modal = 'review'; renderModal(); });
    const ce = page.querySelector('#createexp'); if (ce) ce.addEventListener('click', () => { S.modal = 'create'; renderModal(); });
    const aC = page.querySelector('#actaA'); if (aC) aC.addEventListener('click', () => { S.intent = true; renderTargeting(); toast('Noted. Finish your change and save; experiment setup opens next.'); });
    const aD = page.querySelector('#adisA'); if (aD) aD.addEventListener('click', () => dismiss());
    const bC = page.querySelector('#bcta'); if (bC) bC.addEventListener('click', () => go('design'));
    const bD = page.querySelector('#bdis'); if (bD) bD.addEventListener('click', () => dismiss());
    const hb = page.querySelector('#hintbtn'); if (hb) hb.addEventListener('click', (e) => { e.stopPropagation(); S.pop = !S.pop; renderTargeting(); });
    const pc = page.querySelector('#popcta'); if (pc) pc.addEventListener('click', () => { S.pop = false; go('design'); });
    const px = page.querySelector('#popclose'); if (px) px.addEventListener('click', () => { S.pop = false; renderTargeting(); });
    if (showA && !mem.seenA) { mem.seenA = true; persist(); }
    const sc = page.querySelector('#suggestcard, #pop'); if (sc && !S.scrolledTo) { S.scrolledTo = true; sc.scrollIntoView({ block: 'center', behavior: 'auto' }); }
    if (!sc) S.scrolledTo = false;
    renderCoach();
  }

  function bStrip() {
    return `<div class="strip" id="suggestcard" role="status">
      <span class="savedmark"><span class="check">&#10003;</span>Saved to Production</span>
      <span class="stext"><b>Rule 2 now splits traffic ${S.saved.rollout}/${100 - S.saved.rollout}. Want to know which variation performs better?</b> <span class="inclchip">Experiments included in your plan</span><span class="sub">An experiment keeps this audience and split and adds one metric. Error rate can be measured with no code.</span></span>
      <span class="btnrow"><button class="nudgebtn" id="bcta">${SUGGEST.cta}</button><button class="nudgeghost" id="bdis">Not now</button></span>
    </div>`;
  }

  function dPopover() {
    return `<div class="pop" id="pop">
      <h4>Measure which checkout performs better</h4>
      <p>Rule 2 already gives each enterprise and business user a random variation. An experiment keeps that audience and split and adds a metric, so you can see the difference instead of guessing.</p>
      <ul><li>Included in your Foundation plan</li><li>Error rate is measured automatically from your telemetry; add your own event later if you want</li><li>Starting replaces this rule's rollout with an experiment-managed split (same audience)</li></ul>
      <div class="btnrow"><button class="nudgebtn" id="popcta">Set up experiment</button><button class="nudgeghost" id="popclose">Close</button></div>
    </div>`;
  }

  function renderSidebar() {
    sidebar.innerHTML = `
      <div class="sactrow"><span>&#8677;</span><span>&#128279;</span><span>&#128276;</span><span>&#9889;</span><span>&#128344;</span><span>&#8942;</span></div>
      <div class="prop"><div class="pt">Key</div><div class="pv" style="display:flex;justify-content:space-between;align-items:center;color:var(--gray700)">new-checkout-flow <span style="color:var(--gray400)">&#10697;</span></div></div>
      <div class="prop"><div class="pt">Description</div><div class="pv">Rewritten one-page checkout</div></div>
      <div class="prop"><div class="pt">Maintainer <span class="pencil">&#9998;</span></div><div class="pv" style="margin-top:4px"><span class="mchip"><span class="avatar">NF</span> Natalie Friedman</span></div></div>
      <div class="prop"><div class="pt">Variations <span class="pencil">&#9998;</span></div><div class="pv"><span class="diamond d-blue"></span>new-checkout<br><span class="diamond d-gray"></span>legacy-checkout</div></div>
      <div class="prop"><div class="pt">Connected SDKs</div><div class="pv">React (web) &middot; Node.js server</div></div>
      <div class="prop" style="border-bottom:none"><div class="pt">Experiments <span class="pencil">&#65291;</span></div><div class="pv">${S.view === 'design' ? '<span style="color:#4f46e5;font-weight:600">Draft: new-checkout-flow / Rule 2</span>' : 'None &middot; <span class="sublink">Add experiment</span>'}</div></div>`;
  }

  // ---------- modals ----------
  function renderModal() {
    if (!S.modal) { layer.innerHTML = ''; renderCoach(); return; }
    if (S.modal === 'review') {
      const splitNote = variant === 'c' && isSplit(S.rollout) && !mem.dismissed ? `<div class="mnote" id="suggestcard"><span>&#9651;</span><div><b>Rule 2 will split traffic ${S.rollout}/${100 - S.rollout}.</b> After saving you can measure which variation performs better. An experiment keeps this audience and split and adds one metric. Included in your plan.</div></div>` : '';
      layer.innerHTML = `<div class="overlay" id="overlay"><div class="modal" role="dialog" aria-modal="true">
        <div class="mhead"><h2>Review and save</h2><div class="msub">Changes to <b>new-checkout-flow</b> in <span class="edot prod" style="display:inline-block"></span> <b>Production</b></div></div>
        <div class="mbody">
          <div class="difflist"><div class="diffrow"><span class="dk">Rule 2</span><span class="dv"><span class="was">${S.saved.rollout === 100 ? 'new-checkout' : S.saved.rollout + '/' + (100 - S.saved.rollout)}</span>${S.rollout === 100 ? 'new-checkout to everyone' : `new-checkout ${S.rollout}% / legacy-checkout ${100 - S.rollout}%`}</span></div></div>
          ${splitNote}
          <div class="mlabel">Comment <span class="opt">(optional)</span></div>
          <div class="textarea">Describe this change for the audit log</div>
        </div>
        <div class="mfoot"><button class="ghostbtn" id="mcancel">Cancel</button>${splitNote ? '<button class="ghostbtn" id="msaveexp" style="border-color:#c7d2fe;color:#4f46e5">Save and set up experiment</button>' : ''}<button class="savebtn" id="msave">Save changes</button></div>
      </div></div>`;
      layer.querySelector('#mcancel').addEventListener('click', () => { S.modal = null; renderModal(); });
      layer.querySelector('#msave').addEventListener('click', () => save(false));
      const se = layer.querySelector('#msaveexp'); if (se) se.addEventListener('click', () => save(true));
    }
    if (S.modal === 'create') {
      layer.innerHTML = `<div class="overlay"><div class="modal" role="dialog" aria-modal="true" style="width:640px">
        <div class="mhead"><h2>Create experiment in Production</h2></div>
        <div class="mbody">
          <div class="mlabel">Experiment name <span style="color:#dc2626">*</span></div><div class="textarea" style="min-height:0;padding:8px 10px">Enter a name for your experiment</div>
          <div class="helper" style="margin:4px 0 12px">Ensure your name describes a key aspect of your experiment. Ex: Homepage CTA color</div>
          <div class="mlabel">Hypothesis</div><div class="textarea">If [I do something], then [something will happen] because [a reason].</div>
        </div>
        <div class="mfoot"><span style="margin-right:auto;font-size:12px;color:#6b7280">Maintainer: Natalie Friedman &middot; Add tags</span><button class="ghostbtn" id="mcancel">Cancel</button><button class="savebtn" id="mcreate">Create experiment</button></div>
      </div></div>`;
      layer.querySelector('#mcancel').addEventListener('click', () => { S.modal = null; renderModal(); });
      layer.querySelector('#mcreate').addEventListener('click', () => { S.modal = null; renderModal(); go('design', 'bare'); });
    }
    renderCoach();
  }

  function save(thenExperiment) {
    S.saved = { rollout: S.rollout }; S.editing = false; S.modal = null; renderModal();
    const splitSaved = isSplit(S.saved.rollout);
    if (variant === 'a' && S.intent) { S.intent = false; go('design'); return; }
    if (variant === 'c' && thenExperiment) { go('design'); return; }
    S.strip = variant === 'b' && splitSaved && !mem.dismissed && !(mem.seenFlags || {})['new-checkout-flow'];
    if (S.strip) { mem.seenFlags = mem.seenFlags || {}; mem.seenFlags['new-checkout-flow'] = true; persist(); }
    renderTargeting();
    toast('<span class="ok">&#10003;</span> Flag saved');
  }

  function dismiss() {
    mem.dismissed = true; persist(); S.strip = false; S.pop = false;
    toast('Dismissed for <b>you</b>. You can still start an experiment from the Experiments panel any time.');
    if (S.modal) renderModal(); else renderTargeting();
    renderSwitcher();
  }

  // ---------- destination: standard experiment design page, with defaults ----------
  function go(view, mode) {
    S.view = view; S.designMode = mode || 'prefilled';
    if (view === 'design') renderDesign(); else renderTargeting();
    page.scrollTop = 0;
  }
  function renderDesign() {
    const pre = S.designMode === 'prefilled';
    const r = isSplit(S.saved.rollout) ? S.saved.rollout : 50;
    crumb.innerHTML = `<span class="bigcrumb"><span class="dim">Experiments /</span> ${pre ? 'new-checkout-flow: Rule 2' : 'Untitled experiment'} <span class="dim">/ Design</span></span>`;
    page.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin:4px 0 14px"><span class="inclchip">Draft</span><span style="font-size:13px;color:#6b7280">${pre ? 'Created from Rule 2 on new-checkout-flow. Review the defaults, then start.' : 'Created from the default rule. Add a metric and hypothesis to start.'}</span><a href="#" id="backtarget" style="margin-left:auto;font-size:13px">&#8592; Back to targeting</a></div>
      <div class="design">
        <div>
          <div class="dsec"><h3>Hypothesis</h3>
            <div class="dfield"><div class="dlabel">Name ${pre ? '<span class="prefill">suggested</span>' : ''}</div><div class="dinput ${pre ? 'pref' : ''}">${pre ? 'new-checkout-flow: Rule 2' : '<span style="color:#9ca3af">Enter a name</span>'}</div></div>
            <div class="dfield"><div class="dlabel">Hypothesis ${pre ? '<span class="prefill">suggested, edit freely</span>' : ''}</div><div class="dinput ${pre ? 'pref' : ''}">${pre ? 'If enterprise and business users get new-checkout, then error rate will be at least as good as legacy-checkout, because the new flow has fewer steps.' : '<span style="color:#9ca3af">If [I do something], then [something will happen] because [a reason].</span>'}</div></div>
          </div>
          <div class="dsec"><h3>Metrics</h3>
            ${pre ? `<div class="metricrow"><span>&#9651;</span><span class="mk">Error rate</span><span style="color:#6b7280">primary &middot; auto-created from your telemetry &middot; lower is better</span><a href="#" style="margin-left:auto">Change</a></div>
            <div class="disclose">Add a metric you track in your app (checkout completed, for example) any time. The experiment needs one metric to start.</div>` :
            `<div class="dinput" style="color:#9ca3af">No metrics yet. <a href="#">Add a metric</a></div>
            <div class="disclose">An experiment needs at least one metric before it can start. Most Foundation drafts stall here.</div>`}
          </div>
          <div class="dsec"><h3>Audience and variations</h3>
            <div class="audrow"><b>Rule 2</b>: plan is one of enterprise, business &middot; <b>${pre ? 'same audience as the rule' : 'default rule: everyone not matched above'}</b></div>
            <div class="varbar"><span style="width:${r}%;background:var(--blue500)"></span><span style="width:${100 - r}%;background:var(--gray300)"></span></div>
            <div class="rollleg"><span><i style="background:var(--blue500)"></i>new-checkout ${r}%</span><span><i style="background:var(--gray300)"></i>legacy-checkout ${100 - r}%</span></div>
            <div class="disclose">Starting the experiment replaces the rule's rollout with an experiment-managed split. The audience stays the same.</div>
          </div>
        </div>
        <div class="dside">
          <div class="dsec"><h3>Ready to start?</h3>
            <div style="font-size:13px;color:#374151;line-height:1.5">${pre ? '&#10003; Metric chosen<br>&#10003; Hypothesis written<br>&#10003; Audience and split from Rule 2' : '&#10007; No metric<br>&#10007; No hypothesis<br>&#10003; Audience from default rule'}</div>
            <div class="dstart"><button class="ghostbtn">Save draft</button><button class="savebtn ${pre ? '' : 'dim'}" ${pre ? '' : 'disabled'}>Start experiment</button></div>
            <div class="disclose">Results appear on the flag's Monitoring tab and in Experiments.</div>
          </div>
        </div>
      </div>`;
    renderSidebar();
    page.querySelector('#backtarget').addEventListener('click', (e) => { e.preventDefault(); go('targeting'); });
    renderCoach();
  }

  // ---------- coach ----------
  const coach = document.createElement('div'); coach.className = 'coach'; document.body.appendChild(coach);
  function highlight(sel) { document.querySelectorAll('.coach-target').forEach(e => e.classList.remove('coach-target')); if (sel) { const el = document.querySelector(sel); if (el) el.classList.add('coach-target'); } }
  function renderCoach() {
    if (S.coachHidden) { coach.classList.remove('show'); highlight(null); return; }
    let step = '', text = '', target = null;
    if (S.view === 'design') { step = 'Destination'; text = S.designMode === 'prefilled' ? 'The standard experiment design page, with name, hypothesis, metric, audience and split filled in from the rule. Nothing was created inline; the user reviews and presses <b>Start</b>.' : 'Where the shipped button lands after the modal: no metric, no hypothesis, Start disabled. This is where Foundation drafts die.'; }
    else if (S.modal === 'create') { step = 'Step 2 of 3'; target = '#mcreate'; text = 'The shipped modal: name and hypothesis only. No reason, no metric, no plan info. Click <b>Create experiment</b>.'; }
    else if (S.modal === 'review') { step = variant === 'c' ? 'Step 4 of 5' : 'Step 4 of 5'; target = variant === 'c' && isSplit(S.rollout) && !mem.dismissed ? '#msaveexp' : '#msave'; text = variant === 'c' ? 'Option C lives here: the note under the diff explains the split, and <b>Save and set up experiment</b> saves normally then opens the design page.' : 'Click <b>Save changes</b>.'; }
    else if (variant === 'current') { step = 'Step 1 of 3'; target = '#createexp'; text = 'Shipped: a permanent button on the <b>default rule</b>, visible on every page view with no trigger. Click <b>Create experiment from rule</b>.'; }
    else if (document.querySelector('#suggestcard') && variant === 'b') { step = 'Step 5 of 5'; target = '#suggestcard'; text = 'Option B: the save confirmation suggests measuring the split you just saved. Once per member per flag. <b>Set up an experiment</b> opens the standard design page with defaults.'; }
    else if (variant === 'd' && S.pop) { step = 'Step 2 of 3'; target = '#pop'; text = 'Option D explains before any flow: why, what it needs, what changes. <b>Set up experiment</b> opens the design page.'; }
    else if (variant === 'd' && isSplit(S.saved.rollout) && !S.editing) { step = 'Step 1 of 3'; target = '#hintbtn'; text = 'Option D: rules that split traffic get a <b>Measure this split</b> control. The default rule does not. Click it.'; }
    else if (S.editing) {
      if (variant === 'a' && isSplit(S.rollout)) { step = 'Step 3 of 5'; target = '#suggestcard'; text = S.intent ? 'Intent noted. Click <b>Done</b>, then <b>Review and save</b>. Experiment setup opens after the save.' : 'Option A: the moment you choose a split, the suggestion appears under the editor. <b>Set up an experiment after saving</b> remembers the intent; nothing is created yet.'; }
      else { step = 'Step 2 of 5'; target = '.preset[data-r="50"]'; text = 'Pick a split, for example <b>50 / 50 rollout</b>.'; }
    }
    else if (dirty()) { step = 'Step 4 of 5'; target = '#reviewsave'; text = 'Click <b>Review and save</b>.'; }
    else if (mem.dismissed) { step = 'Reset'; text = 'This member dismissed the suggestion. Click <b>Reset</b> in the top bar.'; }
    else if (variant === 'd' && !isSplit(S.saved.rollout)) { step = 'Step 0 of 3'; target = '#editrule'; text = 'Option D only appears on rules that split traffic. Click <b>Edit</b> on Rule 2, pick a split, Done, then Review and save.'; }
    else { step = 'Step 1 of 5'; target = '#editrule'; text = 'Click <b>Edit</b> on Rule 2 to open the rollout editor.'; }
    coach.innerHTML = `<div class="ctop"><span class="cstep">${step}</span><span class="cvar">${LABEL[variant]}</span><button class="cx" id="coachx">&#10005;</button></div><div class="ctext">${text}</div><div class="cbtns"><button class="cplay" id="coachplay">&#9654; Play the flow for me</button></div>`;
    coach.classList.add('show'); highlight(target);
    coach.querySelector('#coachx').addEventListener('click', () => { S.coachHidden = true; renderCoach(); });
    coach.querySelector('#coachplay').addEventListener('click', playFlow);
  }
  function playFlow() {
    if (S.view !== 'targeting') go('targeting');
    const steps = variant === 'current'
      ? [() => { S.modal = 'create'; renderModal(); }, () => { S.modal = null; renderModal(); go('design', 'bare'); }]
      : variant === 'd'
        ? [() => { S.editing = true; renderTargeting(); }, () => { S.rollout = 50; renderTargeting(); }, () => { S.editing = false; S.modal = 'review'; renderModal(); }, () => save(false), () => { S.pop = true; renderTargeting(); }]
        : [() => { S.editing = true; renderTargeting(); }, () => { S.rollout = 50; renderTargeting(); }, () => { if (variant === 'a') { S.intent = true; renderTargeting(); } }, () => { S.editing = false; S.modal = 'review'; renderModal(); }, () => save(variant === 'c')];
    let i = 0; const tick = () => { if (i < steps.length) { steps[i++](); setTimeout(tick, 1000); } }; tick();
  }

  // ---------- switcher ----------
  const sw = document.createElement('div'); sw.className = 'switcher'; document.body.appendChild(sw);
  const wp = document.createElement('div'); wp.className = 'whypanel'; document.body.appendChild(wp);
  function renderSwitcher() {
    sw.innerHTML = '<span class="slabel">Suggest, not create</span>' + VARIANTS.map(v => `<a href="?v=${v}" class="${v === variant ? 'on' : ''}">${LABEL[v]}</a>`).join('') +
      `<button class="why" id="whybtn">What this is</button><button class="resetbtn" id="resetbtn">Reset</button><span class="statuspill">${mem.dismissed ? 'dismissed for this member' : 'not dismissed'}</span>`;
    wp.innerHTML = WHY[variant];
    sw.querySelector('#whybtn').addEventListener('click', () => wp.classList.toggle('open'));
    sw.querySelector('#resetbtn').addEventListener('click', () => { localStorage.removeItem(KEY); location.reload(); });
  }
  renderSwitcher(); renderTargeting();

  // deep links: ?auto=split (edit+50/50), ?auto=save (split then save), ?auto=review (open review with split), ?view=design&mode=bare|prefilled, ?pop=1
  const auto = qs.get('auto');
  if (auto === 'split') { S.editing = true; S.rollout = 50; renderTargeting(); }
  if (auto === 'intent') { S.editing = true; S.rollout = 50; S.intent = true; renderTargeting(); }
  if (auto === 'review') { S.rollout = 50; S.editing = false; renderTargeting(); S.modal = 'review'; renderModal(); }
  if (auto === 'save') { S.rollout = 50; S.editing = false; renderTargeting(); save(false); }
  if (auto === 'create') { S.modal = 'create'; renderModal(); }
  if (qs.get('pop') === '1') { S.saved = { rollout: 50 }; S.rollout = 50; S.pop = true; renderTargeting(); }
  if (qs.get('view') === 'design') go('design', qs.get('mode') || 'prefilled');
})();
