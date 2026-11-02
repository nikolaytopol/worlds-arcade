import { wireFullscreenButton } from './fullscreen.js';
import { createSlotVideo } from './slot-video.js';
const collectionTitle=document.title;
const worlds = {
  pass:{route:'the-pass',name:'The Pass',bonus:'Dinner Rush',accent:'#dbad68',tag:'The chef · Three orders. One perfect service.'},
  dune:{route:'dune',name:'Dune',bonus:'Ride the Maker',accent:'#e4b56c',tag:'The ranger · Find the rhythm of the deep desert.'},
  witcher:{route:'witcher',name:'The Witcher',bonus:'Signs of the Hunt',accent:'#c5d6c6',tag:'The wolf · Remember the signs. Complete the contract.'},
  ukraine:{route:'ukraine',name:'Sunflower Rising',bonus:'A New Dawn',accent:'#e8c76b',tag:'The restorer · Every small act brings a village to life.'},
};
const player = document.createElement('section');
player.className='arcade-player';
player.hidden=true;
player.setAttribute('aria-label','Play the collection');
player.innerHTML=`<div class="player-toolbar"><button class="library-button" type="button" aria-label="Return to game collection">← Collection</button><nav class="player-worlds" aria-label="Switch game">${Object.entries(worlds).map(([id,w])=>`<button type="button" data-world="${id}" aria-pressed="false"><i style="background:${w.accent}"></i>${w.name}</button>`).join('')}</nav><button class="viewport-fullscreen" type="button" data-fullscreen-toggle aria-label="Enter full screen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/></svg></button></div><div class="player-frame-wrap"><iframe class="game-frame" title="Choose a world" allow="autoplay; fullscreen" allowfullscreen scrolling="no" src="about:blank"></iframe><div class="frame-loading" role="status"><span class="loading-orbit"></span><p>Entering the world…</p></div></div>`;
document.querySelector('.site-header').after(player);
const frame=player.querySelector('iframe');
const loading=player.querySelector('.frame-loading');
wireFullscreenButton(player.querySelector('[data-fullscreen-toggle]'));
let current=null;
let loadingTimer;
const previews = new Map();
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');

function openWorld(id,updateHash=true){
  if(!worlds[id])return;
  const world=worlds[id];
  if(current===id&&!player.hidden)return;
  previews.forEach(film=>film.setActive(false));
  current=id;
  player.hidden=false;
  document.body.classList.add('arcade-playing');
  document.body.style.setProperty('--active-accent',world.accent);
  player.querySelectorAll('[data-world]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.world===id)));
  loading.hidden=false;
  loading.querySelector('p').textContent=`Entering ${world.name}…`;
  frame.title=`Play ${world.name} — ${world.bonus} bonus`;
  frame.src=`games/${world.route}.html?embed=1`;
  if(updateHash)history.pushState({world:id},'',`#play/${id}`);
  document.title=`${world.name} — Worlds Arcade`;
  window.scrollTo({top:0,behavior:'auto'});
  clearTimeout(loadingTimer);
  loadingTimer=setTimeout(()=>{loading.hidden=true;},6000);
}
function closeWorld(updateHash=true){
  frame.src='about:blank';
  player.hidden=true;
  document.body.classList.remove('arcade-playing');
  current=null;
  clearTimeout(loadingTimer);
  if(updateHash)history.pushState({},'','#collection');
  document.title=collectionTitle;
  document.getElementById('collection').scrollIntoView({block:'start'});
}
frame.addEventListener('load',()=>{
  loading.hidden=true;
  clearTimeout(loadingTimer);
});
player.querySelector('.library-button').addEventListener('click',()=>closeWorld());
player.querySelectorAll('[data-world]').forEach(b=>b.addEventListener('click',()=>openWorld(b.dataset.world)));
document.querySelectorAll('.world-card').forEach(card=>{
  const worldId=Object.keys(worlds).find(id=>card.getAttribute('href').includes(worlds[id].route));
  if(!worldId)return;
  const character=document.createElement('img');
  character.className='card-character';
  character.src=`assets/characters/${worldId}-idle.webp`;
  character.alt='';
  character.loading='lazy';
  card.append(character);
  const film=createSlotVideo(card,worldId,{reduced:motionPreference.matches,className:'card-film'});
  previews.set(worldId,film);
  let hovered=false;
  let keyboardFocused=false;
  let previewActive=false;
  const syncPreview=()=>{
    const next=player.hidden&&(hovered||keyboardFocused);
    film.setActive(next,{restart:next&&!previewActive,loop:true});
    previewActive=next;
  };
  card.addEventListener('pointerenter',event=>{
    hovered=event.pointerType!=='touch'&&matchMedia('(hover: hover)').matches;
    syncPreview();
  });
  card.addEventListener('pointerleave',()=>{hovered=false;syncPreview();});
  card.addEventListener('focus',()=>{keyboardFocused=card.matches(':focus-visible');syncPreview();});
  card.addEventListener('blur',()=>{keyboardFocused=false;syncPreview();});
  card.querySelector('.card-copy p').textContent=worlds[worldId].bonus+' · Interactive bonus';
  card.setAttribute('aria-label',`Play ${worlds[worldId].name}. ${worlds[worldId].tag} Bonus: ${worlds[worldId].bonus}.`);
  card.addEventListener('click',e=>{if(!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault();openWorld(worldId);}});
});
const followMotionPreference=event=>previews.forEach(film=>film.setReduced(event.matches));
if(motionPreference.addEventListener)motionPreference.addEventListener('change',followMotionPreference);
else motionPreference.addListener?.(followMotionPreference);
document.querySelector('.brand').addEventListener('click',e=>{if(current){e.preventDefault();closeWorld();}});
function followHash(){const id=location.hash.match(/^#play\/(pass|dune|witcher|ukraine)$/)?.[1];if(id)openWorld(id,false);else if(current)closeWorld(false);}
window.addEventListener('popstate',followHash);
window.addEventListener('hashchange',followHash);
followHash();
