/* Plans-page pricing calculator prototype. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  // Foundation pay-as-you-go pricing. Monthly rates and included quantities come from
  // packages/plan-manager/src/planData/foundationPlan.ts (HOSTS freeQuantity 5 / 1200c,
  // MAU freeQuantity 1000 / 1000c per 1k) and the copy strings in
  // static/ld/components/billing/PlanSummaryDetails/PlanSummaryDetails.tsx and
  // packages/plan-manager/src/PricePaymentSummary/OverageInfoTable.tsx.
  var PRICING = {
    sc:   { included: 5,    block: 1,     monthly: 12, annual: 10,    label: 'service connection' },
    mau:  { included: 1000, block: 1000,  monthly: 10, annual: 8.33,  label: '1,000 MAU' },
    keys: { included: 0,    block: 10000, monthly: 33, annual: 27.75, label: '10,000 keys' }
  };

  // Free Developer plan limits: developer2025Plan.ts lines 37-38
  // (freeProduct(HOSTS, 5, 1), freeProduct(MONTHLY_ACTIVE_USERS, 1000, 1000)).
  var DEVELOPER_LIMITS = { sc: 5, mau: 1000, keys: 0 };
  var SALES_THRESHOLD_ANNUAL = 11000;

  var $ = function (id) { return document.getElementById(id); };
  var inputs = { sc: $('in-sc'), mau: $('in-mau'), keys: $('in-keys') };
  var billing = 'monthly';

  var fmtInt = function (n) { return n.toLocaleString('en-US'); };
  var fmtMoney = function (n) {
    var rounded = Math.round(n);
    return '$' + fmtInt(rounded);
  };
  var fmtRate = function (n) { return (n % 1 === 0) ? '$' + n : '$' + n.toFixed(2); };

  function readInput(el) {
    var v = parseInt(el.value, 10);
    return isNaN(v) || v < 0 ? 0 : v;
  }

  // Blocks above the included amount, rounded up.
  function blocks(qty, p) {
    var over = Math.max(0, qty - p.included);
    return Math.ceil(over / p.block);
  }

  function lineCost(qty, p, rateKey) {
    return blocks(qty, p) * p[rateKey];
  }

  function estimate() {
    var q = { sc: readInput(inputs.sc), mau: readInput(inputs.mau), keys: readInput(inputs.keys) };
    var monthly = {}, annual = {}, totalMonthly = 0, totalAnnualMo = 0;
    Object.keys(PRICING).forEach(function (k) {
      monthly[k] = lineCost(q[k], PRICING[k], 'monthly');
      annual[k]  = lineCost(q[k], PRICING[k], 'annual');
      totalMonthly += monthly[k];
      totalAnnualMo += annual[k];
    });
    return {
      q: q, monthly: monthly, annual: annual,
      totalMonthly: totalMonthly,
      totalAnnualMo: totalAnnualMo,
      totalAnnualYr: totalAnnualMo * 12
    };
  }

  function usageText(k, e) {
    var p = PRICING[k], qty = e.q[k], b = blocks(qty, p);
    if (qty === 0 && k === 'keys') { return 'none'; }
    var s = fmtInt(qty);
    if (p.included > 0) { s += ' (' + fmtInt(Math.min(qty, p.included)) + ' included'; }
    if (b > 0) { s += (p.included > 0 ? ', ' : ' (') + fmtInt(b) + (p.block === 1 ? ' billable' : ' block' + (b === 1 ? '' : 's')); }
    if (p.included > 0 || b > 0) { s += ')'; }
    return s;
  }

  function render() {
    var e = estimate();
    var rateKey = billing === 'annual' ? 'annual' : 'monthly';
    var perMonth = billing === 'annual' ? e.totalAnnualMo : e.totalMonthly;

    $('total-label').textContent = billing === 'annual' ? 'Estimated monthly cost, billed annually' : 'Estimated monthly cost';
    $('total').textContent = fmtMoney(perMonth) + '/mo';
    $('total-annual').textContent = billing === 'annual'
      ? fmtMoney(e.totalAnnualYr) + '/yr billed annually. ' + fmtMoney(e.totalMonthly) + '/mo if billed monthly.'
      : 'or ' + fmtMoney(e.totalAnnualYr) + '/yr billed annually (2 months free).';

    ['sc', 'mau', 'keys'].forEach(function (k) {
      var p = PRICING[k];
      var rate = fmtRate(p[rateKey]) + ' per ' + p.label + '/mo';
      if (p.included > 0) { rate = 'First ' + fmtInt(p.included) + ' included, then ' + rate; }
      $(k + '-rate').textContent = rate;
      $(k + '-usage').textContent = usageText(k, e);
      $(k + '-cost').textContent = fmtMoney(billing === 'annual' ? e.annual[k] : e.monthly[k]);
    });

    var fitsDeveloper = e.q.sc <= DEVELOPER_LIMITS.sc && e.q.mau <= DEVELOPER_LIMITS.mau && e.q.keys <= DEVELOPER_LIMITS.keys;
    var salesSized = e.totalAnnualYr > SALES_THRESHOLD_ANNUAL;
    $('state-dev').hidden = !fitsDeveloper;
    $('state-sales').hidden = fitsDeveloper || !salesSized;
    $('state-continue').hidden = fitsDeveloper || salesSized;

    $('card-estimate').textContent = 'Estimated: ' + fmtMoney(perMonth) + '/mo for your inputs';
  }

  // Mode switching (control / treatment) with ?mode= support.
  function setMode(mode, updateUrl) {
    mode = mode === 'treatment' ? 'treatment' : 'control';
    document.body.setAttribute('data-mode', mode);
    document.querySelectorAll('.pill').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-set-mode') === mode);
    });
    if (updateUrl) {
      var url = new URL(window.location.href);
      url.searchParams.set('mode', mode);
      history.replaceState(null, '', url);
    }
  }

  document.querySelectorAll('.pill').forEach(function (b) {
    b.addEventListener('click', function () { setMode(b.getAttribute('data-set-mode'), true); });
  });

  document.querySelectorAll('.seg-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      billing = b.getAttribute('data-billing');
      document.querySelectorAll('.seg-btn').forEach(function (x) {
        var on = x === b;
        x.classList.toggle('on', on);
        x.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      render();
    });
  });

  Object.keys(inputs).forEach(function (k) {
    inputs[k].addEventListener('input', function () {
      $('trial-note').hidden = true;
      render();
    });
  });

  $('prefill').addEventListener('click', function () {
    inputs.sc.value = 3; inputs.mau.value = 1200; inputs.keys.value = 0;
    $('trial-note').hidden = false;
    render();
  });

  $('continue').addEventListener('click', function () {
    var card = $('foundation-card');
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('highlight');
    setTimeout(function () { card.classList.remove('highlight'); }, 2200);
  });

  // Boot: read ?mode= and optional ?sc=&mau=&keys= (handy for deep links and screenshots).
  var params = new URLSearchParams(window.location.search);
  ['sc', 'mau', 'keys'].forEach(function (k) {
    if (params.has(k)) { inputs[k].value = readInput({ value: params.get(k) }); }
  });
  setMode(params.get('mode'), false);
  render();
})();
