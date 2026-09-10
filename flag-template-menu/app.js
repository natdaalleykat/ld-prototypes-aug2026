/* Create flag button A/B prototype
 * Control   = shipped CreateFlagAction.tsx (ButtonGroup: LinkButton + chevron IconButton -> CreateFlagTemplateMenu)
 * Treatment = single primary button whose click opens the same menu, led by "Create from scratch"
 */

// ---------- inline icons (stand-ins for @launchpad-ui/icons names) ----------
const ICONS = {
  edit: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.3 2.2l2.5 2.5L5.5 13H3v-2.5z"/><path d="M9.8 3.7l2.5 2.5"/></svg>',
  rocket: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 9.5 3 9l1.5-3 2.6-.4C8.6 3.3 11 2.3 13.5 2.5c.2 2.5-.8 4.9-3.1 6.4L10 11.5l-3 1.5z"/><circle cx="10" cy="6" r="1"/><path d="M4.5 11.5 3 13"/></svg>',
  flask: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h4"/><path d="M6.5 2v4.5L3.2 12.4A1 1 0 0 0 4.1 14h7.8a1 1 0 0 0 .9-1.6L9.5 6.5V2"/><path d="M5 10.5h6"/></svg>',
  'toggle-off': '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1.5" y="4.5" width="13" height="7" rx="3.5"/><circle cx="5" cy="8" r="2" fill="currentColor" stroke="none"/></svg>',
  'arrow-right-thin': '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 8h11"/><path d="M9.5 4l4 4-4 4"/></svg>',
  'swap-horiz': '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 5.5h9"/><path d="M9 3l2.5 2.5L9 8"/><path d="M13.5 10.5h-9"/><path d="M7 8l-2.5 2.5L7 13"/></svg>',
  workflow: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="1.5" width="5" height="5" rx="1"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M6.5 4h3a2 2 0 0 1 2 2v3.5"/></svg>',
  'gear-outline': '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2.2"/><path d="M8 1.8v1.6M8 12.6v1.6M1.8 8h1.6M12.6 8h1.6M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1M3.6 12.4l1.1-1.1M11.3 4.7l1.1-1.1"/></svg>',
  chevron: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l4 4 4-4"/></svg>',
};

// ---------- templates: mirrors DEFAULT_TEMPLATES (flagTemplates.ts) + TEMPLATE_DESCRIPTIONS (templateDescriptions.ts) ----------
// The API names the custom template "Default" (see CreateFlagTemplateMenu-test.tsx), so that's the label here.
const TEMPLATES = {
  custom: {
    name: 'Default', icon: 'edit',
    desc: "A blank flag for specialized or complex use cases the templates don't cover.",
    type: 'boolean', variations: [['True', 'true'], ['False', 'false']],
    on: 'True', off: 'False', temporary: false, tags: [],
  },
  release: {
    name: 'Release', icon: 'rocket',
    desc: 'A temporary flag that serves false to everyone, then gradually rolls out true to 100%.',
    type: 'boolean', variations: [['Enabled', 'true'], ['Disabled', 'false']],
    on: 'Enabled', off: 'Disabled', temporary: true, tags: ['release'],
  },
  experiment: {
    name: 'Experiment', icon: 'flask',
    desc: 'A flag that tests a hypothesis using A/B tests or multi-armed bandits.',
    type: 'string', variations: [['Control', '"control"'], ['Treatment', '"treatment"']],
    on: 'Treatment', off: 'Control', temporary: true, tags: ['experiment'],
  },
  'kill-switch': {
    name: 'Kill switch', icon: 'toggle-off',
    desc: 'A permanent flag for shutting off non-core functionality or third-party tools in an emergency.',
    type: 'boolean', variations: [['On', 'true'], ['Off', 'false']],
    on: 'Off', off: 'On', temporary: false, tags: ['kill-switch', 'emergency'],
  },
  'migration-2-stage': {
    name: '2 stage migration', icon: 'arrow-right-thin', section: 'Migration',
    desc: "For migrations where you can't run the old and new systems at the same time.",
    type: 'string', variations: [['Stage 1', '"off"'], ['Stage 2', '"complete"']],
    on: 'Stage 2', off: 'Stage 1', temporary: true, tags: ['migration'],
  },
  'migration-4-stage': {
    name: '4 stage migration', icon: 'swap-horiz', section: 'Migration',
    desc: 'For migrations where you can run the old and new systems at the same time.',
    type: 'string', variations: [['Stage 1', '"off"'], ['Stage 2', '"dualwrite"'], ['Stage 3', '"live"'], ['Stage 4', '"complete"']],
    on: 'Stage 4', off: 'Stage 1', temporary: true, tags: ['migration'],
  },
  'migration-6-stage': {
    name: '6 stage migration', icon: 'workflow', section: 'Migration',
    desc: 'For migrations where you migrate reads and writes separately.',
    type: 'string', variations: [['Stage 1', '"off"'], ['Stage 2', '"dualwrite"'], ['Stage 3', '"shadow"'], ['Stage 4', '"live"'], ['Stage 5', '"rampdown"'], ['Stage 6', '"complete"']],
    on: 'Stage 6', off: 'Stage 1', temporary: true, tags: ['migration'],
  },
};

