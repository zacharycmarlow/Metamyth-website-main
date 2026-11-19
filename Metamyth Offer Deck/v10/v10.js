/* METAMYTH v10 — pinned chapter stages. Each beat gets --a (presence 0..1) and --p (−1..1, local
   scroll position) and CSS turns those into layered depth. Without JS every beat is a static plate. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ss = (e0, e1, v) => { const x = clamp((v - e0) / (e1 - e0)); return x * x * (3 - 2 * x); };
  const STEP = 0.85; // viewport heights of scroll per beat

  // 1 · split headline and passage text into words for the melt (text stays in the DOM, in order)
  document.querySelectorAll('.beat').forEach(beat => {
    let i = 0;
    beat.querySelectorAll('.lk-b, .lk-s, .passage, .under, .glass p, .rupture, .next-line').forEach(el => {
      [...el.childNodes].forEach(node => {
        if (node.nodeType === 1) { node.classList.add('w'); node.style.setProperty('--i', i++); return; }
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const s = document.createElement('span'); s.className = 'w'; s.textContent = part; s.style.setProperty('--i', i++); frag.append(s);
        });
        node.replaceWith(frag);
      });
    });
    const ws = beat.querySelectorAll('.w'), n = Math.max(ws.length - 1, 1);
    ws.forEach(w => w.style.setProperty('--i', (+w.style.getPropertyValue('--i') / n).toFixed(3)));
  });

  // 2 · scenes, beats, ruler
  const scenes = [...document.querySelectorAll('.scene')].map(el => ({ el, beats: [...el.querySelectorAll('.beat')], num: el.dataset.num, name: el.dataset.name }));
  const all = scenes.flatMap((s, si) => s.beats.map((b, bi) => ({ b, si, bi })));
  const ruler = document.querySelector('.ruler');
  all.forEach((x, k) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Chapter ${scenes[x.si].num}, ${scenes[x.si].name}, part ${x.bi + 1}`);
    if (x.bi === 0) btn.classList.add('ch');
    btn.addEventListener('click', () => go(k));
    ruler.append(btn); x.btn = btn;
  });
  document.querySelector('.f-all').textContent = String(all.length).padStart(2, '0');
  const fNow = document.querySelector('.f-now'), rNum = document.querySelector('.r-num'), rName = document.querySelector('.r-name');

  let vh = innerHeight, tops = [];
  function layout() {
    vh = innerHeight;
    scenes.forEach(s => { s.el.style.height = `${s.beats.length * STEP * vh + vh}px`; });
    tops = scenes.map(s => s.el.getBoundingClientRect().top + scrollY);
  }

  // 3 · Lenis smoothing (skipped for reduced motion)
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
  }
  function go(k) {
    const x = all[k]; const y = tops[x.si] + (x.bi ? (x.bi + 0.5) * STEP * vh : 0);
    lenis ? lenis.scrollTo(y, { duration: 1.4 }) : scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }

  // 4 · per-frame: presence and position of every beat
  const t0 = performance.now(); let current = -1, ticking = false;
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    addEventListener('pointermove', e => { tmx = e.clientX / innerWidth - 0.5; tmy = e.clientY / innerHeight - 0.5; request(); }, { passive: true });
  }
  function frame() {
    ticking = false;
    const intro = reduce ? 1 : ss(0, 1, (performance.now() - t0) / 1600);
    const y = lenis ? lenis.scroll : scrollY;
    let best = 0, bestA = -1;
    scenes.forEach((s, si) => {
      const n = s.beats.length, t = (y - tops[si]) / (STEP * vh);
      s.beats.forEach((b, i) => {
        const c = i + 0.5;
        const a = (i === 0 ? 1 : ss(c - 0.85, c - 0.35, t)) * (i === n - 1 ? (t < n + 0.3 ? 1 : 0) : 1 - ss(c + 0.35, c + 0.85, t));
        const p = i === 0 && t < c ? 0 : clamp(t - c, -1, 1);
        const ta = (i === 0 ? 1 : ss(c - 0.42, c - 0.12, t)) * (i === n - 1 ? (t < n + 0.3 ? 1 : 0) : 1 - ss(c + 0.3, c + 0.55, t));
        const aa = (si === 0 && i === 0) ? a * intro : a;
        b.style.setProperty('--ta', ((si === 0 && i === 0) ? ta * intro : ta).toFixed(3));
        b.style.setProperty('--a', aa.toFixed(3));
        b.style.setProperty('--p', reduce ? 0 : p.toFixed(3));
        b.classList.toggle('live', aa > 0.002);
        const k = all.findIndex(x => x.b === b);
        if (a > bestA) { bestA = a; best = k; }
      });
    });
    if (best !== current) {
      current = best; const x = all[best];
      all.forEach((z, k) => z.btn.classList.toggle('on', k === best));
      fNow.textContent = String(best + 1).padStart(2, '0');
      rNum.textContent = `Chapter ${scenes[x.si].num}`; rName.textContent = scenes[x.si].name;
    }
    mx += (tmx - mx) * 0.08; my += (tmy - my) * 0.08;
    document.documentElement.style.setProperty('--mx', mx.toFixed(4));
    document.documentElement.style.setProperty('--my', my.toFixed(4));
    if (intro < 1 || Math.abs(tmx - mx) > 0.0005 || Math.abs(tmy - my) > 0.0005) request();
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { layout(); request(); });
  if (lenis) lenis.on('scroll', request);
  // keyboard: Page Down / Up move one beat
  addEventListener('keydown', e => {
    if (e.target.closest('input,textarea')) return;
    if (e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) { if (current < all.length - 1) { e.preventDefault(); go(current + 1); } }
    if (e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) { if (current > 0) { e.preventDefault(); go(current - 1); } }
  });
  layout(); request();
  addEventListener('load', () => { layout(); request(); });
})();
