// Match the visible browser area, including mobile browser chrome and safe areas.
let viewportFrame;
function fitViewport(){
  cancelAnimationFrame(viewportFrame);
  viewportFrame=requestAnimationFrame(()=>{
    const height=window.visualViewport?.height || window.innerHeight;
    document.body.style.setProperty('--app-height',`${Math.round(height)}px`);
  });
}
if(document.body.classList.contains('game-page') && new URLSearchParams(location.search).get('embed')==='1') document.body.classList.add('embedded');
window.addEventListener('resize',fitViewport,{passive:true});
window.addEventListener('orientationchange',fitViewport,{passive:true});
window.visualViewport?.addEventListener('resize',fitViewport,{passive:true});
document.addEventListener('fullscreenchange',fitViewport);
fitViewport();

document.querySelectorAll('[data-help-tab]').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('[data-help-tab]').forEach(t=>t.setAttribute('aria-selected',String(t===tab)));
    document.querySelectorAll('[data-help-panel]').forEach(panel=>{panel.hidden=panel.dataset.helpPanel!==tab.dataset.helpTab;});
  });
  tab.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const tabs=[...document.querySelectorAll('[data-help-tab]')];
    const index=tabs.indexOf(tab);
    const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length;
    tabs[next].click();tabs[next].focus();
  });
});

export async function toggleFullscreen(button){
  const active=document.fullscreenElement || document.webkitFullscreenElement;
  try{
    if(active){const exit=document.exitFullscreen || document.webkitExitFullscreen;await exit?.call(document);}
    else {const root=document.documentElement;const request=root.requestFullscreen || root.webkitRequestFullscreen;if(request)await request.call(root);}
  }catch{
    // Viewport-fit play is already active on browsers without a full-screen API.
    if(button)button.title='Game already fits the visible screen';
  }
  fitViewport();
}
export function wireFullscreenButton(button){
  if(!button)return;
  const supported=typeof document.documentElement.requestFullscreen==='function' || typeof document.documentElement.webkitRequestFullscreen==='function';
  if(!supported){button.hidden=true;return;}
  button.addEventListener('click',()=>toggleFullscreen(button));
  const update=()=>{
    const active=!!(document.fullscreenElement||document.webkitFullscreenElement);
    button.setAttribute('aria-label',active?'Exit full screen':'Enter full screen');
    button.title=active?'Exit full screen':'Full screen';
    button.setAttribute('aria-pressed',String(active));
    if(button.id==='standaloneFullscreen')button.textContent=active?'Exit full screen':'Full screen';
  };
  document.addEventListener('fullscreenchange',update);
  document.addEventListener('webkitfullscreenchange',update);
  update();
}
document.querySelectorAll('[data-fullscreen-toggle]').forEach(wireFullscreenButton);