const TEMPLATE_ORDER = ['release', 'experiment', 'kill-switch'];
const MIGRATION_ORDER = ['migration-2-stage', 'migration-4-stage', 'migration-6-stage'];

// ---------- state ----------
const params = new URLSearchParams(location.search);
let variant = params.get('variant') === 'treatment' ? 'treatment' : 'control';
let currentTemplate = 'custom';

const el = (id) => document.getElementById(id);

// ---------- variant switching ----------
function setVariant(v, { updateUrl = true } = {}) {
  variant = v;
  document.querySelectorAll('.harness .pills button').forEach((b) => {
    const active = b.dataset.variant === v;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  });
  if (updateUrl) {
    const p = new URLSearchParams(location.search);
    p.set('variant', v);
    p.delete('open');
    history.replaceState(null, '', `${location.pathname}?${p}`);
  }
  closeDialog();
  renderCreateButton();
}

// ---------- menu markup ----------
function templateItem(key) {
  const t = TEMPLATES[key];
  return `
    <button class="menu-item" role="menuitem" tabindex="-1" data-template="${key}">
      <div class="mi-label"><span class="ic">${ICONS[t.icon]}</span>${t.name}</div>
      <div class="mi-desc">${t.desc}</div>
    </button>`;
}

function migrationSectionAndFooter() {
  return `
    <div role="group" aria-labelledby="mig-header">
      <div class="section-header" id="mig-header" role="presentation">Migration</div>
      ${MIGRATION_ORDER.map(templateItem).join('')}
    </div>
    <hr class="separator" role="separator" />
    <button class="menu-item footer" role="menuitem" tabindex="-1" data-action="flag-settings">
      <div class="mi-label"><span class="ic">${ICONS['gear-outline']}</span>Flag settings</div>
    </button>`;
}

// Control: shipped CreateFlagTemplateMenu order (Default, Release, Experiment, Kill switch, Migration..., Flag settings)
function controlMenu() {
  return `
    <div class="menu" id="templateMenu" role="menu" aria-label="Flag templates">
      <div role="group">
        ${['custom', ...TEMPLATE_ORDER].map(templateItem).join('')}
      </div>
      ${migrationSectionAndFooter()}
    </div>`;
}

// Treatment: "Create from scratch" first, then a Templates section
function treatmentMenu() {
  return `
    <div class="menu" id="templateMenu" role="menu" aria-label="Create flag">
      <div role="group">
        <button class="menu-item" role="menuitem" tabindex="-1" data-template="custom" data-scratch="1">
          <div class="mi-label"><span class="ic">${ICONS.edit}</span>Create from scratch</div>
          <div class="mi-desc">Start with a blank boolean flag and set everything yourself.</div>
        </button>
      </div>
      <div role="group" aria-labelledby="tpl-header">
        <div class="section-header" id="tpl-header" role="presentation">Templates</div>
        ${TEMPLATE_ORDER.map(templateItem).join('')}
      </div>
      ${migrationSectionAndFooter()}
    </div>`;
}

function renderCreateButton() {
  const slot = el('createBtnSlot');
  if (variant === 'control') {
    slot.innerHTML = `
      <div class="button-group">
        <button class="btn primary main" id="createFlagBtn">Create flag</button>
        <button class="icon-btn" id="menuTrigger" aria-label="Create flag from template" aria-haspopup="menu" aria-expanded="false">${ICONS.chevron}</button>
      </div>
      ${controlMenu()}`;
    el('createFlagBtn').addEventListener('click', () => openForm('custom', false));
  } else {
    slot.innerHTML = `
      <button class="btn primary with-chevron" id="menuTrigger" aria-haspopup="menu" aria-expanded="false">Create flag ${ICONS.chevron}</button>
      ${treatmentMenu()}`;
  }
  wireMenu();
}

