(() => {
  const root=document.documentElement,viewport=window.visualViewport;
  let scheduled=false;
  const update=()=>{scheduled=false;if(viewport&&viewport.scale!==1)return;root.style.setProperty('--usable-height',(viewport?.height||innerHeight)+'px');root.style.setProperty('--visual-top',(viewport?.offsetTop||0)+'px')};
  const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update)}};
  viewport?.addEventListener('resize',schedule);viewport?.addEventListener('scroll',schedule);window.addEventListener('resize',schedule);window.addEventListener('pageshow',schedule);
  const editing=()=>document.body.classList.toggle('mobile-editing',!!document.activeElement?.matches('input,select,textarea,[contenteditable=true]'));
  document.addEventListener('focusin',editing);document.addEventListener('focusout',()=>requestAnimationFrame(editing));
  update();
})();
