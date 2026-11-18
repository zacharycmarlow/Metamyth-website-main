/* METAMYTH v7 — the book as a 3D object, scrubbed by scroll.
   Closed tooled-leather book floating in candlelight → turns to face you → cover
   swings open on its spine → three illuminated spreads (plate + level rings on the
   left, the full revelation on the right), each burning across both pages into the
   next → the star rises from the book and blooms to white. */
const doc = document.documentElement, body = document.body;
const bookEl = document.getElementById('book');
const canvas = document.getElementById('book3d');
const reduced = doc.classList.contains('reduced');
let started = false;

const SPREADS = [
  { n: 'I', title: 'The Stories We Tell Ourselves', img: 'img/vault/face-girl.webp', level: 0,
    lead: 'The story you believe becomes the life you live.',
    litany: 'Who you are. What you’re worth. What you’re allowed to want. What you believe is possible.',
    body: ['The old story doesn’t only live in the world around us.', '§It lives in us.',
      'In the identities we’ve inherited, the limits we’ve accepted, and the futures we’ve stopped allowing ourselves to imagine.'],
    close: 'And stories can change.' },
  { n: 'II', title: 'The Stories We Tell Each Other', img: 'img/vault/mochila.webp', level: 1,
    lead: 'A story becomes powerful when others find themselves inside it.',
    body: ['The relationships we form, the communities we build, the organizations we create, the movements we join.',
      'Every shared future begins with a story people recognize as their own.'],
    close: 'This is how one person’s vision becomes a shared quest.' },
  { n: 'III', title: 'The Stories We Believe Together', img: 'img/vault/cash-grid.webp', level: 2,
    lead: 'Reality is story-shaped.',
    litany: 'Money. Markets. Institutions. Civilizations.',
    body: ['The structures we experience as reality are shaped by the meanings and agreements we share.',
      'The world we inherited was built by people who believed in a story strongly enough to organize their lives around it.'],
    close: 'And what was written can be rewritten.' }
];
const RING_LABELS = ['Ourselves', 'Each Other', 'Together'];

const load = (url) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = url; });
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

