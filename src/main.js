import {projects,categories} from './projects.js';
import durations from './durations.json';
import technologies from './technologies.json';

const $ = (selector) => document.querySelector(selector);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const canPreview = () => finePointer.matches && !reduced.matches && !navigator.connection?.saveData;
const escape = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//,'')}`;
const media = (id,suffix) => asset(`media/${id}${suffix}`);
const time = (seconds) => `${Math.floor(Math.round(seconds)/60)}:${String(Math.round(seconds)%60).padStart(2,'0')}`;
const grid = $('#projects-grid');
grid.innerHTML = projects.map((p,i) => `<button type="button" class="project reveal ${p.featured?'featured':''}" data-open="${p.id}" data-category="${p.category}" aria-label="Assistir ${escape(p.title)}"><div class="project-media"><img src="${media(p.id,'.webp')}" alt="${escape(p.title)} em ação no Roblox" width="1280" height="720" loading="lazy" decoding="async"/><video muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video><span class="project-no">${String(i+1).padStart(2,'0')} / ${p.youtube?'YOUTUBE':time(durations[p.id])}</span><span class="project-play" aria-hidden="true">▶</span></div><div class="project-info"><div><span class="category-label">${escape(categories[p.category])}</span><h3>${escape(p.title)}</h3><p>${escape(p.description)}</p></div><span aria-hidden="true">↗</span></div></button>`).join('');

const dialog = $('#project-dialog');
const dialogVideo = $('#dialog-video');
const heroVideo = $('#hero-video');
const heroStage = $('#hero-stage');
const heroMotion = $('#hero-motion');
let activeProject = 0;
let currentHero = document.querySelector('[data-hero].active').dataset.hero;
$('#hero-description').textContent=projects.find(p=>p.id===currentHero).description;
let heroVisible = false;
let motionPaused = false;
let activePreview = null;
let previewTimer;
let closing = false;

function stopPreview(){
  clearTimeout(previewTimer);
  if(activePreview){
    const video = activePreview.querySelector('video');
    video.pause();
    video.removeAttribute('src');
    video.load();
    activePreview.classList.remove('previewing');
    activePreview = null;
  }
}
function syncHero(){
  if(canPreview() && heroVisible && !motionPaused && !document.hidden && !dialog.open && !activePreview){
    if(!heroVideo.getAttribute('src')) heroVideo.src = media(currentHero,'-preview.mp4');
    heroVideo.play().catch(()=>heroStage.classList.remove('playing'));
  }else heroVideo.pause();
  heroMotion.textContent = motionPaused?'▶':'Ⅱ';
  heroMotion.setAttribute('aria-pressed',String(motionPaused));
  heroMotion.setAttribute('aria-label',motionPaused?'Reproduzir prévia animada':'Pausar prévia animada');
}
heroVideo.addEventListener('playing',()=>heroStage.classList.add('playing'));
heroVideo.addEventListener('error',()=>heroStage.classList.remove('playing'));
heroMotion.addEventListener('click',()=>{motionPaused=!motionPaused;syncHero();});
new IntersectionObserver(([entry])=>{heroVisible=entry.isIntersecting;syncHero();},{threshold:.15}).observe(heroStage);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPreview();syncHero();});
reduced.addEventListener('change',()=>{stopPreview();syncHero();});
finePointer.addEventListener('change',()=>{stopPreview();syncHero();});

