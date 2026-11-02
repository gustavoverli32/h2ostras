// ASSETS is embedded at build time. Private runtime configuration is never embedded.
export default { async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(path.startsWith('/api/'))return handleApi(request,env);
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  const key=path==='/'||path==='/index.html'?'index.html':path==='/desenvolvedor'||path==='/desenvolvedor/'?'developer.html':path.slice(1);
  const asset=ASSETS[key];if(!asset)return new Response('Not found',{status:404});
  return new Response(request.method==='HEAD'?null:asset.content,{headers:{'Content-Type':asset.type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'}});
}};
