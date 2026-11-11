(function(){
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

// tabs: any [data-tabs] holding [role=tab] buttons and [role=tabpanel] panels, matched by order
document.querySelectorAll('[data-tabs]').forEach(function(root){
  var tabs=[].slice.call(root.querySelectorAll('[role=tab]'));
  var panels=[].slice.call(root.querySelectorAll('[role=tabpanel]'));
  function sel(i,focus){
    tabs.forEach(function(t,n){var on=n===i;t.setAttribute('aria-selected',on?'true':'false');t.tabIndex=on?0:-1});
    panels.forEach(function(p,n){p.hidden=n!==i});
    if(focus)tabs[i].focus();
    // let reveal animations inside the newly shown panel run
    panels[i].querySelectorAll('.rv,[data-split],.shift').forEach(function(el){el.classList.add('in','done')});
  }
  tabs.forEach(function(t,i){
    t.addEventListener('click',function(){sel(i)});
    t.addEventListener('keydown',function(e){
      var n=null;
      if(e.key==='ArrowRight'||e.key==='ArrowDown')n=(i+1)%tabs.length;
      if(e.key==='ArrowLeft'||e.key==='ArrowUp')n=(i-1+tabs.length)%tabs.length;
      if(n===null)return;e.preventDefault();sel(n,true);
    });
  });
  sel(0);
});

// swipe rows
document.querySelectorAll('[data-swipe]').forEach(function(wrap){
  var row=wrap.querySelector('.swipe');
  wrap.querySelectorAll('[data-dir]').forEach(function(b){
    b.addEventListener('click',function(){
      var card=row.firstElementChild,step=card?card.getBoundingClientRect().width+24:320;
      row.scrollBy({left:step*(+b.dataset.dir),behavior:reduce?'auto':'smooth'});
    });
  });
});

// read more inside cards
document.querySelectorAll('[data-more]').forEach(function(b){
  b.addEventListener('click',function(){
    var m=document.getElementById(b.dataset.more),open=m.hidden;
    m.hidden=!open;b.setAttribute('aria-expanded',open?'true':'false');
    b.textContent=open?'Close':'Read the story';
  });
});

// glowing words
var pop=document.createElement('aside');pop.className='pop';pop.setAttribute('role','dialog');pop.setAttribute('aria-live','polite');
var veil=document.createElement('div');veil.className='pop-veil';
document.body.appendChild(veil);document.body.appendChild(pop);
var openBtn=null;
var openY=0;function closePop(){pop.classList.remove('on');veil.classList.remove('on');document.body.classList.remove('pop-open');if(openBtn){openBtn.setAttribute('aria-expanded','false');openBtn=null}}
function openPop(btn){
  var src=document.querySelector('#pops [data-pop="'+btn.dataset.pop+'"]');if(!src)return;
  if(openBtn===btn){closePop();return}
  closePop();
  pop.innerHTML='<button class="x" aria-label="Close">×</button>'+src.innerHTML;
  pop.querySelector('.x').addEventListener('click',closePop);
  openBtn=btn;btn.setAttribute('aria-expanded','true');
  pop.scrollTop=0;
  pop.classList.add('on');veil.classList.add('on');document.body.classList.add('pop-open');openY=scrollY;
}
document.addEventListener('click',function(e){
  var g=e.target.closest('.glow');
  if(g){e.preventDefault();openPop(g);return}
  if(openBtn&&!e.target.closest('.pop'))closePop();
});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closePop()});
addEventListener('scroll',function(){if(openBtn&&Math.abs(scrollY-openY)>260)closePop()},{passive:true});

document.querySelectorAll('a[href^="#"]:not([data-in])').forEach(function(a){a.addEventListener('click',function(e){var t=document.querySelector(a.getAttribute('href'));if(t){e.preventDefault();t.scrollIntoView({behavior:reduce?'auto':'smooth'})}})});

// dock
var dock=document.querySelector('.dock'),hero=document.querySelector('.hero'),end=document.querySelector('.scene.close');
function dockFrame(){
  if(!dock)return;
  var past=hero.getBoundingClientRect().bottom<innerHeight*.35;
  var atEnd=end.getBoundingClientRect().top<innerHeight*.5;
  dock.classList.toggle('on',past&&!atEnd);
}
addEventListener('scroll',dockFrame,{passive:true});dockFrame();

// "I'm in"
var dlg=document.getElementById('im-in');
document.querySelectorAll('[data-in]').forEach(function(b){
  b.addEventListener('click',function(e){e.preventDefault();closePop();
    if(b.dataset.in&&dlg.querySelector('[name=way]'))dlg.querySelector('[name=way]').value=b.dataset.in;
    if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','')});
});
dlg.querySelectorAll('[data-close]').forEach(function(b){b.addEventListener('click',function(){dlg.close()})});
dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close()});
var form=dlg.querySelector('form'),step1=dlg.querySelector('[data-step="1"]'),step2=dlg.querySelector('[data-step="2"]');
form.addEventListener('submit',function(e){
  e.preventDefault();
  var f=new FormData(form);
  var text='I\'m ready.\n\nName: '+f.get('name')+'\nEmail: '+f.get('email')+'\nWay in: '+f.get('way')+
    '\n\nMy commitment:\n'+f.get('commit')+'\n\n1. Where is my adventure going?\n'+f.get('treasure')+
    '\n\n2. What story has to end?\n'+f.get('ending')+
    '\n\n3. Looking back from the future, why was this the moment everything changed?\n'+f.get('moment');
  dlg.querySelector('pre').textContent=text;
  dlg.querySelector('[data-mail]').href='mailto:zachary@anotherworld.earth?subject='+encodeURIComponent('I\'m ready: the Metamyth Adventure')+'&body='+encodeURIComponent(text);
  step1.hidden=true;step2.hidden=false;dlg.scrollTop=0;
});
dlg.querySelector('[data-copy]').addEventListener('click',function(){
  var b=this,t=dlg.querySelector('pre').textContent;
  try{navigator.clipboard.writeText(t).then(function(){b.textContent='Copied'},function(){b.textContent='Select and copy the text above'})}
  catch(err){b.textContent='Select and copy the text above'}
});
dlg.querySelector('[data-back]').addEventListener('click',function(){step2.hidden=true;step1.hidden=false});
})();