/* ───────── 2D art: leather cover, page edges, spreads ───────── */
function paper(g, x, y, w, h, seed) {
  const pg = g.createRadialGradient(x + w * .5, y + h * .42, w * .05, x + w * .5, y + h * .5, w * .95);
  pg.addColorStop(0, '#f6ead0'); pg.addColorStop(.55, '#ead9b0'); pg.addColorStop(.85, '#d8bf8a'); pg.addColorStop(1, '#b8945a');
  g.fillStyle = pg; g.fillRect(x, y, w, h);
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  g.save(); g.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 9; i++) {             // foxing and stains
    const cx = x + rnd() * w, cy = y + rnd() * h, r = 20 + rnd() * 120;
    const st = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    st.addColorStop(0, `rgba(150,110,60,${.05 + rnd() * .08})`); st.addColorStop(1, 'rgba(150,110,60,0)');
    g.fillStyle = st; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 1400; i++) {          // fibres
    const fx = x + rnd() * w, fy = y + rnd() * h, a = rnd() * Math.PI, L = 4 + rnd() * 22;
    g.strokeStyle = `rgba(120,90,50,${.04 + rnd() * .07})`; g.lineWidth = .6 + rnd();
    g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + Math.cos(a) * L, fy + Math.sin(a) * L); g.stroke();
  }
  g.restore();
}
function goldFill(g, x0, y0, x1, y1) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, '#e8c25e'); gr.addColorStop(.35, '#a87420'); gr.addColorStop(.55, '#e9c56a'); gr.addColorStop(.8, '#8a5c14'); gr.addColorStop(1, '#d4a843');
  return gr;
}
function wrap(g, text, maxW) {
  const words = text.split(' '), lines = []; let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line); return lines;
}
const PW = 1200, PH = 1632; // one page
function drawSpread(S, plate, star) {
  const c = document.createElement('canvas'); c.width = PW * 2; c.height = PH; const g = c.getContext('2d');
  paper(g, 0, 0, PW, PH, 11 + S.level * 7); paper(g, PW, 0, PW, PH, 29 + S.level * 5);
  const ink = '#2a1d10', rub = '#8c2f1b';
  // frames
  for (const ox of [0, PW]) {
    g.strokeStyle = 'rgba(140,47,27,.6)'; g.lineWidth = 3; g.strokeRect(ox + 60, 60, PW - 120, PH - 120);
    g.strokeStyle = 'rgba(140,47,27,.35)'; g.lineWidth = 1.5; g.strokeRect(ox + 78, 78, PW - 156, PH - 156);
  }
  /* LEFT PAGE: folio · gold numeral · engraved plate · level rings */
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillStyle = rub; g.font = '500 30px Futura, sans-serif';
  g.fillText(('PAGE ' + S.n).split('').join(' '), PW / 2, 170);
  g.fillRect(PW / 2 - 210, 158, 110, 2); g.fillRect(PW / 2 + 100, 158, 110, 2);
  g.font = '230px "MM Serif"'; g.fillStyle = goldFill(g, PW / 2 - 140, 200, PW / 2 + 140, 430);
  g.shadowColor = 'rgba(90,50,10,.45)'; g.shadowBlur = 8; g.shadowOffsetY = 4;
  g.fillText(S.n, PW / 2, 410); g.shadowColor = 'transparent';
  g.lineWidth = 3; g.strokeStyle = '#6b4512'; g.strokeText(S.n, PW / 2, 410);
  // plate
  const px = 150, py = 470, pw = PW - 300, ph = 560;
  if (plate) {
    g.save(); g.beginPath(); g.rect(px, py, pw, ph); g.clip();
    const r = Math.max(pw / plate.width, ph / plate.height), iw = plate.width * r, ih = plate.height * r;
    try { g.filter = 'grayscale(1) contrast(1.45) brightness(1.05)'; } catch (e) {}
    g.drawImage(plate, px + (pw - iw) / 2, py + (ph - ih) / 2, iw, ih); g.filter = 'none';
    g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(214,176,112,.85)'; g.fillRect(px, py, pw, ph);
    g.globalAlpha = .18; g.strokeStyle = '#3a2410'; g.lineWidth = 1.2;      // engraving hatch
    for (let i = -ph; i < pw; i += 7) { g.beginPath(); g.moveTo(px + i, py + ph); g.lineTo(px + i + ph, py); g.stroke(); }
    g.restore();
  }
  g.strokeStyle = 'rgba(140,47,27,.7)'; g.lineWidth = 3; g.strokeRect(px, py, pw, ph);
  g.strokeStyle = 'rgba(140,47,27,.35)'; g.lineWidth = 1.5; g.strokeRect(px - 12, py - 12, pw + 24, ph + 24);
  // level rings: I · Ourselves (inner) → II · Each Other → III · Together (outer)
  const cx = 370, cy = 1290, radii = [62, 122, 182];
  for (let i = 2; i >= 0; i--) {
    const on = i <= S.level, cur = i === S.level;
    g.beginPath(); g.arc(cx, cy, radii[i], 0, Math.PI * 2);
    if (cur) { g.fillStyle = 'rgba(212,168,67,.24)'; g.fill(); }
    g.setLineDash(on ? [] : [6, 9]); g.lineWidth = cur ? 6 : 2.6;
    g.strokeStyle = cur ? '#a87420' : (on ? 'rgba(140,47,27,.75)' : 'rgba(140,47,27,.32)');
    g.stroke(); g.setLineDash([]);
  }
  if (star) { const sz = 64, w = sz * star.width / star.height; g.drawImage(star, cx - w / 2, cy - sz / 2, w, sz); }
  g.textAlign = 'left'; g.textBaseline = 'middle';
  RING_LABELS.forEach((lab, i) => {
    const on = i <= S.level, cur = i === S.level, ly = cy - 92 + i * 92;
    g.strokeStyle = cur ? 'rgba(140,47,27,.8)' : 'rgba(140,47,27,.3)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(cx + radii[i] * .72, cy - radii[i] * .69); g.lineTo(600, ly); g.lineTo(630, ly); g.stroke();
    g.fillStyle = cur ? '#8c2f1b' : (on ? 'rgba(70,40,15,.85)' : 'rgba(70,40,15,.4)');
    g.font = (cur ? '500 ' : '') + '28px Futura, sans-serif';
    g.fillText(['I', 'II', 'III'][i] + '  ' + lab.toUpperCase().split('').join('\u2009'), 645, ly);
  });
  g.textBaseline = 'alphabetic';
  /* RIGHT PAGE: the full revelation */
  const X = PW + 135, Wt = PW - 270, top = 150, bottom = PH - 110;
  let s = 1, ops;
  for (let attempt = 0; attempt < 16; attempt++) {
    s = Math.pow(.95, attempt); let y = top; ops = [];
    const fT = 96 * s, fL = 64 * s, fB = 50 * s, fC = 64 * s;
    g.font = `${fT}px "MM Serif"`; const tl = wrap(g, S.title, Wt); ops.push(['title', y, tl, fT]); y += tl.length * fT * 1.02 + fT * .55;
    ops.push(['rule', y]); y += fB * 1.3;
    const capF = fL * 2.9; g.font = `${capF}px "MM Swash"`; const capW = g.measureText(S.lead[0]).width + fL * .5;
    g.font = `${fL}px "MM Serif"`; const ll = wrap(g, S.lead.slice(1), Wt - capW - fL * .2);
    ops.push(['lead', y, ll, fL, capF, capW]); y += Math.max(ll.length * fL * 1.15, capF * .92) + fB * .8;
    if (S.litany) { g.font = `italic ${fB * 1.05}px "MM Serif"`; const lt = wrap(g, S.litany, Wt); ops.push(['lit', y, lt, fB * 1.05]); y += lt.length * fB * 1.4 + fB * .7; }
    for (const para of S.body) {
      const em = para[0] === '§', t = em ? para.slice(1) : para;
      g.font = `${em ? 'italic ' : ''}${fB}px "MM Serif"`; const bl = wrap(g, t, Wt);
      ops.push(['body', y, bl, fB, em]); y += bl.length * fB * 1.38 + fB * .62;
    }
    g.font = `${fC}px "MM Serif"`; const cl = wrap(g, S.close, Wt); ops.push(['close', y + fB * .4, cl, fC]); y += cl.length * fC * 1.08 + fB * 1.2;
    ops.push(['orn', y]);
    if (y + 40 <= bottom) break;
  }
  for (const o of ops) {
    const [t, y] = o; g.textBaseline = 'top';
    if (t === 'title') { g.font = `${o[3]}px "MM Serif"`; g.fillStyle = ink; g.textAlign = 'left'; o[2].forEach((l, i) => g.fillText(l, X, y + i * o[3] * 1.02)); }
    if (t === 'rule') { g.fillStyle = 'rgba(140,47,27,.7)'; g.fillRect(X, y, 160 * s, 3); g.fillRect(X + 175 * s, y - 4, 10, 10); }
    if (t === 'lead') {
      const [, , lines, f, capF, capW] = o;
      g.fillStyle = 'rgba(212,168,67,.25)'; g.fillRect(X - 8, y - 4, capW - f * .25, capF * .95);
      g.strokeStyle = 'rgba(140,47,27,.5)'; g.lineWidth = 2; g.strokeRect(X - 8, y - 4, capW - f * .25, capF * .95);
      g.font = `${capF}px "MM Swash"`; g.fillStyle = rub; g.textAlign = 'left'; g.fillText(S.lead[0], X + 10, y + capF * .02);
      g.font = `${f}px "MM Serif"`; g.fillStyle = ink; lines.forEach((l, i) => g.fillText(l, X + capW, y + i * f * 1.15));
    }
    if (t === 'lit') { g.font = `italic ${o[3]}px "MM Serif"`; g.fillStyle = rub; g.textAlign = 'left'; o[2].forEach((l, i) => g.fillText(l, X, y + i * o[3] * 1.4)); }
    if (t === 'body') { g.font = `${o[4] ? 'italic ' : ''}${o[3]}px "MM Serif"`; g.fillStyle = ink; g.textAlign = 'left'; o[2].forEach((l, i) => g.fillText(l, X, y + i * o[3] * 1.38)); }
    if (t === 'close') { g.font = `${o[3]}px "MM Serif"`; g.fillStyle = rub; g.textAlign = 'left'; o[2].forEach((l, i) => g.fillText(l, X, y + i * o[3] * 1.08)); }
    if (t === 'orn') { g.fillStyle = 'rgba(140,47,27,.6)'; g.textAlign = 'center'; g.font = `${40 * s}px "MM Serif"`; g.fillText('❦', PW + PW / 2, Math.min(y, bottom - 30)); }
  }
  return c;
}
function drawRadiance() {
  const c = document.createElement('canvas'); c.width = PW * 2; c.height = PH; const g = c.getContext('2d');
  const gr = g.createRadialGradient(PW, PH * .5, 0, PW, PH * .5, PW * 1.1);
  gr.addColorStop(0, '#fff6dc'); gr.addColorStop(.25, '#f2cf78'); gr.addColorStop(.6, '#7a5218'); gr.addColorStop(1, '#2a1a08');
  g.fillStyle = gr; g.fillRect(0, 0, PW * 2, PH); return c;
}
function drawCover(star) {
  const c = document.createElement('canvas'); c.width = 1040; c.height = 1420; const g = c.getContext('2d');
  const bg = g.createRadialGradient(520, 640, 60, 520, 710, 900);
  bg.addColorStop(0, '#1d4a35'); bg.addColorStop(.6, '#11301f'); bg.addColorStop(1, '#081a11');
  g.fillStyle = bg; g.fillRect(0, 0, 1040, 1420);
  for (let i = 0; i < 2200; i++) { // leather grain
    const x = Math.random() * 1040, y = Math.random() * 1420, r = .8 + Math.random() * 3.2;
    g.fillStyle = Math.random() < .5 ? `rgba(0,0,0,${.05 + Math.random() * .12})` : `rgba(120,160,130,${.02 + Math.random() * .05})`;
    g.beginPath(); g.ellipse(x, y, r * 1.6, r, Math.random() * 3, 0, Math.PI * 2); g.fill();
  }
  const gold = goldFill(g, 0, 0, 1040, 1420);
  g.strokeStyle = gold; g.lineWidth = 6; g.strokeRect(60, 60, 920, 1300);
  g.lineWidth = 2.5; g.strokeRect(84, 84, 872, 1252);
  for (const [x, y, sx, sy] of [[84, 84, 1, 1], [956, 84, -1, 1], [84, 1336, 1, -1], [956, 1336, -1, -1]]) { // corner fleurons
    g.save(); g.translate(x, y); g.scale(sx, sy); g.strokeStyle = gold; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 90); g.quadraticCurveTo(10, 10, 90, 0); g.stroke();
    g.beginPath(); g.arc(46, 46, 16, 0, Math.PI * 2); g.stroke(); g.restore();
  }
  g.beginPath(); g.arc(520, 640, 250, 0, Math.PI * 2); g.lineWidth = 4; g.strokeStyle = gold; g.stroke();
  g.beginPath(); g.arc(520, 640, 228, 0, Math.PI * 2); g.lineWidth = 1.6; g.stroke();
  if (star) { const h = 330, w = h * star.width / star.height; g.shadowColor = 'rgba(255,220,150,.6)'; g.shadowBlur = 40; g.drawImage(star, 520 - w / 2, 640 - h / 2, w, h); g.shadowBlur = 0; }
  g.fillStyle = gold; g.textAlign = 'center'; g.font = '500 54px Futura, sans-serif';
  g.fillText('M E T A M Y T H', 520, 1090);
  g.font = '40px "MM Serif"'; g.fillText('❦', 520, 1180);
  return c;
}
function drawEdges() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#e4d3a8'; g.fillRect(0, 0, 64, 512);
  for (let y = 0; y < 512; y += 2) { g.fillStyle = `rgba(120,90,50,${Math.random() * .25})`; g.fillRect(0, y, 64, 1); }
  return c;
}
function glowSprite() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,245,215,1)'); gr.addColorStop(.25, 'rgba(255,214,140,.55)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return c;
}

