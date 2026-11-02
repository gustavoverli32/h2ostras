const STATES = ['Recebido', 'Em andamento', 'Concluído'];
const KINDS = ['Melhoria', 'Problema', 'Alteração', 'Remoção'];
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' };
const json = (body, status = 200) => Response.json(body, { status, headers });
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
function identity(request) {
  const id = request.headers.get('oai-authenticated-user-id');
  const email = request.headers.get('oai-authenticated-user-email');
  return id && email ? { id, email: email.toLowerCase() } : null;
}
function developer(user, env) {
  return !!user && String(env.DEVELOPER_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean).includes(user.email);
}
function text(value, name, max, required = true) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail('Campo inválido: ' + name);
  return value.trim();
}
async function body(request) {
  if (!(request.headers.get('content-type') || '').startsWith('application/json')) fail('Envie um formulário válido.', 415);
  const reader = request.body?.getReader();
  if (!reader) fail('Formulário vazio.');
  let size = 0, parts = [];
  while (true) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > 700000) { await reader.cancel(); fail('A imagem está muito grande.', 413); } parts.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  try { const result = JSON.parse(new TextDecoder().decode(bytes)); if (!result || Array.isArray(result) || typeof result !== 'object') fail('Formulário inválido.'); return result; } catch { fail('Formulário inválido.'); }
}
function selection(value) {
  if (!value || typeof value !== 'object') fail('Selecione uma área da tela.');
  const out = {};
  for (const key of ['x', 'y', 'width', 'height', 'viewportWidth', 'viewportHeight', 'scrollX', 'scrollY']) {
    if (!Number.isFinite(value[key]) || value[key] < 0 || value[key] > 1000000) fail('Marcação inválida.');
    out[key] = Math.round(value[key]);
  }
  if (out.width < 4 || out.height < 4 || out.viewportWidth > 10000 || out.viewportHeight > 10000 || out.x + out.width > out.viewportWidth + 2 || out.y + out.height > out.viewportHeight + 2) fail('Marcação fora da tela.');
  return JSON.stringify(out);
}
export async function handleApi(request, env) {
  const url = new URL(request.url), path = url.pathname, user = identity(request);
  const isDev = developer(user, env);
  if (path === '/api/session' && request.method === 'GET') return json({ signedIn: !!user, isDeveloper: isDev, email: user?.email || null, signInUrl: '/signin-with-chatgpt?return_to=' + encodeURIComponent('/?anotar=1'), devSignInUrl: '/signin-with-chatgpt?return_to=' + encodeURIComponent('/desenvolvedor') });
  try {
    if (!user) fail('Entre com sua conta para continuar.', 401);
    if (path.startsWith('/api/dev/') && !isDev) fail('Esta área é exclusiva do desenvolvedor.', 403);
    if (request.method !== 'GET') {
      if (request.headers.get('origin') !== url.origin) fail('Origem não autorizada.', 403);
    }
    if (!env.DB) fail('O serviço de anotações está temporariamente indisponível.', 503);
    if (path === '/api/feedback' && request.method === 'POST') {
      const f = await body(request);
      if (!UUID.test(f.id || '')) fail('Identificador inválido.');
      const existing = await env.DB.prepare('SELECT id, author_id FROM h2ostras_feedback WHERE id = ?').bind(f.id).first();
      if (existing) { if (existing.author_id !== user.id) fail('Identificador já utilizado.', 409); return json({ id: existing.id, status: 'Recebido' }); }
      const kind = text(f.kind, 'tipo', 30), message = text(f.message, 'descrição', 4000);
      if (!KINDS.includes(kind)) fail('Tipo de solicitação inválido.');
      const route = text(f.route, 'página', 500); if (!route.startsWith('/#') || /[<>\r\n]/.test(route)) fail('Página inválida.');
      const pageTitle = text(f.pageTitle, 'título', 180), element = text(f.element, 'elemento', 600, false), area = selection(f.selection);
      const image = f.image == null ? null : text(f.image, 'imagem', 600000);
      if (image && (!/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/=]+$/.test(image) || image.length > 600000)) fail('Recorte de imagem inválido.');
      const now = new Date().toISOString(), since = new Date(Date.now() - 86400000).toISOString();
      const result = await env.DB.prepare(`INSERT INTO h2ostras_feedback (id,author_id,author_email,kind,message,route,page_title,element,selection,image,status,created_at,updated_at)
        SELECT ?,?,?,?,?,?,?,?,?,?,'Recebido',?,? WHERE (SELECT COUNT(*) FROM h2ostras_feedback WHERE author_id=? AND created_at>=?)<20`).bind(f.id,user.id,user.email,kind,message,route,pageTitle,element,area,image,now,now,user.id,since).run();
      if (!result.meta.changes) fail('Limite de 20 solicitações por dia atingido. Tente novamente amanhã.', 429);
      return json({ id: f.id, status: 'Recebido' }, 201);
    }
    if (path === '/api/dev/feedback' && request.method === 'GET') {
      const status = url.searchParams.get('status') || '', page = Number(url.searchParams.get('page') || 0);
      if ((status && !STATES.includes(status)) || !Number.isInteger(page) || page < 0 || page > 10000) fail('Filtro inválido.');
      const cols = 'id,author_email,kind,message,route,page_title,element,selection,status,created_at,updated_at,CASE WHEN image IS NULL THEN 0 ELSE 1 END AS has_image';
      const q = status ? env.DB.prepare(`SELECT ${cols} FROM h2ostras_feedback WHERE status=? ORDER BY created_at DESC,id DESC LIMIT 31 OFFSET ?`).bind(status,page*30) : env.DB.prepare(`SELECT ${cols} FROM h2ostras_feedback ORDER BY created_at DESC,id DESC LIMIT 31 OFFSET ?`).bind(page*30);
      const { results } = await q.all();
      return json({ items: results.slice(0,30), hasMore: results.length > 30 });
    }
    const match = path.match(/^\/api\/dev\/feedback\/([a-f0-9-]+)(\/image)?$/i);
    if (match && UUID.test(match[1])) {
      if (match[2] && request.method === 'GET') {
        const row = await env.DB.prepare('SELECT image FROM h2ostras_feedback WHERE id=?').bind(match[1]).first();
        if (!row?.image) fail('Recorte não encontrado.', 404);
        return new Response(Uint8Array.from(atob(row.image.split(',')[1]), c => c.charCodeAt(0)), { headers: { ...headers, 'Content-Type': 'image/jpeg', 'Content-Disposition': 'inline; filename="anotacao.jpg"' } });
      }
      if (!match[2] && request.method === 'PATCH') {
        const f = await body(request); if (!STATES.includes(f.status)) fail('Situação inválida.');
        const previous = text(f.updatedAt, 'versão', 50), now = new Date().toISOString();
        const result = await env.DB.prepare('UPDATE h2ostras_feedback SET status=?,updated_at=? WHERE id=? AND updated_at=?').bind(f.status,now,match[1],previous).run();
        if (!result.meta.changes) fail('A solicitação foi atualizada em outra sessão. Recarregue a lista.', 409);
        return json({ status: f.status, updatedAt: now });
      }
    }
    return json({ error: 'Página não encontrada.' }, 404);
  } catch (error) { if (!error.status) console.error('Feedback request failed:', error.message); return json({ error: error.status ? error.message : 'Não foi possível concluir. Tente novamente.' }, error.status || 500); }
}
