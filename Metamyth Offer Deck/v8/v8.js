/* METAMYTH v8 — page behaviour. No scroll-scrubbing: motion is entry-only. */
(function () {
  'use strict';
  var doc = document.documentElement, body = document.body;
  var reduced = doc.classList.contains('reduced');
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* smooth scroll, kept light so the page still feels like reading */
  var lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: .11, smoothWheel: true, wheelMultiplier: 1.05 });
    window.MMLenis = lenis;
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var el = document.querySelector(a.getAttribute('href')); if (!el) return;
        e.preventDefault(); bar.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false');
        lenis.scrollTo(el, { offset: -10, duration: 1.4 });
        history.replaceState(null, '', a.getAttribute('href'));
      });
    });
  }

  /* entry reveals: once shown, text stays */
  var rvs = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    rvs.forEach(function (el) { io.observe(el); });
  } else rvs.forEach(function (el) { el.classList.add('in'); });

  /* chapter bar: active chapter, progress, light zones, mobile menu */
  var bar = document.getElementById('bar'), menuBtn = bar.querySelector('.menu-btn');
  var links = {}; bar.querySelectorAll('.chapters a').forEach(function (a) { links[a.dataset.ch] = a; });
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-ch]')).filter(function (s) { return s.tagName !== 'A'; });
  var lightZones = Array.prototype.slice.call(document.querySelectorAll('.white, .day'));
  var prog = bar.querySelector('.progress i');
  menuBtn.addEventListener('click', function () { var o = bar.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o ? 'true' : 'false'); });

  var shards = Array.prototype.slice.call(document.querySelectorAll('[data-drift]'));
  var thread = document.querySelector('.thread');
  var current = '';
  function frame() {
    var vh = innerHeight, mid = vh * .4;
    // active chapter
    for (var i = sections.length - 1; i >= 0; i--) {
      var r = sections[i].getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) {
        var ch = sections[i].dataset.ch;
        if (ch !== current) {
          if (links[current]) links[current].removeAttribute('aria-current');
          if (links[ch]) links[ch].setAttribute('aria-current', 'true');
          current = ch;
        }
        break;
      }
    }
    prog.style.setProperty('--p', (scrollY / Math.max(1, doc.scrollHeight - vh)).toFixed(4));
    var light = lightZones.some(function (z) { var r = z.getBoundingClientRect(); return r.top <= 40 && r.bottom > 40; });
    body.classList.toggle('on-light', light);
    // gentle drift on the shards (position, not playback)
    if (!reduced) for (var k = 0; k < shards.length; k++) {
      var s = shards[k], rr = s.getBoundingClientRect();
      if (rr.bottom < -200 || rr.top > vh + 200) continue;
      var off = (rr.top + rr.height / 2 - vh / 2) * parseFloat(s.dataset.drift);
      s.style.translate = '0 ' + off.toFixed(1) + 'px';
    }
    if (thread) { var tr = thread.getBoundingClientRect(); thread.style.setProperty('--t', reduced ? 1 : clamp((vh * .7 - tr.top) / tr.height, 0, 1).toFixed(3)); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* the Magnetic Story System constellation (copy from V3) */
  var NODES = [
    ['Purpose', 'The North Star that makes every decision obvious and every sacrifice worth making.', [1, 8, 9]],
    ['Future', 'The world you’re building, vivid enough to navigate toward and magnetic enough to pull others in.', [0, 2, 7]],
    ['People', 'The ones who find themselves in your story before they fully understand why.', [1, 3, 4]],
    ['Offer', 'Your transformation packaged as a path others pay to walk.', [2, 5, 9]],
    ['Media', 'Every piece of content a thread in a pattern that builds toward something real.', [2, 5, 7]],
    ['Pitch', 'How you communicate worth in a way that moves people and capital simultaneously.', [3, 4, 6]],
    ['Team', 'Alignment that doesn’t need management because the story does it.', [5, 7, 8]],
    ['World', 'Beyond products, the culture, community, and meaning that forms around what’s true.', [1, 4, 6]],
    ['Decisions', 'Clarity so complete you know instantly what serves the mission and what doesn’t.', [0, 6, 9]],
    ['Authority', 'The wound transformed into the credential no one else can replicate.', [0, 3, 8]]
  ];
  var svg = document.getElementById('mss-map');
  if (svg) {
    var NS = 'http://www.w3.org/2000/svg', C = 300, R = 210, pts = NODES.map(function (n, i) { var a = (i * 36 - 90) * Math.PI / 180; return [C + R * Math.cos(a), C + R * Math.sin(a)]; });
    var el = function (t, at) { var e = document.createElementNS(NS, t); for (var k in at) e.setAttribute(k, at[k]); return e; };
    var gLines = el('g', {}), gNodes = el('g', {}), lines = [];
    svg.appendChild(el('circle', { cx: C, cy: C, r: 252, fill: 'none', stroke: '#3fd0bc', 'stroke-opacity': .07 }));
    svg.appendChild(el('circle', { cx: C, cy: C, r: R, fill: 'none', stroke: '#3fd0bc', 'stroke-opacity': .14 }));
    svg.appendChild(gLines); svg.appendChild(gNodes);
    for (var i = 0; i < 10; i++) for (var j = i + 1; j < 10; j++) {
      var ln = el('line', { x1: pts[i][0], y1: pts[i][1], x2: pts[j][0], y2: pts[j][1], stroke: '#3fd0bc', 'stroke-opacity': .06, 'stroke-width': .6 });
      ln.dataset.a = i; ln.dataset.b = j; gLines.appendChild(ln); lines.push(ln);
    }
    var core = el('g', {});
    core.appendChild(el('circle', { cx: C, cy: C, r: 62, fill: '#3fd0bc', 'fill-opacity': .1, stroke: '#7ff0e0', 'stroke-opacity': .5 }));
    var t1 = el('text', { x: C, y: C - 6, 'text-anchor': 'middle', fill: '#9ff6ea', 'font-family': 'Futura, sans-serif', 'font-size': 12, 'letter-spacing': '.14em' }); t1.textContent = 'YOUR';
    var t2 = el('text', { x: C, y: C + 12, 'text-anchor': 'middle', fill: '#9ff6ea', 'font-family': 'Futura, sans-serif', 'font-size': 12, 'letter-spacing': '.14em' }); t2.textContent = 'STORY';
    core.appendChild(t1); core.appendChild(t2); svg.appendChild(core);
    var nodes = NODES.map(function (n, i) {
      var g = el('g', { class: 'node', tabindex: 0, role: 'button', 'aria-label': n[0] + ': ' + n[1] });
      var spoke = el('line', { x1: C, y1: C, x2: pts[i][0], y2: pts[i][1], stroke: '#3fd0bc', 'stroke-opacity': .16 });
      gLines.appendChild(spoke);
      var halo = el('circle', { cx: pts[i][0], cy: pts[i][1], r: 44, fill: '#3fd0bc', 'fill-opacity': 0 });
      var ring = el('circle', { class: 'ring', cx: pts[i][0], cy: pts[i][1], r: 33, fill: '#0b1d18', stroke: '#3fd0bc', 'stroke-opacity': .5 });
      var tx = el('text', { x: pts[i][0], y: pts[i][1] + 4, 'text-anchor': 'middle' }); tx.textContent = n[0].toUpperCase();
      g.appendChild(halo); g.appendChild(ring); g.appendChild(tx); gNodes.appendChild(g);
      g.addEventListener('mouseenter', function () { show(i); });
      g.addEventListener('focus', function () { show(i); });
      g.addEventListener('click', function () { show(i); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nodes[(i + 1) % 10].g.focus(); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); nodes[(i + 9) % 10].g.focus(); }
      });
      return { g: g, halo: halo, ring: ring, tx: tx, spoke: spoke };
    });
    var nEl = document.getElementById('mss-n'), dEl = document.getElementById('mss-d'), cEl = document.getElementById('mss-c');
    function show(i) {
      var on = [i].concat(NODES[i][2]);
      nodes.forEach(function (n, k) {
        var lit = on.indexOf(k) > -1, me = k === i;
        n.ring.setAttribute('fill-opacity', 1); n.ring.setAttribute('stroke-opacity', lit ? 1 : .25); n.ring.setAttribute('r', me ? 38 : 33);
        n.halo.setAttribute('fill-opacity', me ? .18 : 0); n.tx.setAttribute('fill-opacity', lit ? 1 : .35);
        n.spoke.setAttribute('stroke-opacity', me ? .8 : .1);
      });
      lines.forEach(function (l) { var a = +l.dataset.a, b = +l.dataset.b, lit = (a === i && NODES[i][2].indexOf(b) > -1) || (b === i && NODES[i][2].indexOf(a) > -1); l.setAttribute('stroke-opacity', lit ? .75 : .05); l.setAttribute('stroke-width', lit ? 1.4 : .6); });
      nEl.textContent = NODES[i][0]; dEl.textContent = NODES[i][1]; cEl.textContent = NODES[i][2].map(function (k) { return NODES[k][0]; }).join(' · ');
    }
    show(0);
  }
})();
