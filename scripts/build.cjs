const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'h2ostras-erp.html');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.copyFileSync(source, path.join(root, 'dist', 'index.html'));
const assets = {};
for (const [name, file, type] of [
  ['index.html','h2ostras-erp.html','text/html; charset=utf-8'],
  ['feedback.js','feedback.js','text/javascript; charset=utf-8'],
  ['feedback.css','feedback.css','text/css; charset=utf-8'],
  ['developer.html','developer.html','text/html; charset=utf-8'],
  ['developer.js','developer.js','text/javascript; charset=utf-8'],
  ['login.html','login.html','text/html; charset=utf-8'],
  ['login.css','login.css','text/css; charset=utf-8'],
  ['login.js','login.js','text/javascript; charset=utf-8'],
  ['vendor/html2canvas.min.js','node_modules/html2canvas/dist/html2canvas.min.js','text/javascript; charset=utf-8']
]) assets[name] = { type, content: fs.readFileSync(path.join(root, file), 'utf8') };
const moduleSource=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/^import .* from '\.\/[^']+';\r?\n/gm,'');
const worker = moduleSource('worker/auth.mjs')+'\n'+moduleSource('worker/api.mjs') + '\nconst ASSETS=' + JSON.stringify(assets) + ';\n' + moduleSource('worker/entry.mjs');
fs.mkdirSync(path.join(root,'dist/server'), { recursive:true });
fs.writeFileSync(path.join(root,'dist/server/index.js'), worker);
fs.mkdirSync(path.join(root,'dist/.openai'), { recursive:true });
const manifestPath = path.join(root,'.openai/hosting.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath,'utf8')) : { d1:'DB',r2:null };
delete manifest.static;manifest.d1='DB';manifest.r2=null;
fs.writeFileSync(path.join(root,'dist/.openai/hosting.json'), JSON.stringify(manifest,null,2));
console.log('Build concluído: HTML e Worker com API de anotações.');
