(() => {
  const form=document.querySelector('#loginForm'),password=document.querySelector('#password'),error=document.querySelector('#loginError'),button=form.querySelector('[type=submit]'),toggle=document.querySelector('#showPassword');
  toggle.addEventListener('click',()=>{const show=password.type==='password';password.type=show?'text':'password';toggle.setAttribute('aria-pressed',String(show));toggle.setAttribute('aria-label',show?'Ocultar senha':'Mostrar senha');password.focus()});
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(button.disabled)return;error.textContent='';button.disabled=true;button.textContent='Entrando…';
    try{const response=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({password:password.value}),signal:AbortSignal.timeout(15000)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Não foi possível entrar.');password.value='';let resume='';try{if(sessionStorage.getItem('h2ostras.annotation.draft'))resume='?anotar=1'}catch{}location.replace('/'+resume+(location.hash||'#atendimento'))}
    catch(err){error.textContent=err.name==='TimeoutError'?'A conexão demorou. Tente novamente.':err.message;button.disabled=false;button.textContent='Entrar';password.focus()}
  });
})();