/* ───────── page shader: spread texture + fire burn into the next spread ───────── */
const PAGE_VS = `
varying vec2 vUv; varying vec3 vN;
void main(){ vUv=uv; vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const PAGE_FS = `
uniform sampler2D tCur,tNext; uniform float uBurn,uTime,uSide,uGlow;
varying vec2 vUv; varying vec3 vN;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
void main(){
  vec2 su = uSide<.5 ? vec2(.5-vUv.x*.5, 1.-vUv.y) : vec2(.5+vUv.x*.5, vUv.y);
  vec3 a=texture2D(tCur,su).rgb, b=texture2D(tNext,su).rgb;
  vec2 q=su*vec2(1.47,1.);
  float th=length((su-vec2(1.05,-.06))*vec2(1.47,1.))/1.95;
  th+=(fbm(q*2.6+vec2(0.,uTime*.04))-.5)*.36+(fbm(q*11.-vec2(0.,uTime*.2))-.5)*.05;
  float e=mix(-.22,1.22,uBurn)-th; float k=smoothstep(-.0015,.0015,e); float d=-e;
  vec3 col=mix(a,b,k);
  if(uBurn>0.0001&&uBurn<.9999){
    col=mix(col,col*vec3(.5,.32,.16),(1.-k)*smoothstep(.13,.04,d)*.8);
    col=mix(col,vec3(.03,.015,.008),(1.-k)*smoothstep(.045,0.,d)*.97);
    float fl=.7+.6*fbm(q*7.+vec2(0.,-uTime*1.4));
    col+=vec3(.55,.06,.01)*(1.-smoothstep(0.,.04*fl,abs(e+.01)))*(1.-k)*1.3;
    col+=vec3(1.,.42,.06)*(1.-smoothstep(0.,.018*fl,abs(e+.003)))*1.8;
    col+=vec3(1.,.94,.72)*(1.-smoothstep(0.,.005*fl,abs(e)))*2.6;
    float emb=step(.93,n(q*60.+vec2(0.,-uTime*3.)))*(1.-smoothstep(0.,.06,d))*(1.-k);
    col+=vec3(1.,.55,.15)*emb*1.4;
  }
  float gut = uSide<.5 ? smoothstep(0.,.14,vUv.x) : smoothstep(0.,.14,vUv.x);
  col*=mix(.5,1.,gut);
  float l=clamp(dot(normalize(vN),normalize(vec3(-.35,.55,.85))),0.,1.);
  col*=.72+.38*l;
  col+=vec3(1.,.85,.55)*uGlow;
  gl_FragColor=vec4(col,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

async function start() {
  if (started || reduced) return; started = true;
  let THREE;
  try { THREE = await import('./vendor/three.module.min.js'); }
  catch (e) { body.classList.add('no3d'); return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { body.classList.add('no3d'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;

  if (document.fonts) await Promise.all([document.fonts.load('80px "MM Serif"'), document.fonts.load('italic 40px "MM Serif"'), document.fonts.load('80px "MM Swash"'), document.fonts.load('500 30px Futura')]).catch(() => {});
  const [star, ...plates] = await Promise.all(['img/north-star.png', ...SPREADS.map(s => s.img)].map(load));

  const tx = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; };
  const spreadTex = SPREADS.map((S, i) => tx(drawSpread(S, plates[i], star)));
  const radianceTex = tx(drawRadiance());
  const coverTex = tx(drawCover(star));
  const edgeTex = tx(drawEdges()); edgeTex.wrapS = edgeTex.wrapT = THREE.RepeatWrapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .05, 60);
  scene.add(new THREE.AmbientLight(0x3a2c1c, 1.1));
  const key = new THREE.SpotLight(0xffd7a0, 60, 0, .55, .7, 1.6); key.position.set(-2.2, 2.6, 3.4); key.target.position.set(0, 0, 0); scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x6fd6c4, .6); rim.position.set(2.5, 1, -2.5); scene.add(rim);
  const under = new THREE.PointLight(0xffb24a, 6, 4, 1.8); under.position.set(0, -1.1, .6); scene.add(under);

  // ── the book ──
  const book = new THREE.Group(); scene.add(book);
  const W = 1, H = 1.36, BW = 1.04, BH = 1.42, BT = .03, ST = .07;
  const coverMat = new THREE.MeshStandardMaterial({ map: coverTex, roughness: .5, metalness: .35 });
  const boardSide = new THREE.MeshStandardMaterial({ color: 0x0c2418, roughness: .7, metalness: .1 });
  const inner = new THREE.MeshStandardMaterial({ color: 0x1a3b2a, roughness: .8 });
  const edgeMat = new THREE.MeshStandardMaterial({ map: edgeTex, roughness: .9 });
  const pageWhite = new THREE.MeshStandardMaterial({ color: 0xe9d9b0, roughness: .95 });
  // right half (static)
  const back = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BT), [boardSide, boardSide, boardSide, boardSide, inner, coverMat]);
  back.position.set(BW / 2, 0, BT / 2); book.add(back);
  const rStack = new THREE.Mesh(new THREE.BoxGeometry(W, H, ST), [edgeMat, edgeMat, edgeMat, edgeMat, pageWhite, pageWhite]);
  rStack.position.set(W / 2 + .005, 0, BT + ST / 2); book.add(rStack);
  // left half (hinged at the spine, pivot at the gutter)
  const hinge = new THREE.Group(); hinge.position.set(0, 0, BT + ST); book.add(hinge);
  const lStack = new THREE.Mesh(new THREE.BoxGeometry(W, H, ST), [edgeMat, edgeMat, edgeMat, edgeMat, pageWhite, pageWhite]);
  lStack.position.set(W / 2 + .005, 0, ST / 2); hinge.add(lStack);
  const front = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BT), [boardSide, boardSide, boardSide, boardSide, coverMat, inner]);
  front.position.set(BW / 2, 0, ST + BT / 2); hinge.add(front);
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(BT + ST, BT + ST, BH, 24, 1, true, Math.PI, Math.PI), boardSide);
  spine.position.set(0, 0, BT + ST); book.add(spine);
  // pages: curved at the gutter
  function pageGeo(dir) {
    const g = new THREE.PlaneGeometry(W, H, 48, 1); g.translate(W / 2, 0, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, dir * .045 * (1 - Math.exp(-x / .09)) * (1 - x * .25)); }
    g.computeVertexNormals(); return g;
  }
  const mkPage = (side) => new THREE.ShaderMaterial({ vertexShader: PAGE_VS, fragmentShader: PAGE_FS,
    uniforms: { tCur: { value: spreadTex[0] }, tNext: { value: spreadTex[1] }, uBurn: { value: 0 }, uTime: { value: 0 }, uSide: { value: side }, uGlow: { value: 0 } } });
  const leftMat = mkPage(0), rightMat = mkPage(1);
  const rPage = new THREE.Mesh(pageGeo(1), rightMat); rPage.position.set(.005, 0, BT + ST + .0015); book.add(rPage);
  const lPage = new THREE.Mesh(pageGeo(1), leftMat); lPage.rotation.x = Math.PI; lPage.position.set(.005, 0, -.0015); hinge.add(lPage);

  // ── star + dust ──
  const starTex = star ? tx(star) : null;
  const starSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false, opacity: 0 }));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx(glowSprite()), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  scene.add(glow, starSprite);
  const N = 420, pos = new Float32Array(N * 3), seeds = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 5; pos[i * 3 + 1] = (Math.random() - .5) * 3.4; pos[i * 3 + 2] = (Math.random() - .3) * 3; seeds[i] = Math.random(); }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ map: tx(glowSprite()), size: .035, transparent: true, opacity: .75, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffd28a }));
  scene.add(dust);

  // ── choreography ──
  let vw = 1, vh = 1, aspect = 1;
  function resize() { vw = innerWidth; vh = innerHeight; aspect = vw / vh; renderer.setSize(vw, vh, false); camera.aspect = aspect; camera.updateProjectionMatrix(); }
  resize(); addEventListener('resize', resize);
  function fitDist(w, h) {
    const vf = camera.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
    return Math.max((h / 2) / Math.tan(vf / 2), (w / 2) / Math.tan(hf / 2));
  }
  const narrow = () => aspect < .9;
  const SEG = [ // [start, holdEnd, burnEnd] per spread, in book progress
    [.15, .30, .38], [.38, .53, .61], [.61, .76, .84]
  ];
  function camFor(P) {
    // returns {x, y, d} : look target x, y and distance
    const closed = { x: 0, y: 0, d: fitDist(1.9, 2.2) * 1.1 };
    const whole = { x: 0, y: 0, d: fitDist(2.5, 1.78) };
    if (P < .15) return lerpCam(closed, whole, ss(.03, .15, P));
    if (P >= .84) return lerpCam(whole, { x: 0, y: 0, d: whole.d * 1.25 }, ss(.84, .95, P));
    if (!narrow()) return whole;
    const pageL = { x: -.52, y: 0, d: fitDist(1.16, 1.56) }, pageR = { x: .52, y: 0, d: pageL.d };
    for (const [a, hEnd, bEnd] of SEG) {
      if (P >= a && P < hEnd) { const t = (P - a) / (hEnd - a); return t < .45 ? lerpCam(whole, pageL, ss(0, .18, t)) : lerpCam(pageL, pageR, ss(.45, .62, t)); }
      if (P >= hEnd && P < bEnd) return lerpCam(pageR, whole, ss(hEnd, hEnd + (bEnd - hEnd) * .4, P));
    }
    return whole;
  }
  function lerpCam(a, b, t) { return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), d: lerp(a.d, b.d, t) }; }

  let lastP = -1;
  const clock = new THREE.Clock();
  function progress() {
    const r = bookEl.getBoundingClientRect(), total = r.height - vh;
    return { P: clamp(-r.top / Math.max(1, total), 0, 1), r };
  }
  function tick() {
    requestAnimationFrame(tick);
    if (!bookEl.classList.contains('open')) return;
    const { P, r } = progress();
    const live = r.top < vh && r.bottom > 0;
    body.classList.toggle('book-live', live);
    // whiteout: in from .92, held through the end, cleared once the stage itself is white
    let w = ss(.9, .985, P); if (r.bottom < vh * .86) w = 0;
    doc.style.setProperty('--w', w.toFixed(3));
    if (!live) return;
    const t = clock.getElapsedTime();
    // open
    const open = ss(.05, .15, P);
    hinge.rotation.y = -Math.PI * open;
    book.position.x = -BW / 2 * (1 - open);
    book.rotation.y = lerp(.55, 0, ss(.0, .12, P)) + Math.sin(t * .4) * .015 * (1 - open * .7);
    book.rotation.x = lerp(-.32, -.06, ss(.0, .14, P));
    book.position.y = Math.sin(t * .9) * .03 * (1 - open * .6);
    // spreads + burns
    let cur = 0, next = 1, burn = 0;
    if (P >= SEG[0][1]) { burn = ss(SEG[0][1], SEG[0][2], P); }
    if (P >= SEG[1][0]) { cur = 1; next = 2; burn = ss(SEG[1][1], SEG[1][2], P); }
    if (P >= SEG[2][0]) { cur = 2; next = 3; burn = ss(SEG[2][1], SEG[2][2], P); }
    for (const m of [leftMat, rightMat]) {
      m.uniforms.tCur.value = spreadTex[cur]; m.uniforms.tNext.value = next < 3 ? spreadTex[next] : radianceTex;
      m.uniforms.uBurn.value = burn; m.uniforms.uTime.value = t;
      m.uniforms.uGlow.value = ss(.84, .95, P) * .9;
    }
    // star rises out of the radiant book
    const sp = ss(.84, .93, P);
    const sz = lerp(.2, 1.1, sp) + ss(.93, 1, P) * 2.5;
    starSprite.material.opacity = sp; starSprite.scale.set(sz * .95, sz, 1); starSprite.position.set(0, lerp(0, .1, sp), lerp(.15, .9, sp));
    glow.material.opacity = sp * .9 + ss(.9, 1, P); glow.scale.setScalar(lerp(.5, 4.5, sp) + ss(.92, 1, P) * 8); glow.position.copy(starSprite.position);
    under.intensity = 6 + sp * 30;
    // dust drift
    const pa = dustGeo.attributes.position;
    for (let i = 0; i < N; i++) { let y = pa.getY(i) + .0016 + seeds[i] * .0012; if (y > 1.8) y = -1.8; pa.setY(i, y); }
    pa.needsUpdate = true;
    // camera
    const c = camFor(P);
    camera.position.set(c.x * .92, c.y + .06, c.d + .1);
    camera.lookAt(c.x, c.y, .08);
    renderer.render(scene, camera);
    lastP = P;
  }
  tick();
}

if (bookEl.classList.contains('open')) start();
window.addEventListener('mm:bookopen', start);
