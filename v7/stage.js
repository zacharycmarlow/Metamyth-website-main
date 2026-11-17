/* METAMYTH v7 (draft 2) — the stage + melting words.
   One full-screen WebGL canvas behind the story. Scroll drives transitions between
   scene textures: MELT (liquid displacement crossfade, the default), TEAR (paper
   tear with a fibrous lip and cast shadow), BURN (real fire front: white-hot core,
   orange/red flame, widening char, embers, smoke), CUT (flash cut), BLOOM (light).
   Text blocks (.m) melt in and out with scroll via per-block SVG displacement. */
(function () {
  'use strict';
  var doc = document.documentElement, body = document.body;
  var reduced = doc.classList.contains('reduced');
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var sstep = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  var IMG = {
    'nebula': 'img/nebula.webp', 'red-earth': 'img/red-earth.webp',
    'dollar-red': 'img/vault/dollar-red.webp', 'fake-mascots': 'img/vault/fake-mascots.webp',
    'cops-tower': 'img/vault/cops-tower.webp', 'oculus': 'img/vault/oculus.webp',
    'cash-grid': 'img/vault/cash-grid.webp', 'megaphone': 'img/vault/megaphone.webp',
    'dollar-burn': 'img/vault/dollar-red.webp', 'earthrise': 'img/earthrise.webp',
    'origin-cave': 'img/origin-cave.webp', 'arhuaco-cliff': 'img/vault/arhuaco-cliff.webp'
  };
  var MODE = { tear: 0, burn: 1, bloom: 2, melt: 4, cut: 5 };
  var first = 'nebula';

  var cv = document.getElementById('stage');
  var gl = (!reduced && cv.getContext('webgl2', { antialias: false, premultipliedAlpha: false, alpha: false })) || null;
  var ctx2d = null, W = 0, H = 0, DPR = 1, sources = {}, tex = {};

  function size() {
    DPR = Math.min(window.devicePixelRatio || 1, innerWidth < 700 ? 2 : 1.5);
    W = Math.round(innerWidth * DPR); H = Math.round(innerHeight * DPR);
    cv.width = W; cv.height = H; if (gl) gl.viewport(0, 0, W, H);
  }

  /* tileable perlin fbm + paper fibre (procedural, no assets) */
  function noiseCanvas(N, cells) {
    var perm = new Uint8Array(512), i, j;
    for (i = 0; i < 256; i++) perm[i] = i;
    for (i = 255; i > 0; i--) { j = (Math.random() * (i + 1)) | 0; var t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
    for (i = 0; i < 256; i++) perm[256 + i] = perm[i];
    var G = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
    var fade = function (t) { return t * t * t * (t * (t * 6 - 15) + 10); }, lerp = function (a, b, t) { return a + t * (b - a); };
    var grad = function (h, x, y) { var g = G[h & 7]; return g[0] * x + g[1] * y; };
    function perlin(x, y, per) {
      var X = Math.floor(x), Y = Math.floor(y), xf = x - X, yf = y - Y;
      var x0 = ((X % per) + per) % per, y0 = ((Y % per) + per) % per, x1 = (x0 + 1) % per, y1 = (y0 + 1) % per, u = fade(xf), v = fade(yf);
      return lerp(lerp(grad(perm[perm[x0] + y0], xf, yf), grad(perm[perm[x1] + y0], xf - 1, yf), u), lerp(grad(perm[perm[x0] + y1], xf, yf - 1), grad(perm[perm[x1] + y1], xf - 1, yf - 1), u), v);
    }
    var c = document.createElement('canvas'); c.width = c.height = N;
    var g2 = c.getContext('2d'), im = g2.createImageData(N, N);
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var k = (y * N + x) * 4;
      for (var ch = 0; ch < 3; ch++) {           // three independent fbm channels
        var n = 0, amp = .5, f = 1, per = cells, off = ch * 37.1;
        for (var o = 0; o < 5; o++) { n += amp * perlin((x / N * cells + off) * f, (y / N * cells + off * .7) * f, per * f); amp *= .5; f *= 2; }
        im.data[k + ch] = clamp(((n + 1) * .5) * 255, 0, 255) | 0;
      }
      im.data[k + 3] = 255;
    }
    g2.putImageData(im, 0, 0); return c;
  }
  function fibreCanvas(N) {
    var c = document.createElement('canvas'); c.width = c.height = N; var g = c.getContext('2d');
    g.fillStyle = 'rgb(128,128,128)'; g.fillRect(0, 0, N, N);
    for (var i = 0; i < 2600; i++) {
      var x = Math.random() * N, y = Math.random() * N, a = Math.random() * Math.PI, L = 6 + Math.random() * 34;
      g.strokeStyle = (Math.random() < .5 ? 'rgba(255,255,255,' : 'rgba(0,0,0,') + (0.05 + Math.random() * .12) + ')'; g.lineWidth = .6 + Math.random() * 1.4;
      g.beginPath();
      for (var dx = -N; dx <= N; dx += N) for (var dy = -N; dy <= N; dy += N) { g.moveTo(x + dx, y + dy); g.quadraticCurveTo(x + dx + Math.cos(a + .4) * L * .5, y + dy + Math.sin(a + .4) * L * .5, x + dx + Math.cos(a) * L, y + dy + Math.sin(a) * L); }
      g.stroke();
    }
    return c;
  }
  function flat(color) { var c = document.createElement('canvas'); c.width = c.height = 16; var g = c.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, 16, 16); return c; }
  function darkQuiet() {
    var c = document.createElement('canvas'); c.width = c.height = 512; var g = c.getContext('2d');
    var bg = g.createRadialGradient(256, 300, 0, 256, 280, 430);
    bg.addColorStop(0, '#1f1a0e'); bg.addColorStop(.5, '#0b130d'); bg.addColorStop(1, '#040806');
    g.fillStyle = bg; g.fillRect(0, 0, 512, 512); return c;
  }

  var VS = '#version 300 es\nin vec2 p;out vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FS = [
    '#version 300 es', 'precision highp float;', 'in vec2 vUv;out vec4 o;',
    'uniform sampler2D tA,tB,tN,tF;uniform vec2 sA,sB;uniform float uP,uT,uAsp,uM;',
    'vec3 N3(vec2 q){return texture(tN,q).rgb;}',
    'float fbm(vec2 q){return N3(q).r*.6+N3(q*2.3+.17).g*.3+N3(q*5.1+.41).b*.1;}',
    'vec3 tA_(vec2 uv,float z){return texture(tA,((uv-.5)*z)*sA+.5).rgb;}',
    'vec3 tB_(vec2 uv,float z){return texture(tB,((uv-.5)*z)*sB+.5).rgb;}',
    'void main(){',
    ' vec2 uv=vUv;float p=uP;vec2 au=vec2(uv.x*uAsp,uv.y);vec3 col;',
    // ---------- MELT: liquid displacement crossfade
    ' if(uM>3.5&&uM<4.5){',
    '  vec2 w=(N3(au*.55+vec2(0.,uT*.02)).rg-.5);vec2 w2=(N3(au*1.6-vec2(uT*.03,0.)).gb-.5);',
    '  float ea=sin(p*3.14159);',
    '  vec2 da=(w*.16+w2*.05)*p, db=(w*.16+w2*.05)*(1.-p);',
    '  vec3 a=vec3(tA_(uv+da*1.05,1.).r,tA_(uv+da,1.).g,tA_(uv+da*.95,1.).b);',
    '  vec3 b=vec3(tB_(uv-db*1.05,1.04-.04*p).r,tB_(uv-db,1.04-.04*p).g,tB_(uv-db*.95,1.04-.04*p).b);',
    '  float th=fbm(au*.35+vec2(0.,uT*.01));',
    '  float k=smoothstep(th-.22,th+.22,mix(-.25,1.25,p));',
    '  col=mix(a,b,k);col*=1.-.18*ea;',
    // ---------- TEAR: paper tear with fibrous lip and cast shadow
    ' } else if(uM<.5){',
    '  vec3 a=tA_(uv,1.-.04*p),b=tB_(uv,1.+.05*(1.-p));',
    '  float th=mix(uv.y,uv.x,smoothstep(.6,-.4,abs(uv.x-.5))*.5);',
    '  float fb=texture(tF,au*.9).r-.5;',
    '  th=th*2.-1.;th=th/1.2+(fbm(au*.25)-.5)*.45+fb*.16;th=th*.5+.5;',
    '  float e=mix(-.3,1.3,p)-th;float aa=fwidth(e)*1.5+.001;float k=smoothstep(-aa,aa,e);',
    '  float sh=(1.-smoothstep(0.,.06,e))*k;b*=1.-.55*sh;',
    '  col=mix(a,b,k);',
    '  float lip=smoothstep(0.,.002,-e)*(1.-smoothstep(.004,.016+.012*fb,-e));',
    '  col=mix(col,vec3(.93,.9,.84)*(.85+.3*fb),lip*.92);',
    // ---------- BURN: real fire front
    ' } else if(uM>.5&&uM<1.5){',
    '  vec3 a=tA_(uv,1.),b=tB_(uv,1.+.04*(1.-p));',
    '  float th=length((uv-vec2(.5,-.12))*vec2(uAsp*.7,1.))/length(vec2(uAsp*.7,1.15));',
    '  th+= (fbm(au*.5+vec2(0.,uT*.015))-.5)*.42+(fbm(au*2.2-vec2(0.,uT*.05))-.5)*.08;',
    '  float e=mix(-.25,1.25,p)-th;float k=smoothstep(-.0015,.0015,e);',
    '  float d=-e;',
    '  vec3 base=mix(a,b,k);',
    '  float scorch=(1.-k)*smoothstep(.16,.05,d);base=mix(base,base*vec3(.45,.28,.14),scorch*.75);',
    '  float charb=(1.-k)*smoothstep(.055,.0,d);base=mix(base,vec3(.035,.018,.01),charb*.96);',
    '  float fl=fbm(au*3.+vec2(0.,-uT*.6));float fl2=.7+.6*fl;',
    '  float core=(1.-smoothstep(0.,.006*fl2,abs(e)));',
    '  float flame=(1.-smoothstep(0.,.022*fl2,abs(e+.004)));',
    '  float red=(1.-smoothstep(0.,.05*fl2,abs(e+.012)))*(1.-k);',
    '  base+=vec3(.55,.06,.01)*red*1.2;base+=vec3(1.,.42,.06)*flame*1.6;base+=vec3(1.,.93,.7)*core*2.4;',
    '  float emb=smoothstep(.86,.97,N3(au*4.+vec2(0.,-uT*.15)).r)*(1.-smoothstep(.0,.07,d))*(1.-k);',
    '  base+=vec3(1.,.55,.15)*emb*(.6+.8*sin(uT*9.+uv.x*50.));',
    '  float smoke=k*(1.-smoothstep(0.,.22,e))*fbm(au*1.2+vec2(.1,-uT*.08));',
    '  base=mix(base,vec3(.16,.14,.13),smoke*.55);',
    '  col=base;',
    // ---------- CUT: flash cut
    ' } else if(uM>4.5){',
    '  vec3 a=tA_(uv,1.+.06*p),b=tB_(uv,1.08-.08*smoothstep(.5,1.,p));',
    '  col=p<.5?a:b;float f=1.-smoothstep(0.,.14,abs(p-.5));col=mix(col,vec3(1.,.97,.9),f*.85);',
    // ---------- BLOOM: light from the centre
    ' } else {',
    '  vec3 a=tA_(uv,1.),b=tB_(uv,1.);',
    '  float th=length((uv-.5)*vec2(uAsp,1.))/length(vec2(uAsp,1.)*.5)+(fbm(au*.4)-.5)*.1;',
    '  float e=mix(-.3,1.3,p)-th;float k=smoothstep(-.02,.02,e);',
    '  col=mix(a,b,k)+vec3(1.,.95,.84)*(1.-smoothstep(0.,.09,abs(e)))*.9;',
    ' }',
    ' o=vec4(col,1.);',
    '}'].join('\n');

  var prog, U = {}, tNoise, tFibre;
  function compile(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  function makeTex(src, repeat) {
    var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    var wr = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE; gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wr); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wr);
    return { t: t, w: src.width, h: src.height };
  }
  function initGL() {
    try {
      prog = gl.createProgram(); gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      ['tA', 'tB', 'tN', 'tF', 'sA', 'sB', 'uP', 'uT', 'uAsp', 'uM'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
      gl.uniform1i(U.tA, 0); gl.uniform1i(U.tB, 1); gl.uniform1i(U.tN, 2); gl.uniform1i(U.tF, 3);
      tNoise = makeTex(noiseCanvas(256, 4), true); tFibre = makeTex(fibreCanvas(512), true);
    } catch (e) { console.warn('stage: WebGL unavailable, crossfade fallback', e); gl = null; }
    if (!gl) ctx2d = cv.getContext('2d');
  }
  function coverScale(w, h) { var r = (w / h) / (W / H); return r > 1 ? [1 / r, 1] : [1, r]; }
  function upload(id) { if (!gl || !sources[id]) return; if (tex[id]) gl.deleteTexture(tex[id].t); tex[id] = makeTex(sources[id], false); }
  function loadImg(url) { return new Promise(function (res) { var im = new Image(); im.decoding = 'async'; im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = url; }); }

  /* ───── scroll → stage ───── */
  var txs = [], state = { a: first, b: first, p: 0, m: 0 }, dirty = true, t0 = performance.now();
  var dialFill = document.querySelector('.dial-track i'), dialCh = document.querySelector('.dial-ch');
  var chapters = Array.prototype.slice.call(document.querySelectorAll('[data-chapter]'));
  function collect() { txs = Array.prototype.slice.call(document.querySelectorAll('.tx')).filter(function (el) { return el.offsetParent !== null; }); }
  function compute() {
    var vh = innerHeight, s = { a: first, b: first, p: 0, m: 0 };
    for (var i = 0; i < txs.length; i++) {
      var r = txs[i].getBoundingClientRect(), p = clamp((vh - r.top) / r.height, 0, 1), d = txs[i].dataset;
      if (p >= 1) { s = { a: d.b, b: d.b, p: 0, m: 0 }; continue; }
      if (p > 0) s = { a: d.a, b: d.b, p: p, m: MODE[d.mode] || 0 };
      break;
    }
    return s;
  }
  function render(now) {
    var a = state.a, b = state.b, t = (now - t0) / 1000;
    if (gl) {
      if (!tex[a] || !tex[b]) return;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[a].t);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex[b].t);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, tNoise.t);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, tFibre.t);
      var sa = coverScale(tex[a].w, tex[a].h), sb = coverScale(tex[b].w, tex[b].h);
      gl.uniform2f(U.sA, sa[0], sa[1]); gl.uniform2f(U.sB, sb[0], sb[1]);
      gl.uniform1f(U.uP, state.p); gl.uniform1f(U.uT, t); gl.uniform1f(U.uAsp, W / H); gl.uniform1f(U.uM, state.m);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else if (ctx2d) {
      var draw = function (id, al) { var s = sources[id]; if (!s) return; var r = Math.max(W / s.width, H / s.height); ctx2d.globalAlpha = al; ctx2d.drawImage(s, (W - s.width * r) / 2, (H - s.height * r) / 2, s.width * r, s.height * r); };
      ctx2d.globalAlpha = 1; draw(a, 1); if (state.p > 0) draw(b, state.p); ctx2d.globalAlpha = 1;
    }
  }

  /* ───── melting words (Zero) ───── */
  var NS = 'http://www.w3.org/2000/svg', defs = document.getElementById('melt-defs');
  var melts = reduced ? [] : Array.prototype.slice.call(document.querySelectorAll('.m')).map(function (el, i) {
    var f = document.createElementNS(NS, 'filter');
    f.setAttribute('id', 'melt' + i); f.setAttribute('x', '-15%'); f.setAttribute('y', '-40%'); f.setAttribute('width', '130%'); f.setAttribute('height', '180%');
    f.setAttribute('color-interpolation-filters', 'sRGB');
    var tb = document.createElementNS(NS, 'feTurbulence');
    tb.setAttribute('type', 'fractalNoise'); tb.setAttribute('baseFrequency', '0.006 0.022'); tb.setAttribute('numOctaves', '2'); tb.setAttribute('seed', String(i * 7 + 3)); tb.setAttribute('result', 't');
    var dm = document.createElementNS(NS, 'feDisplacementMap');
    dm.setAttribute('in', 'SourceGraphic'); dm.setAttribute('in2', 't'); dm.setAttribute('scale', '0'); dm.setAttribute('xChannelSelector', 'R'); dm.setAttribute('yChannelSelector', 'G');
    f.appendChild(tb); f.appendChild(dm); defs.appendChild(f);
    return { el: el, dm: dm, tb: tb, id: 'melt' + i, a: -1 };
  });
  function meltFrame(t) {
    var vh = innerHeight;
    for (var i = 0; i < melts.length; i++) {
      var M = melts[i], r = M.el.getBoundingClientRect();
      if (r.bottom < -vh * .3 || r.top > vh * 1.3) { if (M.a !== 1) { M.el.style.opacity = 0; M.a = 1; } continue; }
      var aIn = sstep(vh * .8, vh * 1.02, r.top), aOut = sstep(vh * .2, vh * -.02, r.bottom);
      var a = Math.max(aIn, aOut), dir = aIn >= aOut ? 1 : -1;
      if (Math.abs(a - M.a) < .002 && a < .002) continue;
      M.a = a;
      if (a < .002) { M.el.style.filter = 'none'; M.el.style.opacity = 1; M.el.style.transform = 'none'; continue; }
      M.dm.setAttribute('scale', (a * 110).toFixed(1));
      M.tb.setAttribute('baseFrequency', (0.005 + a * .004).toFixed(4) + ' ' + (0.02 + a * .02).toFixed(4));
      M.el.style.filter = 'url(#' + M.id + ') blur(' + (a * 7).toFixed(2) + 'px)';
      M.el.style.opacity = (1 - a * a * (3 - 2 * a)).toFixed(3);
      M.el.style.transform = 'translateY(' + (dir * a * 46).toFixed(1) + 'px) scale(' + (1 + a * .03).toFixed(3) + ',' + (1 + a * .14).toFixed(3) + ')';
    }
  }

  /* ───── frame loop ───── */
  var bookEl = document.getElementById('book');
  function frame(now) {
    var s = compute(), changed = s.a !== state.a || s.b !== state.b || Math.abs(s.p - state.p) > 1e-4;
    state = s;
    if (changed || dirty || (s.p > 0 && s.p < 1)) { render(now); dirty = false; }
    meltFrame(now);
    var max = doc.scrollHeight - innerHeight;
    dialFill.style.setProperty('--p', (scrollY / Math.max(1, max)).toFixed(4));
    for (var i = chapters.length - 1; i >= 0; i--) {
      var r = chapters[i].getBoundingClientRect();
      if (r.height > 0 && r.top <= innerHeight * .5 && r.bottom >= 0) { if (dialCh.textContent !== chapters[i].dataset.chapter) dialCh.textContent = chapters[i].dataset.chapter; break; }
    }
    var light = (s.a === 'white' && s.p < .5) || (s.b === 'white' && s.p > .5) || parseFloat(getComputedStyle(doc).getPropertyValue('--w') || 0) > .5;
    body.classList.toggle('is-light', light);
    body.classList.toggle('hide-pill', scrollY < innerHeight * .5 || light || body.classList.contains('book-live'));
    requestAnimationFrame(frame);
  }

  /* ───── book threshold ───── */
  var lenis = null;
  var openBtn = document.getElementById('open-book'), skipTx = document.getElementById('skip-tx');
  openBtn.addEventListener('click', function () {
    bookEl.classList.add('open'); skipTx.style.height = '12svh';
    openBtn.setAttribute('aria-expanded', 'true'); openBtn.disabled = true; openBtn.querySelector('span').textContent = 'The book is open';
    collect(); dirty = true;
    window.dispatchEvent(new CustomEvent('mm:bookopen'));
    var top = bookEl.getBoundingClientRect().top + scrollY;
    if (lenis) lenis.scrollTo(top, { duration: 1.6 }); else scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
    var h = document.getElementById('pg1'); if (h) h.focus({ preventScroll: true });
  });

  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: .09, smoothWheel: true, wheelMultiplier: 1 });
    window.MMLenis = lenis;
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
  }

  /* ───── boot ───── */
  size(); if (gl) initGL(); else ctx2d = cv.getContext('2d');
  sources.white = flat('#ffffff'); sources.dark = darkQuiet(); upload('white'); upload('dark');
  collect();
  loadImg(IMG[first]).then(function (im) { if (im) { sources[first] = im; upload(first); dirty = true; } })
    .then(function () { return Promise.all(Object.keys(IMG).filter(function (k) { return k !== first; }).map(function (k) { return loadImg(IMG[k]).then(function (im) { if (im) { sources[k] = im; upload(k); dirty = true; } }); })); });
  requestAnimationFrame(frame);
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); collect(); dirty = true; }, 160); });
})();
