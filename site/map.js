(function(){
const root=document.querySelector('.mp');if(!root)return;
const IC='offer-deck/assets/icons/',NS='http://www.w3.org/2000/svg';
const ARC={I:{c:'#d4a843',name:'OriginStory',region:'The Shore'},II:{c:'#2ec4b0',name:'Metamyth',region:'The Forge'},III:{c:'#8bc472',name:'MythOS',region:'The Kingdom'},IV:{c:'#c090c8',name:'StoryLiving',region:'The Sky'}};
const N=[
 ['I',150,780,'r','Origin','excavate your story','scroll','Self-guided initiation','A self-guided initiation into the seven arts of storytelling that reprograms your narrative operating system. You meet the author of your life and take the pen back.'],
 ['I',300,660,'r','Embodiment','land it in the body','shield-leaf','Session with Cataleya','The new story lands in the body, so the body carries it forward.'],
 ['I',440,790,'b','Threshold','close the old story','gate','Session with Zachary','Cross the threshold and close the old story. You walk out carrying your origin story and your VoiceSeed, in adventure mode, ready for the metamyth.'],
 ['II',575,660,'r','Calling','wound becomes gift','dragon','Week one','The Calling turns suffering into assignment. The dragon burning you is burning your people, and your sensitivity to that fire is your qualification to help them through it.'],
 ['II',520,520,'l','Quest','star, tribe, cause, power','north-star','Week one','The Quest finds your star, names your tribe, and forges the power you carry.'],
 ['II',670,560,'r','Sword Protocol','forge the methodology','sword','Week one','You walk the Sword Protocol and forge your transformation into a scalable methodology. We workshop it until it cuts.'],
 ['II',620,410,'l','Vision','architect the world','crystal-ball','Week two','A future vivid enough that the brain starts building it. Personal to planetary, each scale a natural consequence of the one before.'],
 ['II',790,455,'r','Mission','lay the first brick','flag','Week two','The Mission grounds the vision in ethos and agreements.'],
 ['II',740,310,'l','Request','open the door','megaphone','Week two','The Request shapes your offer, maps every door into your world, and writes the legend that travels without you.'],
 ['II',905,370,'r','Re-source','ground the source','fountain','Week two','The Re-source protocol grounds the source and closes the arc.'],
 ['II',870,235,'l','Return','seven generations forward','landscape','Week three','The Return looks seven generations forward.'],
 ['II',1005,180,'t','The Metamyth','the story walks on its own','map','Week three','We craft your metamyth: the full arc from origin to legacy, a story so fully lived it begins to travel on its own. You learn to wield it as pitch, as invitation, as the narrative spine of everything you build.'],
 ['II',1120,290,'r','Celebration','integration','chalice','Week three','Then we celebrate the crossing.'],
 ['III',1230,440,'r','The Council','the council assembles','council','MythOS','The whole team convenes around your mission. Roles assigned, rhythm established.'],
 ['III',1390,530,'l','Content System','your voice on every platform','compass','MythOS','Systematic storytelling running on your voice across every platform.'],
 ['III',1260,630,'b','Offer Spreads','the story carries itself','bridge','MythOS','The transformation is the marketing. Customers become community, community becomes co-creators spreading the story.'],
 ['III',1420,745,'l','Capital Flow','capital that finds you','pearl','MythOS','The financial narrative that makes you undeniable to the investors who get it.'],
 ['IV',1510,215,'l','Cinema','your story on screen','wizard-hat','StoryLiving · by invitation','Your story on screen. Documentary, narrative, episodic.'],
 ['IV',1335,115,'b','Ceremony','retreat and residency','fire','StoryLiving · by invitation','Adventure and ceremony retreats in the heart of the world.'],
 ['IV',1170,80,'b','Federation','a planetary network','globe','StoryLiving · by invitation','A planetary network of missions rewriting the source code of the world.'],
 ['IV',800,70,'b','Partnership','we share in the treasure','butterfly','StoryLiving · by invitation','A launch, a raise, a campaign. We partner on outcomes and share in the treasure.'],
].map((n,i)=>({i,arc:n[0],x:n[1],y:n[2],lab:n[3],t:n[4],tag:n[5],ic:n[6],who:n[7],d:n[8]}));
const REG=[['I',60,560,340,760,300,200],['II',330,300,780,420,380,300],['III',1140,860,1330,590,260,220],['IV',80,120,1150,120,700,120]];
let s=`<svg viewBox="0 0 1600 900" role="group" aria-label="Journey map"><defs><radialGradient id="mpG"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`;
let seed=7;const rnd=()=>(seed=(seed*9301+49297)%233280)/233280;
s+='<g class="mp-region" data-arc="IV">';for(let k=0;k<70;k++){const r=rnd()*1.4+.4;s+=`<circle class="mp-star" cx="${(rnd()*1600).toFixed(0)}" cy="${(rnd()*250).toFixed(0)}" r="${r.toFixed(1)}" opacity="${(rnd()*.5+.15).toFixed(2)}"/>`}s+='</g>';
REG.forEach(([a,tx,ty,cx,cy,rx,ry])=>{const c=ARC[a].c;s+=`<g class="mp-region" data-arc="${a}" style="--c:${c}">`;for(let k=1;k<=4;k++)s+=`<ellipse cx="${cx}" cy="${cy}" rx="${rx*k/4}" ry="${ry*k/4}" fill="none" stroke="${c}" stroke-opacity="${.1-k*.015}"/>`;s+=`<text x="${tx}" y="${ty}">${ARC[a].region}</text><text class="sub" x="${tx+4}" y="${ty+26}">Arc ${a} · ${ARC[a].name}</text></g>`});
const P=N.map(n=>[n.x,n.y]);const segD=[];
for(let i=0;i<P.length-1;i++){const p0=P[i-1]||P[i],p1=P[i],p2=P[i+1],p3=P[i+2]||p2;const c1=[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6],c2=[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6];segD.push(`M${p1} C${c1} ${c2} ${p2}`)}
segD.forEach((d,i)=>{const a=N[i+1].arc;s+=`<g class="mp-seg" data-arc="${a}" style="--c:${ARC[a].c}"><path class="base" d="${d}"/><path class="lit" d="${d}"/></g>`});
s+=`<path class="mp-main" d="${segD.map((d,i)=>i?d.replace(/^M[^C]+/,''):d).join(' ')}" fill="none" stroke="none"/>`;
N.forEach(n=>{const c=ARC[n.arc].c;const lx={r:[48,4,'start'],l:[-48,4,'end'],t:[0,-60,'middle'],b:[0,68,'middle']}[n.lab];
 s+=`<g class="mp-node mp-pop" data-i="${n.i}" data-arc="${n.arc}" style="--c:${c};--d:${(n.i*.06).toFixed(2)}s" tabindex="0" role="button" aria-label="${n.t}"><circle class="halo" cx="${n.x}" cy="${n.y}" r="52"/><circle class="ring" cx="${n.x}" cy="${n.y}" r="36"/><image href="${IC}${n.ic}.png" x="${n.x-27}" y="${n.y-27}" width="54" height="54"/><text x="${n.x+lx[0]}" y="${n.y+lx[1]-(n.lab==='t'?22:(n.lab==='b'?0:10))}" text-anchor="${lx[2]}" class="num">${String(n.i+1).padStart(2,'0')}</text><text x="${n.x+lx[0]}" y="${n.y+lx[1]+(n.lab==='t'?0:(n.lab==='b'?24:14))}" text-anchor="${lx[2]}">${n.t}</text></g>`});
s+=`<circle class="mp-trav" r="6" cx="${P[0][0]}" cy="${P[0][1]}"/><circle r="26" fill="url(#mpG)" class="mp-trav-g" cx="${P[0][0]}" cy="${P[0][1]}"/></svg>`;
const map=root.querySelector('.mp-map');map.innerHTML=s;
const svg=map.querySelector('svg'),main=svg.querySelector('.mp-main'),trav=svg.querySelector('.mp-trav'),travG=svg.querySelector('.mp-trav-g');
const lits=[...svg.querySelectorAll('.mp-seg .lit')],segLen=lits.map(p=>p.getTotalLength());
lits.forEach((p,i)=>{p.style.strokeDasharray=segLen[i];p.style.strokeDashoffset=segLen[i]});
const cum=[0];segLen.forEach((l,i)=>cum.push(cum[i]+l));
const nodes=[...svg.querySelectorAll('.mp-node')];
let cur=-1,curL=0,raf=0;
function travel(to){cancelAnimationFrame(raf);const from=curL,t0=performance.now(),dur=Math.min(1600,300+Math.abs(to-from)*1.2);
 const step=t=>{const k=Math.min(1,(t-t0)/dur),e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;curL=from+(to-from)*e;const p=main.getPointAtLength(curL);trav.setAttribute('cx',p.x);trav.setAttribute('cy',p.y);travG.setAttribute('cx',p.x);travG.setAttribute('cy',p.y);if(k<1)raf=requestAnimationFrame(step)};raf=requestAnimationFrame(step)}
const panel=root.querySelector('.mp-panel');
function select(i){if(i===cur)return;cur=i;const n=N[i],a=ARC[n.arc];
 nodes.forEach((g,k)=>{g.classList.toggle('on',k===i);g.classList.toggle('done',k<i)});
 lits.forEach((p,k)=>p.style.strokeDashoffset=k<i?0:segLen[k]);travel(cum[i]);
 panel.style.setProperty('--c',a.c);const body=panel.querySelector('.mp-body');body.classList.add('swap');
 setTimeout(()=>{body.innerHTML=`<img class="ic" src="${IC}${n.ic}.png" alt=""><div class="label">Arc ${n.arc} · ${a.name}</div><h3>${n.t}</h3><div class="tag">${n.tag}</div><div class="who">${n.who}</div><p>${n.d}</p>`;body.classList.remove('swap')},180);
 panel.querySelector('[data-d="-1"]').disabled=i===0;panel.querySelector('[data-d="1"]').disabled=i===N.length-1;panel.querySelector('.cnt').textContent=`${String(i+1).padStart(2,'0')} / ${N.length}`}
panel.innerHTML=`<div class="mp-body"></div><div class="nav3"><button data-d="-1">← Back</button><span class="cnt"></span><button data-d="1">Onward →</button></div>`;
panel.querySelectorAll('.nav3 button').forEach(b=>b.onclick=()=>select(Math.max(0,Math.min(N.length-1,cur+ +b.dataset.d))));
nodes.forEach(g=>{const i=+g.dataset.i;g.addEventListener('click',()=>select(i));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(i)}})});
const chips=root.querySelector('.mp-chips');chips.innerHTML=[['All',''],...Object.entries(ARC).map(([k,v])=>[`${k} · ${v.name}`,k])].map(([l,k])=>`<button data-k="${k}" style="--c:${k?ARC[k].c:'#d4a843'}">${l}</button>`).join('');
const els=[...svg.querySelectorAll('[data-arc]')];
chips.querySelectorAll('button').forEach(b=>b.onclick=()=>{const k=b.dataset.k;chips.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));if(k){root.dataset.f=k;els.forEach(e=>e.classList.toggle('dim',e.dataset.arc!==k));select(N.findIndex(n=>n.arc===k))}else{delete root.dataset.f;els.forEach(e=>e.classList.remove('dim'))}});
chips.querySelector('button').classList.add('on');
select(0);
new IntersectionObserver((es,o)=>es.forEach(e=>{if(e.isIntersecting){root.classList.add('in');o.disconnect()}}),{threshold:.1}).observe(root);setTimeout(()=>root.classList.add('in'),2500);
})();
