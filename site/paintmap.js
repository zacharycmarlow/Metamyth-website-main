(function(){
const root=document.querySelector('.pm');if(!root)return;
const IW=1536,IH=1024,IC='offer-deck/assets/icons/';
const ARC={I:{c:'#d4a843',region:'The Shore',chip:'Origin · Weeks 1–3'},II:{c:'#2ec4b0',region:'The Forge',chip:'Metamyth · Weeks 4–9'},III:{c:'#8bc472',region:'The Kingdom',chip:'MythOS · after the quest'},IV:{c:'#c090c8',region:'The Sky',chip:'The Federation · by invitation'}};
// arc, x, y (image px), title, tagline, when, icon, description
const N=[
['I',229,357,'Origin','take the pen back','Weeks 1–3 · in community','scroll','A self-guided initiation into the seven arts of storytelling that reprograms your narrative operating system. You meet the author of your life and take the pen back, alongside people doing the same.'],
['I',312,520,'Embodiment','land it in the body','Runs through every week','shield-leaf','The new story lands in the body, every week, so the body carries it forward.'],
['I',412,568,'Threshold','close the old story','Week 3','gate','Cross the threshold and close the old story. You walk out carrying your origin story and your VoiceSeed, ready for the metamyth.'],
['II',523,568,'Calling','wound becomes gift','Week 4','dragon','The Calling turns suffering into assignment. The dragon burning you is burning your people, and your sensitivity to that fire is your qualification to help them through it.'],
['II',582,520,'Quest','star, tribe, cause, power','Week 5','north-star','The Quest finds your star, names your tribe, and forges the power you carry.'],
['II',637,463,'Sword Protocol','forge the methodology','Week 5','sword','You walk the Sword Protocol and forge your transformation into a scalable methodology. We workshop it until it cuts.'],
['II',768,222,'Vision','architect the world','Week 6','crystal-ball','A future vivid enough that the brain starts building it. Personal to planetary, each scale a natural consequence of the one before.'],
['II',858,322,'Mission','lay the first brick','Week 7','flag','The Mission grounds the vision in ethos and agreements.'],
['II',903,410,'Request','open the door','Week 8','megaphone','The Request shapes your offer, maps every door into your world, and writes the legend that travels without you.'],
['II',800,470,'Re-source','ground the source','Week 8','fountain','The Re-source protocol grounds the source and closes the arc.'],
['II',921,553,'Return','seven generations forward','Week 9','landscape','The Return looks seven generations forward.'],
['II',917,640,'The Metamyth','the story walks on its own','Week 9','map','We craft your metamyth: the full arc from origin to legacy, a story so fully lived it begins to travel on its own. You learn to wield it as pitch, as invitation, as the narrative spine of everything you build.'],
['II',1035,647,'Celebration','integration','Week 9','chalice','Then we celebrate the crossing, together.'],
['III',1162,636,'The Council','the council assembles','After the quest','council','The whole team convenes around your mission. Roles assigned, rhythm established.'],
['III',1229,615,'Story Everywhere','your voice on every platform','After the quest','compass','Your story carried across every platform in your voice.'],
['III',1303,510,'Offer Spreads','the story carries itself','After the quest','bridge','The transformation is the marketing. Customers become community, community becomes co-creators spreading the story.'],
['III',1237,431,'Capital Flow','capital that finds you','After the quest','pearl','The financial narrative that makes you undeniable to the investors who get it.'],
['IV',460,148,'Federation','a planetary network','By invitation','globe','A planetary network of missions rewriting the source code of the world.'],
['IV',1135,168,'Partnership','we share in the treasure','By invitation','butterfly','A launch, a raise, a campaign. We partner on outcomes and share in the treasure.'],
['IV',1410,560,'Guide Others Across','the next ones cross','By invitation','wizard-hat','The journey you walked becomes the journey others walk. You guide the next ones across.'],
].map((n,i)=>({i,arc:n[0],x:n[1],y:n[2],t:n[3],tag:n[4],who:n[5],ic:n[6],d:n[7]}));
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const stage=root.querySelector('.pm-stage'),cam=root.querySelector('.pm-cam'),img=cam.querySelector('img');
const cv=document.createElement('canvas');cv.width=IW;cv.height=IH;cam.appendChild(cv);const ctx=cv.getContext('2d');
const mk=document.createElement('canvas');mk.width=IW;mk.height=IH;const mctx=mk.getContext('2d');
const col=new Image();col.src=img.src;
// hotspots
const hs=N.map(n=>{const el=document.createElement('div');el.className='pm-hs'+(n.x>1250?' flip':'');el.style.cssText=`left:${n.x/IW*100}%;top:${n.y/IH*100}%;--c:${ARC[n.arc].c}`;el.dataset.arc=n.arc;el.innerHTML=`<button aria-label="${n.t}"></button><span class="pm-lb"><i>${String(n.i+1).padStart(2,'0')}</i>${n.t}</span>`;el.querySelector('button').onclick=()=>{stopWalk();select(n.i)};cam.appendChild(el);return el});
// watercolor blobs
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
function blob(x,y,r,delay){const d=[{dx:0,dy:0,r:r*.62,w:0}];const n=Math.round(14+r/8);for(let k=0;k<n;k++){const a=rnd()*Math.PI*2,dist=Math.pow(rnd(),.7)*r*.82;d.push({dx:Math.cos(a)*dist,dy:Math.sin(a)*dist*.85,r:r*(.22+rnd()*.32),w:dist/r*.45})}return{x,y,d,delay}}
function paint(c,b,k){for(const d of b.d){const p=Math.max(0,Math.min(1,(k-d.w)/(1-d.w)));if(!p)continue;const e=1-Math.pow(1-p,3),R=d.r*e;if(R<1)continue;const cx=b.x+d.dx*(.6+.4*e),cy=b.y+d.dy*(.6+.4*e);const g=c.createRadialGradient(cx,cy,0,cx,cy,R);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.55,'rgba(0,0,0,.9)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.arc(cx,cy,R,0,Math.PI*2);c.fill()}}
let active=[],raf=0;const DUR=reduce?200:1700;
function tick(t){ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,IW,IH);ctx.drawImage(mk,0,0);
 active=active.filter(b=>{const k=(t-b.t0)/DUR;if(k<=0)return true;if(k>=1){paint(mctx,b,1);ctx.globalCompositeOperation='source-over';paint(ctx,b,1);return false}paint(ctx,b,k);return true});
 ctx.globalCompositeOperation='source-in';ctx.drawImage(col,0,0,IW,IH);ctx.globalCompositeOperation='source-over';
 raf=active.length?requestAnimationFrame(tick):0}
function queue(bs){const t=performance.now();bs.forEach(b=>{b.t0=t+b.delay*1000;active.push(b)});if(!raf)raf=requestAnimationFrame(tick)}
let maxRev=-1,full=false;const RAD={I:120,II:92,III:100,IV:130};
// zone rects in image px [x0,y0,x1,y1]
const ZONE={I:[0,250,500,1024],II:[470,150,1110,1024],III:[1090,300,1536,1024],IV:[0,0,1536,260]};
const lastOf={};N.forEach(n=>lastOf[n.arc]=n.i);const filled=new Set();
function fillZone(k,ox,oy,d0){const[x0,y0,x1,y1]=ZONE[k],st=95,bs=[];for(let x=x0+st/2;x<x1;x+=st)for(let y=y0+st/2;y<y1;y+=st){const px=x+(rnd()-.5)*50,py=y+(rnd()-.5)*50;bs.push(blob(px,py,150,d0+Math.hypot(px-ox,py-oy)/900*1.8))}return bs}
function reveal(i){if(i<=maxRev)return;const bs=[];let q=0;
 for(let j=maxRev+1;j<=i;j++){const n=N[j],p=N[j-1];
  if(p&&p.arc!=='IV'&&n.arc!=='IV'){const dx=n.x-p.x,dy=n.y-p.y,L=Math.hypot(dx,dy),s=Math.max(1,Math.round(L/40));for(let k=1;k<s;k++)bs.push(blob(p.x+dx*k/s,p.y+dy*k/s,62,q*.32+k/s*.5))}
  bs.push(blob(n.x,n.y,RAD[n.arc],q*.32+.35));q++;
  if(lastOf[n.arc]===j&&!filled.has(n.arc)){filled.add(n.arc);bs.push(...fillZone(n.arc,n.x,n.y,q*.32+.6))}}
 maxRev=i;queue(bs);hs.forEach((h,k)=>h.classList.toggle('seen',k<=maxRev));
 if(i===N.length-1&&!full){full=true;const L=N[i],fb=[];for(let gx=0;gx<=8;gx++)for(let gy=0;gy<=5;gy++){const x=gx*IW/8+(rnd()-.5)*80,y=gy*IH/5+(rnd()-.5)*80;fb.push(blob(x,y,260,1+Math.hypot(x-L.x,y-L.y)/IW*2.2))}queue(fb)}}
// camera
function camTo(i){const W=stage.clientWidth,H=stage.clientHeight;if(i<0||W<500){cam.style.transform='none';return}const s=1.16,n=N[i];let tx=W/2-n.x/IW*W*s,ty=H/2-n.y/IH*H*s;tx=Math.min(0,Math.max(W-W*s,tx));ty=Math.min(0,Math.max(H-H*s,ty));cam.style.transform=`translate(${tx}px,${ty}px) scale(${s})`}
// panel
const panel=root.querySelector('.mp-panel');
panel.innerHTML=`<div class="mp-body"></div><div class="nav3"><button data-d="-1">← Back</button><span class="cnt"></span><button data-d="1">Onward →</button></div>`;
const body=panel.querySelector('.mp-body'),back=panel.querySelector('[data-d="-1"]'),fwd=panel.querySelector('[data-d="1"]'),cnt=panel.querySelector('.cnt');
let cur=-1;
function render(){const n=N[cur];if(!n){panel.style.setProperty('--c','#d4a843');body.innerHTML=`<img class="ic intro-ic" src="${IC}map.png" alt=""><div class="label">The Map</div><h3>The map is still a sketch.</h3><p>Every stop you open bleeds into color. Clear a land and the whole of it comes alive.</p><p class="who">Tap any stop, or walk it in order.</p>`;cnt.textContent=`00 / ${N.length}`;back.disabled=true;fwd.disabled=false;return}
 const a=ARC[n.arc];panel.style.setProperty('--c',a.c);body.innerHTML=`<img class="ic" src="${IC}${n.ic}.png" alt=""><div class="label">${a.region} · ${a.chip}</div><h3>${n.t}</h3><div class="tag">${n.tag}</div><div class="who">${n.who}</div><p>${n.d}</p>`;
 cnt.textContent=`${String(cur+1).padStart(2,'0')} / ${N.length}`;back.disabled=cur<=0;fwd.disabled=cur>=N.length-1}
function select(i){if(i===cur)return;cur=i;hs.forEach((h,k)=>h.classList.toggle('on',k===i));reveal(i);camTo(i);
 const a=N[i].arc;hs.forEach(h=>h.classList.toggle('inarc',h.dataset.arc===a));
 chips.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.k===a));root.dataset.arc=a;
 body.classList.add('swap');setTimeout(()=>{render();body.classList.remove('swap')},200)}
back.onclick=()=>{stopWalk();if(cur>0)select(cur-1)};fwd.onclick=()=>{stopWalk();select(Math.min(N.length-1,cur+1))};
// chips
const chips=root.querySelector('.mp-chips');
chips.innerHTML=Object.entries(ARC).map(([k,v])=>`<button data-k="${k}" style="--c:${v.c}">${v.region}</button>`).join('');
chips.querySelectorAll('button').forEach(b=>b.onclick=()=>{stopWalk();select(N.findIndex(n=>n.arc===b.dataset.k))});
// walk
const walkBtn=root.querySelector('.pm-walk');let wt=0;
function stopWalk(){clearTimeout(wt);wt=0;walkBtn.classList.remove('on');walkBtn.textContent='Walk the map →'}
function step(){const nx=cur>=N.length-1?0:cur+1;select(nx);if(nx<N.length-1)wt=setTimeout(step,2900);else stopWalk()}
walkBtn.onclick=()=>{if(wt){stopWalk();return}walkBtn.classList.add('on');walkBtn.textContent='Pause';step()};
addEventListener('resize',()=>camTo(cur));
render();
col.onload=()=>{ctx.clearRect(0,0,IW,IH)};
})();
