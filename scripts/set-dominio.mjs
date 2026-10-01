// Reemplaza el dominio base en todo el sitio: URLs canónicas, sitemap, robots.txt, llms.txt,
// JSON-LD y los generadores.
//
//   node scripts/set-dominio.mjs https://el-dominio-real.com
//
// Detecta el dominio actual leyendo la etiqueta canónica de index.html, así que no depende de
// ningún proveedor de hosting ni de ningún dominio conocido de antemano. Después de correrlo
// conviene regenerar las páginas:
//
//   node scripts/generar-variantes.mjs
//   node scripts/generar-institucionales.mjs
import fs from 'node:fs';
import path from 'node:path';

const MARCADOR = 'https://fuente-clara-sandbox.example.com';

const nuevo = (process.argv[2] || '').trim().replace(/\/+$/, '');
if (!/^https?:\/\/[a-z0-9.-]+(:\d+)?$/i.test(nuevo)) {
  console.error('Uso: node scripts/set-dominio.mjs https://el-dominio-real.com');
  console.error('(solo el origen: protocolo y dominio, sin ruta ni barra final)');
  process.exit(1);
}

// Dominio actual, tomado de la canónica de index.html.
const inicio = fs.readFileSync('index.html', 'utf8');
const m = inicio.match(/<link rel="canonical" href="(https?:\/\/[^/"]+)/);
if (!m) {
  console.error('No se encontró la etiqueta canónica en index.html; no se puede saber qué reemplazar.');
  process.exit(1);
}
const actual = m[1];

if (actual === nuevo) {
  console.log('El sitio ya apunta a ' + nuevo + '. Sin cambios.');
  process.exit(0);
}

const EXT = new Set(['.html', '.txt', '.xml', '.mjs', '.json', '.md']);
const IGNORAR = new Set(['.git', 'node_modules']);

let tocados = 0;
const recorrer = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORAR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { recorrer(p); continue; }
    if (!EXT.has(path.extname(e.name))) continue;
    const antes = fs.readFileSync(p, 'utf8');
    if (!antes.includes(actual)) continue;
    fs.writeFileSync(p, antes.split(actual).join(nuevo));
    tocados++;
    console.log('actualizado ' + path.relative('.', p));
  }
};

recorrer('.');

console.log('\n' + tocados + ' archivo(s) actualizado(s): ' + actual + '  ->  ' + nuevo);
if (actual === MARCADOR) {
  console.log('El dominio marcador quedó reemplazado por uno real.');
}
console.log('Recordá regenerar las páginas:');
console.log('  node scripts/generar-variantes.mjs');
console.log('  node scripts/generar-institucionales.mjs');
