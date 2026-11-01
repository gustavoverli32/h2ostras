const http = require('node:http');
const fs = require('node:fs');
const html = require('node:path').join(__dirname, 'h2ostras-erp.html');
http.createServer((req,res) => {
  if (req.url === '/favicon.ico') { res.writeHead(204); return res.end(); }
  res.writeHead(200, {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
  fs.createReadStream(html).pipe(res);
}).listen(4173,'127.0.0.1',()=>console.log('http://127.0.0.1:4173'));