document.querySelectorAll('[data-hero]').forEach((button,i)=>button.addEventListener('click',()=>{
  if(currentHero===button.dataset.hero)return;
  currentHero=button.dataset.hero;
  const project=projects.find(p=>p.id===currentHero);
  heroVideo.pause();heroVideo.removeAttribute('src');heroVideo.load();heroStage.classList.remove('playing');
  $('#hero-poster').src=media(currentHero,'.webp');$('#hero-poster').alt=`${project.title} em ação no Roblox`;
  $('#hero-description').textContent=project.description;$('#hero-title').textContent=project.title;$('#hero-category').textContent=categories[project.category];$('#hero-index').textContent=`0${i+1} / 03`;
  $('.hero-open').dataset.open=currentHero;$('.hero-open').setAttribute('aria-label',`Assistir demonstração de ${project.title}`);
  document.querySelectorAll('[data-hero]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
  if(!reduced.matches)heroStage.animate([{opacity:.5,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:500,easing:'cubic-bezier(.22,1,.36,1)'});
  syncHero();
}));

function openProject(id){
  if(closing)return;
  const index=projects.findIndex(p=>p.id===id);if(index<0)return;
  activeProject=index;const p=projects[index];stopPreview();heroVideo.pause();
  dialogVideo.pause();dialogVideo.removeAttribute('src');dialogVideo.load();$('#youtube-player').removeAttribute('src');$('#youtube-player').hidden=true;$('#youtube-link').hidden=true;dialogVideo.hidden=Boolean(p.youtube);$('#video-error').hidden=true;
  $('#dialog-title').textContent=p.title;$('#dialog-description').textContent=p.description;
  $('#dialog-category').textContent=categories[p.category];$('#dialog-number').textContent=`PROJETO ${String(index+1).padStart(2,'0')} / ${p.youtube?'YOUTUBE':time(durations[p.id])}`;
  $('#dialog-features').replaceChildren(...p.features.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
  if(p.youtube){const frame=$('#youtube-player');frame.title=p.title;frame.hidden=false;frame.src=`https://www.youtube-nocookie.com/embed/${p.youtube}?rel=0`;$('#youtube-link').hidden=false;$('#youtube-link').href=`https://www.youtube.com/watch?v=${p.youtube}`;}else{dialogVideo.poster=media(p.id,'.webp');dialogVideo.src=media(p.id,'.mp4');$('#video-direct').href=media(p.id,'.mp4');}
  if(!dialog.open)dialog.showModal();dialog.scrollTop=0;
  if(!p.youtube)dialogVideo.play().catch(()=>{});
}
function closeProject(){
  if(!dialog.open||closing)return;
  closing=true;dialogVideo.pause();$('#youtube-player').removeAttribute('src');dialog.classList.add('closing');
  setTimeout(()=>{dialog.close();dialog.classList.remove('closing');dialogVideo.removeAttribute('src');dialogVideo.load();closing=false;syncHero();},reduced.matches?0:180);
}
document.addEventListener('click',e=>{const trigger=e.target.closest('[data-open]');if(trigger)openProject(trigger.dataset.open);});
$('#dialog-close').addEventListener('click',closeProject);
dialog.addEventListener('cancel',e=>{e.preventDefault();closeProject();});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeProject();}});
$('#next-project').addEventListener('click',()=>openProject(projects[(activeProject+1)%projects.length].id));
dialogVideo.addEventListener('error',()=>{if(dialogVideo.getAttribute('src'))$('#video-error').hidden=false;});

document.querySelectorAll('.project').forEach(card=>{
  card.addEventListener('pointerenter',()=>{
    if(!canPreview()||dialog.open||projects.find(p=>p.id===card.dataset.open)?.youtube)return;
    stopPreview();activePreview=card;syncHero();
    previewTimer=setTimeout(()=>{if(activePreview!==card)return;const video=card.querySelector('video');video.src=media(card.dataset.open,'-preview.mp4');video.play().then(()=>{if(activePreview===card)card.classList.add('previewing');else video.pause();}).catch(()=>{});},180);
  });
  card.addEventListener('pointerleave',()=>{if(activePreview===card){stopPreview();syncHero();}});
});
const previewVisibility=new IntersectionObserver(entries=>{for(const e of entries)if(!e.isIntersecting&&activePreview===e.target){stopPreview();syncHero();}});
document.querySelectorAll('.project').forEach(card=>previewVisibility.observe(card));
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  stopPreview();syncHero();const filter=button.dataset.filter;let count=0;
  document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});
  grid.classList.toggle('filtered',filter!=='all');
  [...grid.children].forEach(card=>{const show=filter==='all'||card.dataset.category===filter;card.hidden=!show;if(show){card.classList.add('is-visible');if(!reduced.matches)card.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:400,delay:Math.min(count*35,210),fill:'backwards',easing:'cubic-bezier(.22,1,.36,1)'});count++;}});
  $('#work-count').textContent=`${count} ${count===1?'projeto':'projetos'}`;
}));


