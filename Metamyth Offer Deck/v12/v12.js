/* METAMYTH v12 — the stage. One WebGL2 canvas behind transparent content. Each section names
   the world it sits on (data-stage). Crossing a section boundary sweeps the next world in from the
   bottom with a fibrous, glowing edge; within a band around the edge both images dissolve to line art. */
(() => {
  const SRC = { nebula: '../v10/img/nebula.webp', earthrise: '../v10/img/earthrise.webp', red: '../v10/img/red-planet.webp', paper: 'img/paper.webp' };
  const GLOW = { paper: [1.0, 0.97, 0.9], red: [1.0, 0.55, 0.28], default: [1.0, 0.86, 0.62] };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sections = [...document.querySelectorAll('main > section')];
  const canvas = document.querySelector('.stage');
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });

  // ── tone + index follow the section under the reading line
  const links = [...document.querySelectorAll('.index a')];
  function chrome() {
    const y = innerHeight * 0.42;
    const s = sections.find(el => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom > y; }) || sections[0];
    document.body.dataset.tone = s.dataset.tone || 'light';
    links.forEach(a => a.setAttribute('aria-current', String(a.dataset.ch === s.dataset.ch)));
  }

  // ── which two worlds, and how far between them
  function state() {
    const vh = innerHeight;
    let a = sections[0].dataset.stage, b = a, p = 0;
    for (let i = 1; i < sections.length; i++) {
      const prev = sections[i - 1].dataset.stage, next = sections[i].dataset.stage;
      if (prev === next) continue;
      const top = sections[i].getBoundingClientRect().top;          // boundary position in the viewport
      const t = (vh * 0.95 - top) / (vh * 0.75);                     // starts as it enters, done near the top
      if (t <= 0) break;
      if (t >= 1) { a = b = next; continue; }
      a = prev; b = next; p = t; break;
    }
    return { a, b, p };
  }

  if (!gl) { document.documentElement.classList.add('no-gl'); fallback(); return; }

  const vs = `#version 300 es
  in vec2 pos; void main(){ gl_Position = vec4(pos,0.,1.); }`;
  const fs = `#version 300 es
  precision highp float;
  uniform sampler2D uA, uB, uFib;
  uniform vec2 uRes, uSizeA, uSizeB;
  uniform float uP, uT;
  uniform vec3 uGlow;
  out vec4 o;
  vec2 cover(vec2 uv, vec2 size, float zoom){
    float ra = uRes.x/uRes.y, ri = size.x/size.y;
    vec2 s = ra > ri ? vec2(1., ri/ra) : vec2(ra/ri, 1.);
    return (uv - .5) * s / zoom + .5;
  }
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*n(p); p*=2.03; a*=.5; } return v; }
  float luma(vec3 c){ return dot(c, vec3(.299,.587,.114)); }
  void main(){
    vec2 uv = gl_FragCoord.xy / uRes;
    float p = uP; float pe = p*p*(3.-2.*p);
    vec2 ua = cover(uv, uSizeA, 1.04 + .06*pe);       // the leaving world leans in
    vec2 ub = cover(uv, uSizeB, 1.10 - .06*pe);       // the arriving world settles back
    ua.y = 1. - ua.y; ub.y = 1. - ub.y;
    vec4 A = texture(uA, ua), B = texture(uB, ub);
    float asp = uRes.x / uRes.y;
    // the edge: rises from the bottom, centre leading, roughened by noise and paper fibre
    float bow = .14 * (1. - pow(abs(uv.x - .5) * 2., 2.));
    vec3 fib = texture(uFib, uv * vec2(asp, 1.) * 1.3).rgb;
    float th = uv.y - bow + (fbm(uv * vec2(asp,1.) * 2.4 + vec2(0., uT*.03)) - .5) * .16 + (fib.r - .5) * .045;
    float e = mix(-.32, 1.18, pe) - th;
    float aa = fwidth(e) * 1.5 + .002;
    float m = smoothstep(-aa, aa, e);
    // near the edge both images thin into their own line art
    float band = 1. - smoothstep(0., .07, abs(e));
    vec3 inkA = vec3(clamp(fwidth(luma(A.rgb)) * 4., 0., 1.));
    vec3 inkB = vec3(clamp(fwidth(luma(B.rgb)) * 4., 0., 1.));
    A.rgb = mix(A.rgb, mix(A.rgb * .35, inkA, .5), band * .6);
    B.rgb = mix(B.rgb, mix(B.rgb * .35, inkB, .5), band * .6);
    vec3 c = mix(A.rgb, B.rgb, m);
    // a fibrous glow along the edge
    float g = exp(-abs(e) * 160.) * (.7 + .3 * fbm(uv * 30. + uT));
    c += uGlow * g * 1.6 * step(.001, p) * step(p, .999);
    o = vec4(c, 1.);
  }`;
  function sh(t, s) { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(x); return x; }
  let prog;
  try { prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog); }
  catch (e) { console.warn(e); document.documentElement.classList.add('no-gl'); fallback(); return; }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'pos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(prog, n);
  const u = { A: U('uA'), B: U('uB'), F: U('uFib'), res: U('uRes'), sA: U('uSizeA'), sB: U('uSizeB'), p: U('uP'), t: U('uT'), glow: U('uGlow') };

  const tex = {};
  function load(key, src, repeat) {
    return new Promise(res => { const im = new Image(); im.onload = () => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      const w = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, w); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, w);
      tex[key] = { t, w: im.naturalWidth, h: im.naturalHeight }; res(); }; im.src = src; });
  }
  function size() { const d = Math.min(devicePixelRatio, 1.75); canvas.width = innerWidth * d; canvas.height = innerHeight * d; gl.viewport(0, 0, canvas.width, canvas.height); }

  let lenis = null;
  if (!reduce && window.Lenis) { lenis = new Lenis({ lerp: 0.1 }); }
  const t0 = performance.now();
  function frame(now) {
    if (lenis) lenis.raf(now);
    const s = state(); chrome();
    const A = tex[s.a], B = tex[s.b];
    if (A && B && tex.fibre) {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.t); gl.uniform1i(u.A, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, B.t); gl.uniform1i(u.B, 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, tex.fibre.t); gl.uniform1i(u.F, 2);
      gl.uniform2f(u.res, canvas.width, canvas.height); gl.uniform2f(u.sA, A.w, A.h); gl.uniform2f(u.sB, B.w, B.h);
      gl.uniform1f(u.p, s.p); gl.uniform1f(u.t, reduce ? 0 : (now - t0) / 1000);
      gl.uniform3fv(u.glow, GLOW[s.b] || GLOW[s.a] || GLOW.default);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    requestAnimationFrame(frame);
  }
  size(); addEventListener('resize', size);
  Promise.all([...Object.entries(SRC).map(([k, v]) => load(k, v)), load('fibre', 'img/fibre.jpg', true)]).then(() => requestAnimationFrame(frame));

  function fallback() {
    const fb = document.querySelector('.stage-fallback');
    const tick = () => { const s = state(); chrome(); const k = s.p > .5 ? s.b : s.a; fb.style.backgroundImage = `url(${SRC[k]})`; requestAnimationFrame(tick); };
    tick();
  }
})();
