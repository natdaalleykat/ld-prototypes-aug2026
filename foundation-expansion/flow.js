/* Stepper for end-to-end flow pages. Pages contain multiple <section data-step
   data-title="..." data-note="..."> blocks inside [data-page]; this shows one at a
   time with a flow bar (dots + captions), prev/next, and a narration strip that
   explains what just happened in the product. Loads after chrome.js. */
(function () {
  const steps = Array.from(document.querySelectorAll('[data-step]'));
  if (!steps.length) return;
  let i = 0;

  const bar = document.createElement('div');
  bar.className = 'flowbar';
  const dots = steps.map((s, n) => `<button class="fdot" data-n="${n}" title="${s.dataset.title || ''}">${n + 1}</button>`).join('<span class="fline"></span>');
  bar.innerHTML = `
    <button class="fnav" id="fprev">&#8592;</button>
    <div class="fdots">${dots}</div>
    <button class="fnav" id="fnext">&#8594;</button>
    <div class="fcap"><b id="ftitle"></b><span id="fnote"></span></div>`;
  const main = document.querySelector('.main');
  main.insertBefore(bar, main.querySelector('.content'));

  function show(n) {
    i = Math.max(0, Math.min(steps.length - 1, n));
    steps.forEach((s, k) => { s.style.display = k === i ? '' : 'none'; });
    document.querySelectorAll('.fdot').forEach((d, k) => d.classList.toggle('on', k === i));
    document.getElementById('ftitle').textContent = (i + 1) + '. ' + (steps[i].dataset.title || '');
    document.getElementById('fnote').textContent = steps[i].dataset.note || '';
    document.getElementById('fprev').disabled = i === 0;
    document.getElementById('fnext').disabled = i === steps.length - 1;
    window.scrollTo(0, 0);
  }
  document.getElementById('fprev').addEventListener('click', () => show(i - 1));
  document.getElementById('fnext').addEventListener('click', () => show(i + 1));
  document.querySelectorAll('.fdot').forEach((d) => d.addEventListener('click', () => show(+d.dataset.n)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(i + 1);
    if (e.key === 'ArrowLeft') show(i - 1);
  });
  // Allow in-page CTAs to jump steps: <button data-goto="2">
  document.querySelectorAll('[data-goto]').forEach((el) =>
    el.addEventListener('click', () => show(+el.dataset.goto)));
  show(0);
})();
