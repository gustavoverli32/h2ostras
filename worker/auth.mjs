const SESSION_SECONDS = 43200;
const authHeaders = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const authJson = (data,status=200,extra={}) => Response.json(data,{status,headers:{...authHeaders,...extra}});
const hex = bytes => Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
export const digest = async value => hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
const cookieToken = request => /(?:^|;\s*)h2o_session=([a-f0-9]{64})(?:;|$)/.exec(request.headers.get('cookie')||'')?.[1];
const sessionCookie = (request,value,age) => 'h2o_session='+value+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+age+(new URL(request.url).protocol==='https:'?'; Secure':'');
export async function resolveAccess(request,env){
  const id=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email');
  const native=id&&email?{id,email:email.toLowerCase()}:null;
  const isDev=!!native&&String(env.DEVELOPER_EMAILS||'').split(',').some(e=>e.trim().toLowerCase()===native.email);
  let operator=null;const token=cookieToken(request);
  if(token&&env.DB&&env.APP_PASSWORD_HASH){
    const tokenHash=await digest(token);
    const row=await env.DB.prepare('SELECT token_hash FROM h2ostras_sessions WHERE token_hash=? AND expires_at>? AND password_tag=?').bind(tokenHash,Date.now(),await digest(env.APP_PASSWORD_HASH)).first();
    if(row)operator={id:'operation:'+row.token_hash,email:'Acesso H2Ostras'};
  }
  return {user:native||operator,isDev,appAccess:!!operator||isDev,nativeSignedIn:!!native};
}
async function passwordMatches(password,encoded){
  const [salt,expected]=String(encoded||'').split(':');
  if(!/^[a-f0-9]{32}$/.test(salt||'')||!/^[a-f0-9]{64}$/.test(expected||''))return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const actual=hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:Uint8Array.from(salt.match(/../g),s=>parseInt(s,16)),iterations:100000,hash:'SHA-256'},key,256));
  let difference=0;for(let i=0;i<expected.length;i++)difference|=actual.charCodeAt(i)^expected.charCodeAt(i);return difference===0;
}
export async function handleAuth(request,env){
  const path=new URL(request.url).pathname;
  if(request.method!=='POST')return authJson({error:'Método não permitido.'},405);
  if(request.headers.get('origin')!==new URL(request.url).origin)return authJson({error:'Origem não autorizada.'},403);
  if(!env.DB||!env.APP_PASSWORD_HASH)return authJson({error:'Acesso temporariamente indisponível. Tente novamente.'},503);
  if(path==='/api/logout'){
    const token=cookieToken(request);if(token)await env.DB.prepare('DELETE FROM h2ostras_sessions WHERE token_hash=?').bind(await digest(token)).run();
    const access=await resolveAccess(request,env);
    return authJson({redirect:access.isDev?'/signout-with-chatgpt?return_to=%2Flogin':'/login'},200,{'Set-Cookie':sessionCookie(request,'',0)});
  }
  if(!(request.headers.get('content-type')||'').startsWith('application/json'))return authJson({error:'Formulário inválido.'},415);
  const reader=request.body?.getReader();if(!reader)return authJson({error:'Digite a senha.'},400);
  let raw='',size=0;const decoder=new TextDecoder();
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();return authJson({error:'Formulário inválido.'},413)}raw+=decoder.decode(value,{stream:true})}raw+=decoder.decode();
  let password;try{password=JSON.parse(raw).password}catch{return authJson({error:'Formulário inválido.'},400)}
  if(typeof password!=='string'||password.length>256||!password)return authJson({error:'Digite a senha.'},400);
  const now=Date.now(),windowMs=900000;
  const bucket=await digest(env.APP_PASSWORD_HASH+'|'+(request.headers.get('cf-connecting-ip')||'unknown')+'|'+Math.floor(now/windowMs));
  const attempt=await env.DB.prepare('INSERT INTO h2ostras_login_attempts (bucket,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET attempts=attempts+1 RETURNING attempts').bind(bucket,now+windowMs).first();
  if(attempt.attempts>10)return authJson({error:'Muitas tentativas. Aguarde 15 minutos e tente novamente.'},429,{'Retry-After':'900'});
  if(!await passwordMatches(password,env.APP_PASSWORD_HASH))return authJson({error:'Senha incorreta. Tente novamente.'},401);
  await env.DB.prepare('DELETE FROM h2ostras_login_attempts WHERE bucket=? OR expires_at<?').bind(bucket,now).run();
  await env.DB.prepare('DELETE FROM h2ostras_sessions WHERE expires_at<?').bind(now).run();
  const previous=cookieToken(request);if(previous)await env.DB.prepare('DELETE FROM h2ostras_sessions WHERE token_hash=?').bind(await digest(previous)).run();
  const token=hex(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.prepare('INSERT INTO h2ostras_sessions (token_hash,expires_at,password_tag) VALUES (?,?,?)').bind(await digest(token),now+SESSION_SECONDS*1000,await digest(env.APP_PASSWORD_HASH)).run();
  return authJson({ok:true},200,{'Set-Cookie':sessionCookie(request,token,SESSION_SECONDS)});
}
