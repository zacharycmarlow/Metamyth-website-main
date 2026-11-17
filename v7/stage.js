/* METAMYTH v7 — the stage.
   One full-screen WebGL canvas behind the whole story. Each scene is a texture
   (film still, or a manuscript page drawn to a canvas). Scroll drives transitions
   between scenes: TEAR (torn-paper wipe whose front dissolves the outgoing image
   into gold line-art), BURN (ember front with char band and sparks), BLOOM (light
   from the centre), OPEN (the book pushes in and gives way to the first page).
   Falls back to a 2D crossfade without WebGL2 or with reduced motion. */
(function () {
  'use strict';
  var doc = document.documentElement, body = document.body;
  var reduced = doc.classList.contains('reduced');
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ───────── scenes ───────── */
  var IMG = {
    'hero-cliff': 'img/vault/hero-cliff.webp', 'refinery': 'img/vault/refinery.webp',
    'dollar-red': 'img/vault/dollar-red.webp', 'fake-mascots': 'img/vault/fake-mascots.webp',
    'women-circle': 'img/vault/women-circle.webp', 'cops-tower': 'img/vault/cops-tower.webp',
    'oculus': 'img/vault/oculus.webp', 'cash-grid': 'img/vault/cash-grid.webp',
    'megaphone': 'img/vault/megaphone.webp', 'sunset-hat': 'img/vault/sunset-hat.webp',
    'ritual': 'img/vault/ritual.webp', 'book': 'img/book.webp',
    'arhuaco-cliff': 'img/vault/arhuaco-cliff.webp'
  };
  var PAGES = {
    'page-1': { folio: 'Page I', title: 'The Stories We Tell Ourselves', img: 'img/vault/face-girl.webp',
      lead: 'The story you believe becomes the life you live.',
      litany: 'Who you are. What you’re worth. What you’re allowed to want. What you believe is possible.',
      body: ['The old story doesn’t only live in the world around us.', '§It lives in us.',
        'In the identities we’ve inherited, the limits we’ve accepted, and the futures we’ve stopped allowing ourselves to imagine.'],
      close: 'And stories can change.' },
    'page-2': { folio: 'Page II', title: 'The Stories We Tell Each Other', img: 'img/vault/mochila.webp',
      lead: 'A story becomes powerful when others find themselves inside it.',
      body: ['The relationships we form, the communities we build, the organizations we create, the movements we join.',
        'Every shared future begins with a story people recognize as their own.'],
      close: 'This is how one person’s vision becomes a shared quest.' },
    'page-3': { folio: 'Page III', title: 'The Stories We Believe Together', img: 'img/vault/cash-grid.webp',
      lead: 'Reality is story-shaped.',
      litany: 'Money. Markets. Institutions. Civilizations.',
      body: ['The structures we experience as reality are shaped by the meanings and agreements we share.',
        'The world we inherited was built by people who believed in a story strongly enough to organize their lives around it.'],
      close: 'And what was written can be rewritten.' }
  };
  var MODE = { tear: 0, burn: 1, bloom: 2, open: 3 };
  var LIGHT_SCENES = { white: 1 };

  /* ───────── canvas + context ───────── */
  var cv = document.getElementById('stage');
  var gl = (!reduced && cv.getContext('webgl2', { antialias: false, premultipliedAlpha: false, alpha: false })) || null;
  var ctx2d = gl ? null : cv.getContext('2d');
  var W = 0, H = 0, DPR = 1;
  var images = {};   // id -> HTMLImageElement
  var sources = {};  // id -> image or canvas used for the scene
  var tex = {};      // id -> {t, w, h}
  var shared = document.createElement('canvas');

  function size() {
    DPR = Math.min(window.devicePixelRatio || 1, innerWidth < 700 ? 2 : 1.6);
    W = Math.round(innerWidth * DPR); H = Math.round(innerHeight * DPR);
    cv.width = W; cv.height = H;
    if (gl) gl.viewport(0, 0, W, H);
  }

  /* ───────── procedural textures: tileable noise + paper fibre ───────── */
  function noiseCanvas(N, cells) {
    var perm = new Uint8Array(512), i, j;
    for (i = 0; i < 256; i++) perm[i] = i;
    for (i = 255; i > 0; i--) { j = (Math.random() * (i + 1)) | 0; var t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
    for (i = 0; i < 256; i++) perm[256 + i] = perm[i];
    var G = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
    var fade = function (t) { return t * t * t * (t * (t * 6 - 15) + 10); };
    var lerp = function (a, b, t) { return a + t * (b - a); };
    var grad = function (h, x, y) { var g = G[h & 7]; return g[0] * x + g[1] * y; };
    function perlin(x, y, per) {
      var X = Math.floor(x), Y = Math.floor(y), xf = x - X, yf = y - Y;
      var x0 = ((X % per) + per) % per, y0 = ((Y % per) + per) % per, x1 = (x0 + 1) % per, y1 = (y0 + 1) % per;
      var u = fade(xf), v = fade(yf);
      var aa = perm[perm[x0] + y0], ab = perm[perm[x0] + y1], ba = perm[perm[x1] + y0], bb = perm[perm[x1] + y1];
      return lerp(lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u), lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u), v);
    }
    var c = document.createElement('canvas'); c.width = c.height = N;
    var g2 = c.getContext('2d'), im = g2.createImageData(N, N);
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var n = 0, amp = .5, f = 1, per = cells;
      for (var o = 0; o < 4; o++) { n += amp * perlin(x / N * cells * f, y / N * cells * f, per); amp *= .5; f *= 2; per *= 2; }
      var v8 = clamp(((n + 1) * .5) * 255, 0, 255) | 0, k = (y * N + x) * 4;
      im.data[k] = im.data[k + 1] = im.data[k + 2] = v8; im.data[k + 3] = 255;
    }
    g2.putImageData(im, 0, 0);
    return c;
  }
  function fibreCanvas(N) {
    var c = document.createElement('canvas'); c.width = c.height = N;
    var g = c.getContext('2d');
    g.fillStyle = 'rgb(128,128,128)'; g.fillRect(0, 0, N, N);
    for (var i = 0; i < 2600; i++) {
      var x = Math.random() * N, y = Math.random() * N, a = Math.random() * Math.PI, L = 6 + Math.random() * 34;
      g.strokeStyle = (Math.random() < .5 ? 'rgba(255,255,255,' : 'rgba(0,0,0,') + (0.05 + Math.random() * .12) + ')';
      g.lineWidth = .6 + Math.random() * 1.4;
      g.beginPath();
      for (var dx = -N; dx <= N; dx += N) for (var dy = -N; dy <= N; dy += N) { // tile-safe
        g.moveTo(x + dx, y + dy);
        g.quadraticCurveTo(x + dx + Math.cos(a + .4) * L * .5, y + dy + Math.sin(a + .4) * L * .5, x + dx + Math.cos(a) * L, y + dy + Math.sin(a) * L);
      }
      g.stroke();
    }
    return c;
  }

  /* ───────── manuscript pages drawn to canvas ───────── */
  var fibre = fibreCanvas(512);
  function wrap(g, text, maxW) {
    var words = text.split(' '), lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (g.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }
  function drawPage(id) {
    var P = PAGES[id], c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d');
    // candle-dark desk
    var bg = g.createRadialGradient(W / 2, H * .48, 0, W / 2, H * .5, Math.max(W, H) * .75);
    bg.addColorStop(0, '#2a1c0c'); bg.addColorStop(.55, '#120c06'); bg.addColorStop(1, '#050302');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // page geometry
    var narrow = W / DPR < 700;
    var pw = Math.min(W * (narrow ? .92 : .9), 860 * DPR), ph = Math.min(H * (narrow ? .8 : .86), pw * (narrow ? 1.9 : 1.32));
    if (ph < pw * .9) pw = Math.min(pw, ph / .9);
    var px = (W - pw) / 2, py = (H - ph) / 2;
    g.save();
    g.shadowColor = 'rgba(0,0,0,.65)'; g.shadowBlur = 80 * DPR; g.shadowOffsetY = 30 * DPR;
    g.fillStyle = '#e9d7ad'; g.fillRect(px, py, pw, ph);
    g.restore();
    var pg = g.createRadialGradient(px + pw / 2, py + ph * .4, pw * .05, px + pw / 2, py + ph * .5, pw * .85);
    pg.addColorStop(0, 'rgba(250,240,214,.95)'); pg.addColorStop(.6, 'rgba(232,212,166,.5)'); pg.addColorStop(1, 'rgba(160,118,62,.75)');
    g.fillStyle = pg; g.fillRect(px, py, pw, ph);
    g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = .28;
    for (var fx = px; fx < px + pw; fx += 512) for (var fy = py; fy < py + ph; fy += 512) g.drawImage(fibre, fx, fy);
    g.restore();
    // rubrication frame
    var m = pw * .035;
    g.strokeStyle = 'rgba(140,47,27,.55)'; g.lineWidth = 1.4 * DPR; g.strokeRect(px + m, py + m, pw - 2 * m, ph - 2 * m);
    g.strokeStyle = 'rgba(140,47,27,.3)'; g.lineWidth = 1 * DPR; g.strokeRect(px + m * 1.45, py + m * 1.45, pw - 2.9 * m, ph - 2.9 * m);
    // content, fitted to the page
    var ink = '#2a1d10', rub = '#8c2f1b';
    var innerX = px + pw * (narrow ? .085 : .1), innerW = pw * (narrow ? .83 : .8), top = py + ph * .075, bottom = py + ph * .94;
    var u = Math.max(pw / 820, 16 * DPR / 20.5);           // body never below ~16 css px
    var floor = 13 * DPR / 20.5;                             // and never shrinks below ~13 css px
    for (var attempt = 0; attempt < 14; attempt++) {
      var s = Math.max(floor, u * Math.pow(.93, attempt)), y = top, ops = [];
      var fFolio = 13 * s, fTitle = 44 * s, fLead = 30 * s, fBody = 20.5 * s, fLit = 21 * s;
      ops.push({ t: 'folio', y: y }); y += fFolio * 2.2;
      g.font = fTitle + 'px Pherome'; var tl = wrap(g, P.title, innerW);
      ops.push({ t: 'title', y: y, lines: tl, f: fTitle }); y += tl.length * fTitle * 1.08 + fTitle * .45;
      var ih = Math.min(ph * .21, innerW * .42); ops.push({ t: 'img', y: y, h: ih }); y += ih + fBody * 1.4;
      g.font = fLead + 'px Pherome'; var ll = wrap(g, P.lead.slice(1), innerW - fLead * 1.9);
      ops.push({ t: 'lead', y: y, lines: ll, f: fLead }); y += Math.max(ll.length * fLead * 1.18, fLead * 2.3) + fBody * .6;
      if (P.litany) { g.font = 'italic ' + fLit + 'px Pherome'; var lit = wrap(g, P.litany, innerW); ops.push({ t: 'lit', y: y, lines: lit, f: fLit }); y += lit.length * fLit * 1.35 + fBody * .55; }
      P.body.forEach(function (para) {
        var em = para.charAt(0) === '§', txt = em ? para.slice(1) : para;
        g.font = (em ? 'italic ' : '') + fBody + 'px Pherome'; var bl = wrap(g, txt, innerW);
        ops.push({ t: 'body', y: y, lines: bl, f: fBody, em: em }); y += bl.length * fBody * 1.42 + fBody * .55;
      });
      g.font = (fLead * .92) + 'px Pherome'; var cl = wrap(g, P.close, innerW);
      ops.push({ t: 'close', y: y + fBody * .2, lines: cl, f: fLead * .92 }); y += cl.length * fLead * 1.1 + fBody;
      if (y <= bottom) break;
    }
    var cx = px + pw / 2;
    ops.forEach(function (o) {
      g.textBaseline = 'top';
      if (o.t === 'folio') { g.font = '500 ' + (13 * s) + 'px Futura, sans-serif'; g.fillStyle = rub; g.textAlign = 'center';
        g.fillText(P.folio.toUpperCase().split('').join(' '), cx, o.y);
        g.fillRect(cx - 120 * s, o.y + 22 * s, 70 * s, 1 * DPR); g.fillRect(cx + 50 * s, o.y + 22 * s, 70 * s, 1 * DPR); }
      if (o.t === 'title') { g.font = o.f + 'px Pherome'; g.fillStyle = ink; g.textAlign = 'center';
        o.lines.forEach(function (l, i) { g.fillText(l, cx, o.y + i * o.f * 1.08); }); }
      if (o.t === 'img') { var im = images[P.img]; if (im) { g.save(); g.beginPath(); g.rect(innerX, o.y, innerW, o.h); g.clip();
          var r = Math.max(innerW / im.width, o.h / im.height), iw = im.width * r, ih2 = im.height * r;
          try { g.filter = 'sepia(.55) contrast(1.08) brightness(.92)'; } catch (e) {}
          g.drawImage(im, innerX + (innerW - iw) / 2, o.y + (o.h - ih2) / 2, iw, ih2); g.filter = 'none';
          g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(214,180,120,.35)'; g.fillRect(innerX, o.y, innerW, o.h);
          g.restore(); g.strokeStyle = 'rgba(140,47,27,.5)'; g.lineWidth = 1 * DPR; g.strokeRect(innerX, o.y, innerW, o.h); } }
      if (o.t === 'lead') { var cap = P.lead.charAt(0), capF = o.f * 2.5;
        g.font = capF + 'px Pherome'; g.fillStyle = rub; g.textAlign = 'left'; g.fillText(cap, innerX, o.y - capF * .1);
        var capW = g.measureText(cap).width + o.f * .35;
        g.font = o.f + 'px Pherome'; g.fillStyle = ink;
        o.lines.forEach(function (l, i) { g.fillText(l, innerX + capW, o.y + i * o.f * 1.18); }); }
      if (o.t === 'lit') { g.font = 'italic ' + o.f + 'px Pherome'; g.fillStyle = rub; g.textAlign = 'left';
        o.lines.forEach(function (l, i) { g.fillText(l, innerX, o.y + i * o.f * 1.35); }); }
      if (o.t === 'body') { g.font = (o.em ? 'italic ' : '') + o.f + 'px Pherome'; g.fillStyle = ink; g.textAlign = 'left';
        o.lines.forEach(function (l, i) { g.fillText(l, innerX, o.y + i * o.f * 1.42); }); }
      if (o.t === 'close') { g.font = o.f + 'px Pherome'; g.fillStyle = rub; g.textAlign = 'center';
        o.lines.forEach(function (l, i) { g.fillText(l, cx, o.y + i * o.f * 1.1); }); }
    });
    return c;
  }
  function drawStar() {
    var c = document.createElement('canvas'); c.width = W; c.height = H; var g = c.getContext('2d');
    var bg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * .7);
    bg.addColorStop(0, '#3a2c12'); bg.addColorStop(.25, '#140f07'); bg.addColorStop(1, '#030302');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    var halo = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * .35);
    halo.addColorStop(0, 'rgba(255,236,190,.55)'); halo.addColorStop(.35, 'rgba(212,168,67,.18)'); halo.addColorStop(1, 'rgba(212,168,67,0)');
    g.fillStyle = halo; g.fillRect(0, 0, W, H);
    var im = images['img/north-star.png'];
    if (im) { var sh = Math.min(W, H) * .26, sw = sh * im.width / im.height;
      g.shadowColor = 'rgba(255,230,170,.9)'; g.shadowBlur = 60 * DPR; g.drawImage(im, (W - sw) / 2, (H - sh) / 2, sw, sh); }
    return c;
  }
  function flat(color) { var c = document.createElement('canvas'); c.width = 16; c.height = 16; var g = c.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, 16, 16); return c; }
  function darkQuiet() {
    var c = document.createElement('canvas'); c.width = 512; c.height = 512; var g = c.getContext('2d');
    var bg = g.createRadialGradient(256, 330, 0, 256, 300, 420);
    bg.addColorStop(0, '#1d2a17'); bg.addColorStop(.6, '#0a1a12'); bg.addColorStop(1, '#050d09');
    g.fillStyle = bg; g.fillRect(0, 0, 512, 512); return c;
  }

  /* ───────── WebGL ───────── */
  var prog, U = {}, tNoise, tFibre;
  var VS = '#version 300 es\nin vec2 p;out vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FS = [
    '#version 300 es', 'precision highp float;', 'in vec2 vUv;out vec4 o;',
    'uniform sampler2D tA,tB,tN,tF;uniform vec2 sA,sB;uniform float uP,uT,uAsp,uM;',
    'float lum(vec3 c){return dot(c,vec3(.299,.587,.114));}',
    'vec3 ink(vec3 c){float e=clamp(fwidth(lum(c))*9.,0.,1.);return vec3(.86,.71,.38)*e+c*.1;}',
    'void main(){',
    ' vec2 uv=vUv;float p=uP;',
    ' float zA=uM>2.5?1.-.32*smoothstep(0.,1.,p):1.-.05*smoothstep(0.,1.,p);',
    ' float zB=uM>2.5?1.+.08*(1.-p):1.+.05*(1.-smoothstep(0.,1.,p));',
    ' vec3 a=texture(tA,((uv-.5)*zA)*sA+.5).rgb;vec3 b=texture(tB,((uv-.5)*zB)*sB+.5).rgb;',
    ' vec2 au=vec2(uv.x*uAsp,uv.y);',
    ' float n=texture(tN,au*.22+vec2(0.,uT*.004)).r*2.-1.;',
    ' float fb=texture(tF,au*.85).r-.5;',
    ' float th;',
    ' if(uM<.5){th=mix(uv.y,uv.x,smoothstep(.6,-.4,abs(uv.x-.5))*.5);}',
    ' else if(uM<1.5){vec2 q=uv+vec2(texture(tN,au*.07+.3).r-.5,texture(tN,au*.07+.7).r-.5)*.22;th=length((q-vec2(.94,-.08))*vec2(uAsp,1.))/length(vec2(uAsp,1.)*1.08);}',
    ' else {th=length((uv-.5)*vec2(uAsp,1.))/length(vec2(uAsp,1.)*.5);}',
    ' float rough=uM>1.5?.05:.24;',
    ' th=th*2.-1.;th=th/1.2+n*rough+fb*(uM>1.5?.015:.2);th=th*.5+.5;',
    ' float e=mix(-.3,1.3,p)-th;',
    ' float aa=fwidth(e)*1.6+.0012;float k=smoothstep(-aa,aa,e);',
    ' vec3 col;',
    ' if(uM>2.5){',
    '  float f=smoothstep(.35,.92,p);col=mix(a*(1.+.6*smoothstep(.1,.5,p)*(1.-f)),b,f);',
    ' } else {',
    '  vec3 ca=a,cb=b;',
    '  if(uM<.5){',
    '   ca=mix(a,ink(a),smoothstep(-.32,-.02,e)*smoothstep(.0,.2,p));',
    '   cb=mix(b,ink(b),(1.-smoothstep(.02,.34,e))*(1.-smoothstep(.75,1.,p)));',
    '  }',
    '  col=mix(ca,cb,k);float d=abs(e);',
    '  if(uM<.5){',
    '   float fl=.72+.28*sin(uT*2.2+uv.x*12.+n*6.);',
    '   col+=vec3(1.,.86,.55)*(1.-smoothstep(0.,.011,d))*1.7*fl;',
    '   float lip=smoothstep(0.,.003,-e)*(1.-smoothstep(.003,.018+.01*fb,-e));',
    '   col=mix(col,vec3(.95,.91,.8),lip*.8);',
    '  } else if(uM<1.5){',
    '   float ch=smoothstep(-.075,0.,e)*(1.-k);col=mix(col,vec3(.04,.015,.008),ch*.93);',
    '   float sc=smoothstep(-.19,-.07,e)*(1.-k)*(1.-ch);col=mix(col,col*vec3(.58,.38,.2),sc*.65);',
    '   vec3 em=mix(vec3(1.,.32,.04),vec3(1.,.86,.42),.5+.5*sin(uT*7.+uv.x*40.+n*10.));',
    '   col+=em*(1.-smoothstep(0.,.009+.012*abs(n),d))*2.3;',
    '   float sp=smoothstep(.8,1.,texture(tN,au*2.6+vec2(0.,-uT*.06)).r)*(1.-smoothstep(0.,.07,d))*(1.-k);',
    '   col+=vec3(1.,.6,.2)*sp*1.6;',
    '  } else {',
    '   col+=vec3(1.,.95,.84)*(1.-smoothstep(0.,.09,d))*.9;',
    '  }',
    ' }',
    ' o=vec4(col,1.);',
    '}'].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function makeTex(src, repeat) {
    var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    var wr = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wr); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wr);
    return { t: t, w: src.width, h: src.height };
  }
  function initGL() {
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      ['tA', 'tB', 'tN', 'tF', 'sA', 'sB', 'uP', 'uT', 'uAsp', 'uM'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
      gl.uniform1i(U.tA, 0); gl.uniform1i(U.tB, 1); gl.uniform1i(U.tN, 2); gl.uniform1i(U.tF, 3);
      tNoise = makeTex(noiseCanvas(256, 4), true); tFibre = makeTex(fibreCanvas(512), true);
      return true;
    } catch (e) { console.warn('stage: WebGL unavailable, using crossfade', e); gl = null; ctx2d = cv.getContext('2d'); return false; }
  }
  function coverScale(w, h) {
    var r = (w / h) / (W / H);
    return r > 1 ? [1 / r, 1] : [1, r];
  }
  function upload(id) {
    var src = sources[id]; if (!src || !gl) return;
    if (tex[id]) gl.deleteTexture(tex[id].t);
    tex[id] = makeTex(src, false);
  }

  /* ───────── assets ───────── */
  function loadImg(url) {
    return new Promise(function (res) { var im = new Image(); im.decoding = 'async'; im.onload = function () { images[url] = im; res(im); }; im.onerror = function () { res(null); }; im.src = url; });
  }
  function buildGenerated() {
    Object.keys(PAGES).forEach(function (id) { sources[id] = drawPage(id); upload(id); });
    sources.star = drawStar(); upload('star');
  }

  /* ───────── scroll → stage state ───────── */
  var txs = [], first = 'hero-cliff', state = { a: first, b: first, p: 0, m: 0 }, dirty = true, live = false, t0 = performance.now();
  var dialFill = document.querySelector('.dial-track i'), dialCh = document.querySelector('.dial-ch');
  var chapters = Array.prototype.slice.call(document.querySelectorAll('[data-chapter]'));
  var bookEl = document.getElementById('book'), skipTx = document.getElementById('skip-tx');
  function collect() { txs = Array.prototype.slice.call(document.querySelectorAll('.tx')).filter(function (el) { return el.offsetParent !== null; }); }
  function compute() {
    var vh = innerHeight, s = { a: first, b: first, p: 0, m: 0 }, found = false;
    for (var i = 0; i < txs.length; i++) {
      var r = txs[i].getBoundingClientRect(), p = clamp((vh - r.top) / r.height, 0, 1), d = txs[i].dataset;
      if (p >= 1) { s = { a: d.b, b: d.b, p: 0, m: 0 }; continue; }
      if (p > 0) { s = { a: d.a, b: d.b, p: p, m: MODE[d.mode] || 0 }; found = true; }
      break;
    }
    return s;
  }
  function frame(now) {
    var s = compute();
    var changed = s.a !== state.a || s.b !== state.b || Math.abs(s.p - state.p) > 1e-4;
    state = s; live = s.p > 0 && s.p < 1;
    if (changed || dirty || live) { render(now); dirty = false; }
    // chrome
    var max = doc.scrollHeight - innerHeight;
    dialFill.style.setProperty('--p', (scrollY / Math.max(1, max)).toFixed(4));
    for (var i = chapters.length - 1; i >= 0; i--) {
      var r = chapters[i].getBoundingClientRect();
      if (r.top <= innerHeight * .5 && r.bottom >= 0 && r.height > 0) { if (dialCh.textContent !== chapters[i].dataset.chapter) dialCh.textContent = chapters[i].dataset.chapter; break; }
    }
    var lightNow = (LIGHT_SCENES[s.a] && s.p < .5) || (LIGHT_SCENES[s.b] && s.p > .5);
    body.classList.toggle('is-light', !!lightNow);
    var heroOut = scrollY < innerHeight * .5;
    var bookRect = bookEl.getBoundingClientRect();
    var inBook = bookEl.classList.contains('open') && bookRect.top < innerHeight * .5 && bookRect.bottom > innerHeight * .5;
    body.classList.toggle('in-book', inBook);
    body.classList.toggle('hide-pill', heroOut || inBook || !!lightNow || s.a === 'book' || s.b === 'book');
    requestAnimationFrame(frame);
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
      var draw = function (id, alpha) { var src = sources[id]; if (!src) return; var r = Math.max(W / src.width, H / src.height), w = src.width * r, h = src.height * r; ctx2d.globalAlpha = alpha; ctx2d.drawImage(src, (W - w) / 2, (H - h) / 2, w, h); };
      ctx2d.globalAlpha = 1; draw(a, 1); if (state.p > 0) draw(b, state.p); ctx2d.globalAlpha = 1;
    }
  }

  /* ───────── book threshold ───────── */
  var openBtn = document.getElementById('open-book');
  openBtn.addEventListener('click', function () {
    bookEl.classList.add('open'); skipTx.style.display = 'none';
    openBtn.setAttribute('aria-expanded', 'true'); openBtn.disabled = true;
    openBtn.querySelector('span').textContent = 'The book is open';
    collect(); dirty = true;
    var top = bookEl.getBoundingClientRect().top + scrollY - innerHeight * .05;
    if (lenis) lenis.scrollTo(top, { duration: 2.2 }); else scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
    var h = document.getElementById('pg1'); if (h) h.focus({ preventScroll: true });
  });

  /* ───────── reveals ───────── */
  var rvs = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -14% 0px', threshold: .1 });
    rvs.forEach(function (el) { io.observe(el); });
  } else rvs.forEach(function (el) { el.classList.add('in'); });

  /* ───────── smooth scroll (Lenis) ───────── */
  var lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: .085, smoothWheel: true, wheelMultiplier: .9 });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
  }

  /* ───────── boot ───────── */
  size();
  if (gl) initGL();
  sources.white = flat('#ffffff'); sources.dark = darkQuiet();
  if (gl) { upload('white'); upload('dark'); }
  collect();
  var heroP = loadImg(IMG[first]).then(function (im) { if (im) { sources[first] = im; upload(first); dirty = true; } });
  requestAnimationFrame(frame);
  heroP.then(function () {
    var rest = Object.keys(IMG).filter(function (k) { return k !== first; }).map(function (k) { return loadImg(IMG[k]).then(function (im) { if (im) { sources[k] = im; upload(k); dirty = true; } }); });
    var extras = ['img/vault/face-girl.webp', 'img/vault/mochila.webp', 'img/north-star.png'].map(loadImg);
    var fonts = document.fonts ? Promise.all([document.fonts.load('40px Pherome'), document.fonts.load('italic 20px Pherome'), document.fonts.load('500 13px Futura')]) : Promise.resolve();
    return Promise.all(rest.concat(extras, [fonts])).then(function () { buildGenerated(); dirty = true; });
  });
  var rt;
  addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { size(); if (images['img/vault/face-girl.webp']) buildGenerated(); collect(); dirty = true; }, 180);
  });
})();
