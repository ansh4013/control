/**
 * analysis-fx.js
 * --------------
 * Small delight layer shared by the Analysis pages (no dependencies):
 *   - accent colour themes ("Appearance" dialog), saved per browser
 *   - confetti bursts for celebrations
 *   - odometer: rolling-digit live counters
 *   - respects "Reduce motion" (system setting or the Appearance toggle)
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AnalysisFX = api;
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  var PAL = {
    blue:    { name: 'Ocean',   c: ['#4f8cff', '#8b5cf6', '#22d3ee'] },
    emerald: { name: 'Emerald', c: ['#10b981', '#06b6d4', '#a3e635'] },
    sunset:  { name: 'Sunset',  c: ['#fb923c', '#f43f5e', '#fbbf24'] },
    rose:    { name: 'Rose',    c: ['#f43f5e', '#a855f7', '#fb7185'] },
    gold:    { name: 'Gold',    c: ['#f59e0b', '#ef4444', '#fde047'] },
    mono:    { name: 'Mono',    c: ['#94a3b8', '#cbd5e1', '#e2e8f0'] }
  };
  var AKEY = 'nexora_accent_v1', MKEY = 'nexora_motion_v1';
  var doc = root.document;
  function get(k) { try { return root.localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { root.localStorage.setItem(k, v); } catch (e) { /* ignore */ } }

  function accent() { var a = get(AKEY); return PAL[a] ? a : 'blue'; }
  function applyAccent(name) {
    if (!doc) return; var p = PAL[name] || PAL.blue, s = doc.documentElement.style;
    s.setProperty('--c1', p.c[0]); s.setProperty('--c2', p.c[1]); s.setProperty('--c3', p.c[2]);
  }
  function setAccent(name) { if (!PAL[name]) return; set(AKEY, name); applyAccent(name); }
  function reduced() {
    return get(MKEY) === 'reduce' || !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ---------- confetti ---------- */
  function confetti(opts) {
    if (!doc || reduced()) return;
    opts = opts || {};
    var cv = doc.createElement('canvas'), ctx = cv.getContext('2d'), W = cv.width = root.innerWidth, H = cv.height = root.innerHeight;
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999';
    doc.body.appendChild(cv);
    var cols = PAL[accent()].c.concat(['#fbbf24', '#34d399', '#f472b6', '#ffffff']), n = opts.count || 150, ps = [], i;
    for (i = 0; i < n; i++) ps.push({ x: W * (opts.x === undefined ? .5 : opts.x), y: H * .32, vx: (Math.random() - .5) * 15, vy: -Math.random() * 13 - 3, g: .28 + Math.random() * .12,
      s: 5 + Math.random() * 6, r: Math.random() * 6.28, vr: (Math.random() - .5) * .4, c: cols[i % cols.length], life: 0 });
    var t0 = null;
    (function frame(t) {
      if (t0 === null) t0 = t; var el = t - t0; ctx.clearRect(0, 0, W, H);
      ps.forEach(function (p) {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= .992; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - el / 3000); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6); ctx.restore();
      });
      if (el < 3000) root.requestAnimationFrame(frame); else cv.remove();
    })(root.performance.now());
  }

  /* ---------- odometer ---------- */
  var cssDone = false;
  function injectCSS() {
    if (cssDone || !doc) return; cssDone = true;
    var st = doc.createElement('style');
    st.textContent = '.reduce-motion *,.reduce-motion *::before,.reduce-motion *::after{animation:none!important;transition:none!important}.od{display:inline-flex;align-items:flex-start;line-height:1em;font-variant-numeric:tabular-nums}.od-d{display:inline-block;height:1em;overflow:hidden;vertical-align:top}' +
      '.od-c{display:flex;flex-direction:column;transition:transform 1s cubic-bezier(.2,.8,.2,1)}.od-c i{font-style:normal;height:1em;line-height:1em;display:block;text-align:center}.od-s{display:inline-block;height:1em;line-height:1em}' +
      '@media(prefers-reduced-motion:reduce){.od-c{transition:none}}';
    doc.head.appendChild(st);
  }
  function odometer(el, value) {
    if (!el) return; injectCSS();
    var s = Math.max(0, Math.round(Number(value) || 0)).toLocaleString('en-US');
    if (el.getAttribute('data-od') !== String(s.length)) {
      el.setAttribute('data-od', s.length); el.classList.add('od'); el.setAttribute('role', 'img'); el.innerHTML = '';
      for (var i = 0; i < s.length; i++) {
        var ch = s[i], span = doc.createElement('span');
        if (/\d/.test(ch)) { span.className = 'od-d'; var c = doc.createElement('span'); c.className = 'od-c'; c.innerHTML = '0123456789'.split('').map(function (d) { return '<i>' + d + '</i>'; }).join(''); span.appendChild(c); }
        else { span.className = 'od-s'; span.textContent = ch; }
        el.appendChild(span);
      }
    }
    el.setAttribute('aria-label', s);
    var cols = el.querySelectorAll('.od-c'), k = 0;
    for (var j = 0; j < s.length; j++) if (/\d/.test(s[j])) { cols[k++].style.transform = 'translateY(-' + s[j] + 'em)'; }
  }

  /* ---------- appearance dialog ---------- */
  function openAppearance() {
    if (!doc) return;
    var d = doc.getElementById('fxAppearance');
    if (!d) {
      d = doc.createElement('dialog'); d.id = 'fxAppearance'; d.setAttribute('aria-label', 'Appearance');
      d.style.cssText = 'border:1px solid var(--line2,rgba(160,170,255,.3));border-radius:20px;background:var(--card-solid,#10142a);color:var(--tx,#f3f5ff);padding:0;width:min(420px,92vw);font-family:inherit';
      doc.body.appendChild(d);
    }
    var cur = accent();
    d.innerHTML = '<div style="padding:1.2rem 1.3rem;display:grid;gap:1rem"><h3 style="margin:0;font-size:1.05rem">Appearance</h3>' +
      '<div><div style="font-size:.74rem;font-weight:700;opacity:.7;margin-bottom:.5rem">Accent colour</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem" role="radiogroup" aria-label="Accent colour">' +
      Object.keys(PAL).map(function (k) { var p = PAL[k]; return '<button type="button" role="radio" aria-checked="' + (k === cur) + '" data-fx-acc="' + k + '" style="border:2px solid ' + (k === cur ? 'var(--tx,#fff)' : 'transparent') + ';border-radius:14px;padding:.55rem;background:rgba(127,127,160,.14);color:inherit;cursor:pointer;font:600 .76rem inherit"><span style="display:block;height:26px;border-radius:8px;margin-bottom:.4rem;background:linear-gradient(135deg,' + p.c[0] + ',' + p.c[1] + ' 55%,' + p.c[2] + ')"></span>' + p.name + '</button>'; }).join('') + '</div></div>' +
      '<label style="display:flex;align-items:center;gap:.6rem;font-size:.84rem;cursor:pointer"><input type="checkbox" id="fxMotion"' + (get(MKEY) === 'reduce' ? ' checked' : '') + '> Reduce motion (no confetti or rolling counters)</label>' +
      '<div style="display:flex;justify-content:flex-end"><button type="button" data-fx-close style="border:1px solid var(--line2,rgba(160,170,255,.3));background:transparent;color:inherit;border-radius:10px;padding:.45rem .9rem;font:600 .8rem inherit;cursor:pointer">Done</button></div></div>';
    d.onclick = function (e) {
      var a = e.target.closest && e.target.closest('[data-fx-acc]');
      if (a) { setAccent(a.getAttribute('data-fx-acc')); openAppearance(); return; }
      if (e.target.closest && e.target.closest('[data-fx-close]')) d.close();
    };
    d.querySelector('#fxMotion').onchange = function (e) { set(MKEY, e.target.checked ? 'reduce' : 'full'); syncMotion(); };
    if (!d.open) d.showModal();
  }

  function syncMotion() { if (doc) doc.documentElement.classList.toggle('reduce-motion', reduced()); }
  d_init();
  function d_init() { applyAccent(accent()); injectCSS(); syncMotion(); }
  return { palettes: PAL, accent: accent, setAccent: setAccent, applyAccent: applyAccent, reduced: reduced, confetti: confetti, odometer: odometer, openAppearance: openAppearance };
});
