/* METAMYTH v6 — Layer 1 prototype. No dependencies. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var body = document.body;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var map = function (v, a, b) { return clamp((v - a) / (b - a), 0, 1); };

  /* ── reveal on scroll ── */
  var rvs = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    rvs.forEach(function (el) { io.observe(el); });
  } else {
    rvs.forEach(function (el) { el.classList.add('in'); });
  }

  /* ── chapter label, light zones, pill visibility ── */
  var navCh = document.querySelector('.nav-ch');
  var chapters = Array.prototype.slice.call(document.querySelectorAll('[data-chapter]'));
  var lightZones = Array.prototype.slice.call(document.querySelectorAll('.white-page, .adventure'));
  var hidePillZones = Array.prototype.slice.call(document.querySelectorAll('.threshold, .book, .white-page, .request-final, .finale'));
  var progress = document.querySelector('.progress');
  function inMid(el) {
    var r = el.getBoundingClientRect(), m = innerHeight * 0.5;
    return r.top <= m && r.bottom >= m;
  }

  /* ── the book ── */
  var openBtn = document.getElementById('open-book');
  var book = document.getElementById('book');
  var stage = book && book.querySelector('.book-stage');
  var pages = book ? {
    1: book.querySelector('.page[data-page="1"]'),
    2: book.querySelector('.page[data-page="2"]'),
    3: book.querySelector('.page[data-page="3"]')
  } : {};
  var staticBook = doc.classList.contains('static-book');
  if (book) book.hidden = true;

  if (openBtn && book) {
    openBtn.addEventListener('click', function () {
      book.hidden = false;
      openBtn.setAttribute('aria-expanded', 'true');
      openBtn.textContent = 'The book is open';
      openBtn.disabled = true;
      requestAnimationFrame(function () {
        var top = book.getBoundingClientRect().top + scrollY;
        scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
        var first = pages[1] && pages[1].querySelector('.page-title');
        if (first) { first.setAttribute('tabindex', '-1'); first.focus({ preventScroll: true }); }
      });
    });
  }

  function setBurn(page, b) {
    // b: 0 = intact, 1 = burned away
    page.style.setProperty('--r', (b * 150).toFixed(2) + '%');
    page.style.setProperty('--burning', b > 0.001 && b < 0.999 ? 1 : 0);
    page.style.visibility = b >= 0.999 ? 'hidden' : 'visible';
  }

  /* Timeline (spec): 0–15 open · 15–38 page I · 38–61 page II · 61–84 page III · 84–92 star · 92–100 white */
  function updateBook() {
    if (!book || book.hidden || staticBook) return;
    var r = book.getBoundingClientRect();
    var total = book.offsetHeight - innerHeight;
    var p = clamp(-r.top / total, 0, 1);
    stage.style.setProperty('--open', map(p, 0.02, 0.15).toFixed(3));
    pages[1].style.setProperty('--o', map(p, 0.07, 0.15).toFixed(3));
    pages[2].style.setProperty('--o', p > 0.15 ? 1 : 0);
    pages[3].style.setProperty('--o', p > 0.15 ? 1 : 0);
    setBurn(pages[1], map(p, 0.28, 0.38));
    setBurn(pages[2], map(p, 0.51, 0.61));
    setBurn(pages[3], map(p, 0.74, 0.86));
    stage.style.setProperty('--star', map(p, 0.80, 0.88).toFixed(3));
    stage.style.setProperty('--white', map(p, 0.88, 0.97).toFixed(3));
  }

  /* ── Adventure thread ── */
  var adv = document.querySelector('.adventure');
  var thread = adv && adv.querySelector('.thread');
  function updateThread() {
    if (!thread) return;
    var r = thread.getBoundingClientRect();
    var t = clamp((innerHeight * 0.65 - r.top) / r.height, 0, 1);
    thread.style.setProperty('--t', reduced ? 1 : t.toFixed(3));
  }

  /* ── frame loop on scroll ── */
  var ticking = false;
  function frame() {
    ticking = false;
    var max = doc.scrollHeight - innerHeight;
    progress.style.setProperty('--p', (scrollY / max).toFixed(4));
    for (var i = chapters.length - 1; i >= 0; i--) {
      if (inMid(chapters[i])) { if (navCh.textContent !== chapters[i].dataset.chapter) navCh.textContent = chapters[i].dataset.chapter; break; }
    }
    body.classList.toggle('is-light', lightZones.some(function (z) {
      var rr = z.getBoundingClientRect(); return rr.top <= 60 && rr.bottom >= 60;
    }));
    body.classList.toggle('hide-pill', scrollY < innerHeight * 0.6 || hidePillZones.some(inMid));
    updateBook();
    updateThread();
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  frame();

  /* ── Magnetic Story System ──
     DRAFT explanations, placeholder lines pending Zachary's copy. */
  var MSS = [
    ['Purpose', 'The golden thread running through everything you\'ve lived, named so clearly it pulls you forward.'],
    ['Future', 'A vision so vivid the people who need it can already see themselves living inside it.'],
    ['People', 'The ones who recognize themselves in your story and have been waiting for you to show up.'],
    ['Offer', 'Your transformation, forged into something people want to step into and pay to join.'],
    ['Media', 'Content that builds a world around your mission instead of feeding the algorithm.'],
    ['Pitch', 'The story that turns a conversation into an invitation and a meeting into a partnership.'],
    ['Team', 'A shared quest your collaborators recognize as their own.'],
    ['World', 'The culture, language and places your community wants to live in.'],
    ['Decisions', 'One story to steer by, so every choice moves the mission forward.'],
    ['Authority', 'Your wounds and your path become the proof that you are the one to lead this.']
  ];
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.mss-list [role="tab"]'));
  var panel = document.getElementById('mss-panel');
  function select(i, focus) {
    tabs.forEach(function (t, j) {
      t.setAttribute('aria-selected', j === i ? 'true' : 'false');
      t.tabIndex = j === i ? 0 : -1;
    });
    panel.querySelector('.mss-n').textContent = ('0' + (i + 1)).slice(-2) + ' / 10';
    panel.querySelector('.mss-t').textContent = MSS[i][0];
    panel.querySelector('.mss-d').textContent = MSS[i][1];
    panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
    if (focus) tabs[i].focus();
  }
  tabs.forEach(function (t, i) {
    t.tabIndex = i === 0 ? 0 : -1;
    t.addEventListener('click', function () { select(i); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = tabs.length;
      if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); select((i + 1) % n, true); }
      if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); select((i - 1 + n) % n, true); }
      if (k === 'Home') { e.preventDefault(); select(0, true); }
      if (k === 'End') { e.preventDefault(); select(n - 1, true); }
    });
  });
})();
