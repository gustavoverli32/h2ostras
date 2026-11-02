import { resolveAccess, handleAuth } from './auth.mjs';
import { handleApi } from './api.mjs';
// ASSETS is embedded at build time. Private runtime configuration is never embedded.
export default { async fetch(request,env){try{
  const path=new URL(request.url).pathname;
  if(path==='/api/login'||path==='/api/logout')return await handleAuth(request,env);
  if(path.startsWith('/api/'))return await handleApi(request,env);
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  const key=path==='/'||path==='/index.html'?'index.html':path==='/login'||path==='/login/'?'login.html':path==='/desenvolvedor'||path==='/desenvolvedor/'?'developer.html':path.slice(1);
  const publicAssets=['login.html','login.css','login.js','developer.html','developer.js','mobile.css','mobile.js'];
  if(!publicAssets.includes(key)&&!(await resolveAccess(request,env)).appAccess)return new Response(null,{status:303,headers:{Location:'/login','Cache-Control':'no-store'}});
  const asset=Object.hasOwn(ASSETS,key)?ASSETS[key]:null;if(!asset)return new Response('Not found',{status:404});
  return new Response(request.method==='HEAD'?null:asset.content,{headers:{'Content-Type':asset.type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'}});
}catch{
  return Response.json({error:'Serviço temporariamente indisponível. Tente novamente.'},{status:503,headers:{'Cache-Control':'no-store'}});
}}};
