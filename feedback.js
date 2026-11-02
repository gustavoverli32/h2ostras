(() => {
  'use strict';
  const DRAFT_KEY = 'h2ostras.annotation.draft';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const annotation = document.createElement('dialog');
  annotation.id = 'annotationDialog'; annotation.dataset.annotationUi = 'true';
  annotation.setAttribute('aria-labelledby', 'annotationTitle');
  const launcher = document.createElement('button');
  launcher.className = 'annotation-launch'; launcher.dataset.annotationUi = 'true';
  launcher.innerHTML = '<span aria-hidden="true">⌖</span> Anotar'; launcher.type = 'button';
  launcher.setAttribute('aria-label','Anotar uma alteração na plataforma');
  document.body.append(annotation,launcher);
  const logout=document.createElement('button');logout.type='button';logout.className='backup-link';logout.title='Sair da plataforma';logout.setAttribute('aria-label','Sair da plataforma');
  logout.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M9 4H4v16h5m5-13 5 5-5 5M8 12h11"/></svg><span>Sair</span>';
  document.querySelector('.side-foot')?.append(logout);
  logout.addEventListener('click',async()=>{logout.disabled=true;try{saveDraft();const result=await api('/api/logout',{method:'POST'});location.assign(result.redirect)}catch{logout.disabled=false;logout.querySelector('span').textContent='Tentar sair novamente'}});
  const modalLauncher=document.createElement('button');modalLauncher.type='button';modalLauncher.className='annotation-modal-launch';modalLauncher.dataset.annotationUi='true';modalLauncher.textContent='Anotar';
  document.querySelector('#dialog .dialog-head')?.insertBefore(modalLauncher,document.querySelector('#dialog .dialog-head [data-action="close"]'));
  let draft=null, capture=null, origin=null, selection=null, busy=false, session=null, controller=null, priorFocus=null, retained=null;
  const api=async(path,options={})=>{const r=await fetch(path,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000),...options});const data=await r.json();if(!r.ok)throw Object.assign(new Error(data.error||'Não foi possível conectar.'),{status:r.status});return data};
  const saveDraft=()=>{if(!draft)return;try{sessionStorage.setItem(DRAFT_KEY,JSON.stringify(draft));return true}catch{return false}};
  const clearDraft=()=>{try{sessionStorage.removeItem(DRAFT_KEY)}catch{}};
  const restoreFocus=()=>{if(priorFocus?.isConnected)priorFocus.focus();else launcher.focus()};
  function stopSelection(){controller?.abort();controller=null;origin=null;selection=null;capture=null;}
  function close(){annotation.close();stopSelection();restoreFocus()}
  function error(text){const box=annotation.querySelector('.annotation-error');if(box)box.textContent=text}
  function loadCaptureLibrary(){
    if(window.html2canvas)return Promise.resolve();
    return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='./vendor/html2canvas.min.js';script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Não foi possível preparar o recorte. Tente novamente.'))};document.head.append(script)});
  }
  async function start(){
    if(busy)return;if(draft){form();return}
    priorFocus=document.activeElement;busy=true;launcher.disabled=true;launcher.textContent='Preparando…';
    try{
      await loadCaptureLibrary();
      const openDialogs=Array.from(document.querySelectorAll('dialog[open]')).filter(el=>el!==annotation).map(el=>({id:el.id,rect:el.getBoundingClientRect(),scroll:el.scrollTop}));
      capture=await window.html2canvas(document.body,{x:window.scrollX,y:window.scrollY,width:window.innerWidth,height:window.innerHeight,scrollX:window.scrollX,scrollY:window.scrollY,scale:Math.min(1,1440/window.innerWidth),logging:false,imageTimeout:3000,ignoreElements:el=>el.hasAttribute('data-annotation-ui'),onclone:doc=>{
        doc.querySelectorAll('input[type=password],[data-private]').forEach(el=>{el.value='';el.textContent=''});
        // A cloned dialog loses the browser's top layer. Preserve its visible placement.
        openDialogs.forEach(({id,rect:r,scroll})=>{const el=doc.getElementById(id);if(!el)return;Object.assign(el.style,{display:'block',position:'fixed',inset:'auto',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',margin:'0',transform:'none',zIndex:'2147483000'});el.scrollTop=scroll;});
      }});
      choose();
    }catch(err){draft=null;annotation.className='annotation-form';annotation.innerHTML='<h2 id="annotationTitle">Não foi possível iniciar</h2><p>'+esc(err.message)+'</p><button type="button" data-note-action="close">Fechar</button>';annotation.showModal()}
    finally{busy=false;launcher.disabled=false;launcher.innerHTML='<span aria-hidden="true">⌖</span> Anotar'}
  }
  function choose(){
    annotation.className='annotation-select';
    annotation.innerHTML='<div class="annotation-instruction"><div><h2 id="annotationTitle">Marque o que deseja alterar</h2><p>Clique em um elemento ou arraste uma área.</p></div><div class="annotation-tools"><button type="button" data-note-action="move" aria-label="Mover instruções para outra borda" title="Mover instruções">↕</button><button type="button" data-note-action="close">Cancelar</button></div></div><div class="annotation-box" hidden></div>';
    annotation.showModal();
    controller=new AbortController();const opts={signal:controller.signal};
    annotation.addEventListener('pointerdown',e=>{if(e.target.closest('.annotation-instruction'))return;e.preventDefault();origin={x:e.clientX,y:e.clientY};annotation.setPointerCapture(e.pointerId)},opts);
    annotation.addEventListener('pointermove',e=>{if(!origin)return;paint(rect(origin,{x:e.clientX,y:e.clientY}))},opts);
    annotation.addEventListener('pointerup',e=>{if(!origin)return;const from=origin;origin=null;let area=rect(from,{x:e.clientX,y:e.clientY});
      annotation.close();let target=document.elementFromPoint(from.x,from.y);
      target=target?.closest('button,a,input,select,textarea,label,h1,h2,h3,article,section,td,p')||target;
      if(area.width<8&&area.height<8){if(!target)return;const r=target.getBoundingClientRect();area=rect({x:r.left,y:r.top},{x:r.right,y:r.bottom})}
      if(area.width<4||area.height<4){annotation.showModal();return}
      finishSelection(area,target);
    },opts);
    annotation.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.target.closest('button')){e.preventDefault();finishSelection({x:0,y:0,width:window.innerWidth,height:window.innerHeight},document.querySelector('#view'))}},opts);
    window.addEventListener('resize',()=>{close();launcher.textContent='Anotar';},opts);
  }
  function rect(a,b){const x=Math.max(0,Math.min(a.x,b.x)),y=Math.max(0,Math.min(a.y,b.y));return {x,y,width:Math.max(0,Math.min(innerWidth,Math.max(a.x,b.x))-x),height:Math.max(0,Math.min(innerHeight,Math.max(a.y,b.y))-y)}}
  function paint(r){const box=annotation.querySelector('.annotation-box');box.hidden=false;Object.assign(box.style,{left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px'})}
  function targetLabel(el){if(!el)return 'Área da tela';let label=el.getAttribute('aria-label')||el.labels?.[0]?.textContent||el.innerText||el.tagName;let path=[],node=el;for(let i=0;node&&node!==document.body&&i<4;i++,node=node.parentElement){path.unshift(node.tagName.toLowerCase()+(node.id?'#'+node.id:''));if(node.id)break}return (String(label).replace(/\s+/g,' ').slice(0,160)+' · '+path.join(' > ')).slice(0,600)}
  function finishSelection(r,target){
    const scale=capture.width/innerWidth,pad=20,x=Math.max(0,r.x-pad),y=Math.max(0,r.y-pad),w=Math.min(innerWidth-x,r.width+pad*2),h=Math.min(innerHeight-y,r.height+pad*2);
    const canvas=document.createElement('canvas'),outScale=Math.min(1,1200/(w*scale),1000/(h*scale));canvas.width=Math.round(w*scale*outScale);canvas.height=Math.round(h*scale*outScale);
    const ctx=canvas.getContext('2d');ctx.drawImage(capture,x*scale,y*scale,w*scale,h*scale,0,0,canvas.width,canvas.height);ctx.strokeStyle='#0781ac';ctx.lineWidth=3;ctx.strokeRect((r.x-x)*scale*outScale,(r.y-y)*scale*outScale,r.width*scale*outScale,r.height*scale*outScale);
    let image=canvas.toDataURL('image/jpeg',.75);if(image.length>580000)image=canvas.toDataURL('image/jpeg',.4);if(image.length>580000)image=null;
    draft={id:crypto.randomUUID(),kind:retained?.kind||'Melhoria',message:retained?.message||'',route:'/'+location.hash,pageTitle:document.title,element:targetLabel(target),selection:{...r,viewportWidth:innerWidth,viewportHeight:innerHeight,scrollX,scrollY},image};retained=null;
    if(draft.route==='/')draft.route='/#atendimento';
    stopSelection();annotation.close();form();
  }
  async function form(){
    if(!draft)return;
    annotation.className='annotation-form';
    annotation.innerHTML='<div class="annotation-heading"><div><span class="eyebrow">Solicitação ao desenvolvedor</span><h2 id="annotationTitle">O que você quer mudar?</h2></div><button type="button" data-note-action="close" aria-label="Fechar anotação">×</button></div><p class="muted">'+esc(draft.pageTitle)+'</p>'+(draft.image?'<img class="annotation-preview" src="'+draft.image+'" alt="Recorte da área selecionada, com marcação azul">':'<p>Recorte indisponível. A posição e o elemento selecionado serão enviados.</p>')+'<p class="annotation-target">'+esc(draft.element.split(' · ')[0].slice(0,100))+'</p><button type="button" class="link" data-note-action="reselect">Selecionar outra área</button><form id="annotationForm"><label>Tipo de pedido<select name="kind">'+['Melhoria','Problema','Alteração','Remoção'].map(k=>'<option '+(draft.kind===k?'selected':'')+'>'+k+'</option>').join('')+'</select></label><label>Descreva o que deseja alterar<textarea name="message" rows="4" maxlength="4000" required placeholder="Ex.: deixar este botão maior ou mudar o nome deste campo.">'+esc(draft.message)+'</textarea></label><p class="footnote">Confira o recorte antes de enviar. A solicitação e a imagem serão acessíveis apenas ao desenvolvedor.</p><p class="annotation-error" role="alert"></p><div class="annotation-account" aria-live="polite">Verificando acesso…</div><div class="form-foot"><button type="button" data-note-action="discard">Descartar</button><button class="primary" type="submit" disabled>Enviar solicitação</button></div></form>';
    if(!annotation.open)annotation.showModal();annotation.querySelector('textarea').focus();
    try{session=await api('/api/session');if(!annotation.querySelector('#annotationForm'))return;const account=annotation.querySelector('.annotation-account');if(session.signedIn){account.textContent='Enviando como '+session.email;annotation.querySelector('[type=submit]').disabled=false}else{account.innerHTML='<p>Entre para identificar sua solicitação. O rascunho será mantido neste navegador.</p><a class="button primary" href="'+esc(session.signInUrl)+'" target="_top" data-note-action="signin">Entrar para enviar</a>'}}
    catch{error('O envio precisa da plataforma online. Seu rascunho está preservado.');saveDraft()}
  }
  annotation.addEventListener('input',e=>{if(!draft||!e.target.closest('#annotationForm'))return;const f=new FormData(annotation.querySelector('form'));draft.kind=f.get('kind');draft.message=f.get('message');saveDraft()});
  annotation.addEventListener('click',e=>{const b=e.target.closest('[data-note-action]');if(!b)return;if(busy){e.preventDefault();return}const action=b.dataset.noteAction;
    if(action==='move'){annotation.querySelector('.annotation-instruction')?.classList.toggle('instruction-bottom');return}
    if(action==='close'){saveDraft();close()}
    if(action==='discard'){draft=null;clearDraft();close()}
    if(action==='reselect'){retained={message:draft.message,kind:draft.kind};draft=null;close();start()}
    if(action==='signin'){if(!saveDraft()){e.preventDefault();error('Não foi possível guardar o rascunho. Habilite o armazenamento do navegador antes de entrar.')}}
  });
  annotation.addEventListener('cancel',e=>{if(busy){e.preventDefault();return}saveDraft();stopSelection()});
  annotation.addEventListener('submit',async e=>{e.preventDefault();if(e.target.id!=='annotationForm'||busy)return;draft.message=annotation.querySelector('textarea').value.trim();draft.kind=annotation.querySelector('select').value;if(!draft.message){error('Descreva o que deseja alterar.');return}saveDraft();busy=true;const button=annotation.querySelector('[type=submit]');button.disabled=true;button.textContent='Enviando…';error('');
    try{const receipt=await api('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)});draft=null;clearDraft();annotation.innerHTML='<h2 id="annotationTitle">Solicitação enviada</h2><p>Seu pedido chegou à caixa do desenvolvedor.</p><p class="muted">Protocolo: '+esc(receipt.id.slice(0,8).toUpperCase())+'</p><div class="form-foot"><button class="primary" type="button" data-note-action="close">Concluir</button></div>';annotation.querySelector('button').focus()}
    catch(err){error(err.message);if(err.status===401){session=null;form()}else{button.disabled=false;button.textContent='Tentar novamente'}}finally{busy=false}
  });
  launcher.addEventListener('click',start);modalLauncher.addEventListener('click',start);
  try{const saved=JSON.parse(sessionStorage.getItem(DRAFT_KEY)||'null');if(saved?.id&&saved.selection&&saved.route)draft=saved}catch{}
  if(new URLSearchParams(location.search).get('anotar')==='1'&&draft){history.replaceState(null,'',draft.route);window.dispatchEvent(new HashChangeEvent('hashchange'));form()}
})();
