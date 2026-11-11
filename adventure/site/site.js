(function(){
// split headings into words
document.querySelectorAll('[data-split]').forEach(el=>{let n=0;const walk=node=>{[...node.childNodes].forEach(c=>{if(c.nodeType===3){const parts=c.textContent.split(/(\s+)/);const f=document.createDocumentFragment();parts.forEach(p=>{if(!p)return;if(/^\s+$/.test(p)){f.appendChild(document.createTextNode(' '));return}const w=document.createElement('span');w.className='w';const i=document.createElement('span');i.textContent=p;i.style.setProperty('--i',n++);w.appendChild(i);f.appendChild(w)});c.replaceWith(f)}else if(c.nodeType===1&&c.tagName!=='BR')walk(c)})};walk(el)});
// stagger children
document.querySelectorAll('[data-stagger]').forEach(g=>{const step=+g.dataset.stagger||.12;[...g.children].forEach((c,i)=>{c.classList.add('rv');c.style.setProperty('--d',(i*step)+'s')})});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const t=e.target;t.classList.add('in');if(t.hasAttribute('data-split'))setTimeout(()=>t.classList.add('done'),2600);io.unobserve(e.target);if(e.target.dataset.count)count(e.target)}}),{threshold:.18,rootMargin:'0px 0px -6% 0px'});
document.querySelectorAll('.rv,[data-split],.shift,[data-count]').forEach(el=>io.observe(el));
setTimeout(()=>{if(!document.querySelector('.rv.in,[data-split].in'))document.querySelectorAll('.rv,[data-split],.shift').forEach(el=>el.classList.add('in','done'))},3000);
function count(el){const to=+el.dataset.count,t0=performance.now(),dur=1800;const tick=t=>{const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,4);el.textContent=Math.round(to*e);if(k<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)}
// parallax + progress + nav chapter
const par=[...document.querySelectorAll('[data-par]')],bar=document.querySelector('.progress'),nav=document.querySelector('.nav'),navCh=document.querySelector('.nav-ch'),chs=[...document.querySelectorAll('[data-chapter]')];
let ticking=false,lastCh='';
function frame(){ticking=false;const vh=innerHeight,y=scrollY;
 par.forEach(el=>{const r=el.parentElement.getBoundingClientRect();if(r.bottom<-200||r.top>vh+200)return;const off=(r.top+r.height/2-vh/2);const f=+el.dataset.par;el.style.transform=`translate3d(0,${off*-f}px,0) scale(${el.dataset.scale||1.08})`});
 bar.style.transform=`scaleX(${y/(document.documentElement.scrollHeight-vh)})`;
 nav.classList.toggle('solid',y>vh*.6);
 let ch='';for(const c of chs){if(c.getBoundingClientRect().top<vh*.5)ch=c.dataset.chapter}
 if(ch!==lastCh){lastCh=ch;navCh.style.opacity=0;setTimeout(()=>{navCh.textContent=ch;navCh.style.opacity=1},250)}}
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(frame)}},{passive:true});addEventListener('resize',frame);frame();
})();
