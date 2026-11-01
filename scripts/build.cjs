const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'h2ostras-erp.html');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.copyFileSync(source, path.join(root, 'dist', 'index.html'));
console.log('Build concluído: dist/index.html');
