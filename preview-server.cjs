const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {Readable}=require('node:stream');
const {createLocalDB}=require('./scripts/local-db.cjs');
(async()=>{
 const source=fs.readFileSync(path.join(__dirname,'dist/server/index.js'),'utf8');
 const worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
 const DB=createLocalDB(path.join(__dirname,'.local-feedback.sqlite'));
 http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://127.0.0.1:4173');
  const safeReturn=v=>v?.startsWith('/')&&!v.startsWith('//')?v:'/';
  if(url.pathname==='/signin-with-chatgpt'){
   const to=encodeURIComponent(safeReturn(url.searchParams.get('return_to')));
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<h1>Simulação local de login</h1><p>Somente no computador de desenvolvimento.</p><p><a href="/__local/login?as=client&return_to='+to+'">Entrar como cliente de teste</a></p><p><a href="/__local/login?as=dev&return_to='+to+'">Entrar como desenvolvedor de teste</a></p>');return;
  }
  if(url.pathname==='/__local/login'){const role=url.searchParams.get('as')==='dev'?'dev':'client';res.writeHead(302,{'Set-Cookie':'h2o_local='+role+'; HttpOnly; SameSite=Lax; Path=/','Location':safeReturn(url.searchParams.get('return_to'))});res.end();return}
  if(url.pathname==='/signout-with-chatgpt'){res.writeHead(302,{'Set-Cookie':'h2o_local=; Max-Age=0; Path=/','Location':safeReturn(url.searchParams.get('return_to'))});res.end();return}
  const headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(v&&!k.startsWith('oai-'))headers.set(k,Array.isArray(v)?v.join(','):v);
  const role=/(?:^|;\s*)h2o_local=(dev|client)(?:;|$)/.exec(req.headers.cookie||'')?.[1];
  if(role){headers.set('oai-authenticated-user-id',role+'-local-test');headers.set('oai-authenticated-user-email',role==='dev'?'dev@example.test':'client@example.test')}
  const response=await worker.fetch(new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Readable.toWeb(req),duplex:'half'}:{})}),{DB,DEVELOPER_EMAILS:'dev@example.test'});
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){console.error(e);res.writeHead(500);res.end('Falha no preview local.')}}).listen(4173,'127.0.0.1',()=>console.log('http://127.0.0.1:4173 — API local e banco de teste'));
})();