// ---------- menu behavior (MenuTrigger + Popover + Menu, roughly react-aria semantics) ----------
function wireMenu() {
  const trigger = el('menuTrigger');
  const menu = el('templateMenu');
  const items = () => Array.from(menu.querySelectorAll('[role="menuitem"]'));

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menu.classList.contains('open')) closeMenu(); else openMenu(true);
  });
  trigger.addEventListener('keydown', (e) => {
    // Enter/Space fire click natively on <button>; arrows open and focus first/last item
    if (e.key === 'ArrowDown') { e.preventDefault(); openMenu(true); }
    if (e.key === 'ArrowUp') { e.preventDefault(); openMenu(true); focusItem(items().length - 1); }
  });

  menu.addEventListener('keydown', (e) => {
    const list = items();
    const idx = list.indexOf(document.activeElement);
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); focusItem((idx + 1) % list.length); break;
      case 'ArrowUp': e.preventDefault(); focusItem((idx - 1 + list.length) % list.length); break;
      case 'Home': e.preventDefault(); focusItem(0); break;
      case 'End': e.preventDefault(); focusItem(list.length - 1); break;
      case 'Escape': e.preventDefault(); closeMenu(); trigger.focus(); break;
      case 'Tab': closeMenu(); break;
      default: {
        // typeahead by first letter
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const k = e.key.toLowerCase();
          const start = idx + 1;
          for (let i = 0; i < list.length; i++) {
            const it = list[(start + i) % list.length];
            if (it.textContent.trim().toLowerCase().startsWith(k)) { focusItem((start + i) % list.length); break; }
          }
        }
      }
    }
  });

  menu.addEventListener('click', (e) => {
    const item = e.target.closest('[role="menuitem"]');
    if (!item) return;
    e.stopPropagation();
    closeMenu();
    if (item.dataset.action === 'flag-settings') {
      toast('Would navigate to Flag settings (project flag defaults)');
      return;
    }
    const key = item.dataset.template;
    const fromScratch = item.dataset.scratch === '1';
    openForm(key, !fromScratch);
  });

  function focusItem(i) { const list = items(); if (list[i]) list[i].focus(); }

  function openMenu(focusFirst) {
    menu.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    if (focusFirst) focusItem(0);
  }
  function closeMenu() {
    menu.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  document.addEventListener('click', (e) => { if (!menu.contains(e.target) && e.target !== trigger) closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('open')) { closeMenu(); trigger.focus(); } });

  window.__openMenu = () => openMenu(false);
}

// ---------- dialog (CreateFlagForm) ----------
function openDialog() { el('overlay').classList.add('open'); }
function closeDialog() { el('overlay').classList.remove('open'); }

function openForm(templateKey, showBanner) {
  openDialog();
  el('fName').value = '';
  el('fKey').value = '';
  el('fDesc').value = '';
  applyTemplate(templateKey, showBanner);
  setTimeout(() => el('fName').focus(), 0);
}

// Prototype equivalent of applyTemplateToForm() in templates/templateUtils.ts
function applyTemplate(key, showBanner) {
  currentTemplate = key;
  const t = TEMPLATES[key];
  el('fType').value = t.type;
  el('varRows').innerHTML = t.variations.map(([name, value]) => `
    <div class="var-row">
      <div class="var-value">${value}</div>
      <input type="text" value="${name}" aria-label="Variation name" />
    </div>`).join('');
  el('serveOn').textContent = t.on;
  el('serveOff').textContent = t.off;
  el('durationChip').innerHTML = `&#128336; ${t.temporary ? 'Temporary' : 'Permanent'}`;
  el('tagsChip').innerHTML = t.tags.length
    ? `&#127991; ${t.tags.map((x) => `<span class="tag">${x}</span>`).join(' ')}`
    : '&#127991;';
  el('inlineTemplateName').textContent = t.name;
  el('inlineTemplateIcon').innerHTML = ICONS[t.icon];
  el('appliedBanner').classList.toggle('show', !!showBanner);
  el('appliedName').textContent = t.name;
  el('appliedIcon').innerHTML = ICONS[t.icon];
}

function syncKey() {
  el('fKey').value = el('fName').value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

let toastTimer;
function toast(msg) {
  const t = el('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------- wiring ----------
document.querySelectorAll('.harness .pills button').forEach((b) => b.addEventListener('click', () => setVariant(b.dataset.variant)));
el('closeDialogBtn').addEventListener('click', closeDialog);
el('overlay').addEventListener('click', (e) => { if (e.target === el('overlay')) closeDialog(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && el('overlay').classList.contains('open')) closeDialog(); });
el('fName').addEventListener('input', syncKey);
el('inlineTemplateBtn').addEventListener('click', () => toast('Inline template selector (unchanged in both variants)'));
el('submitBtn').addEventListener('click', () => { closeDialog(); toast(`Flag created from ${TEMPLATES[currentTemplate].name} template (prototype)`); });

setVariant(variant, { updateUrl: false });
if (params.get('open') === '1') window.__openMenu();