$('#tech-grid').innerHTML=technologies.map(t=>`<div class="technology"><img src="${escape(asset(t.icon))}" alt="" width="27" height="27" loading="lazy"/><span>${escape(t.name)}</span></div>`).join('');
const profileHero=$('.profile-hero');
$('#code-rain').replaceChildren(...Array.from({length:12},(_,i)=>{const s=document.createElement('span');s.textContent=['local','0101','{}','game','Luau','0110','end','()','if','1010','then','return'].slice(i).concat(['{}','01','end','10']).join('\n');s.style.left=`${i*9}%`;s.style.animationDuration=`${22+i%5*4}s`;s.style.animationDelay=`${-i*3}s`;return s;}));
let profileVisible=false;
const syncProfile=()=>profileHero.classList.toggle('hero-active',profileVisible&&!document.hidden&&!reduced.matches);
new IntersectionObserver(([entry])=>{profileVisible=entry.isIntersecting;syncProfile();}).observe(profileHero);
document.addEventListener('visibilitychange',syncProfile);reduced.addEventListener('change',syncProfile);
const avatarScene=$('#avatar-scene');let avatarFrame=0;
avatarScene.addEventListener('pointermove',e=>{if(!canPreview())return;cancelAnimationFrame(avatarFrame);avatarFrame=requestAnimationFrame(()=>{const r=avatarScene.getBoundingClientRect();avatarScene.style.setProperty('--ry',`${((e.clientX-r.left)/r.width-.5)*12}deg`);avatarScene.style.setProperty('--rx',`${-((e.clientY-r.top)/r.height-.5)*12}deg`);});});
avatarScene.addEventListener('pointerleave',()=>{cancelAnimationFrame(avatarFrame);avatarScene.style.setProperty('--rx','0deg');avatarScene.style.setProperty('--ry','0deg');});

if(!reduced.matches)document.documentElement.classList.add('js-motion');
const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');reveal.unobserve(e.target);}}),{threshold:.06});
document.querySelectorAll('.reveal').forEach(el=>reveal.observe(el));
let tiltFrame=0;
heroStage.addEventListener('pointermove',e=>{if(!canPreview())return;cancelAnimationFrame(tiltFrame);tiltFrame=requestAnimationFrame(()=>{const r=heroStage.getBoundingClientRect();heroStage.style.setProperty('--ry',`${((e.clientX-r.left)/r.width-.5)*3}deg`);heroStage.style.setProperty('--rx',`${-((e.clientY-r.top)/r.height-.5)*3}deg`);});});
heroStage.addEventListener('pointerleave',()=>{cancelAnimationFrame(tiltFrame);heroStage.style.setProperty('--rx','0deg');heroStage.style.setProperty('--ry','0deg');});

let toastTimer;
document.querySelectorAll('[data-discord]').forEach(button=>button.addEventListener('click',async()=>{
  const toast=$('#toast');
  try{await navigator.clipboard.writeText('iag0d');toast.textContent='Copiado! Me adicione no Discord: iag0d';}catch{toast.textContent='Meu Discord é iag0d. Selecione o nome abaixo para copiar.';}
  clearTimeout(toastTimer);toast.classList.add('visible');toastTimer=setTimeout(()=>toast.classList.remove('visible'),4500);
}));
