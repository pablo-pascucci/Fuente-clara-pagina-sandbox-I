// Chequeos del sitio. No modifica nada: solo informa.
//
//   node scripts/verificar.mjs
//
// Qué verifica:
//   1. Que cada .html y su .md digan exactamente lo mismo (es el punto de la fuente única).
//   2. Que cada mecanismo de descubrimiento declarado esté presente, y que los no declarados
//      NO estén — es lo que hace válido al experimento de exp-md-dual.
//   3. Que ninguna URL .md esté en el sitemap.xml.
//   4. Que cada página HTML tenga una canónica que apunte a sí misma.
//   5. Que no haya ningún <script> ejecutable en el sitio.
//   6. Que todos los enlaces y recursos relativos resuelvan contra el disco.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(RAIZ, 'contenido');
const sitio = JSON.parse(fs.readFileSync(path.join(DIR, '_sitio.json'), 'utf8'));

let fallos = 0;
const ok = (m) => console.log('  ok    ' + m);
const mal = (m) => { fallos++; console.log('  FALLA ' + m); };

// Páginas declaradas en contenido/ (los archivos con guion bajo son fragmentos, no páginas).
const paginas = [];
const recorrer = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { recorrer(p); continue; }
    if (!e.name.endsWith('.json') || e.name.startsWith('_')) continue;
    paginas.push(JSON.parse(fs.readFileSync(p, 'utf8')));
  }
};
recorrer(DIR);

const archivoDe = (pg) => (pg.ruta === '' ? 'index' : pg.ruta);

// --- 1. HTML y Markdown dicen lo mismo --------------------------------------------------------
// El nodo `marcador` es la única diferencia permitida: dice "versión HTML" o "versión Markdown"
// a propósito, para poder saber cuál de los dos archivos leyó una herramienta.
console.log('\nHTML vs Markdown');
// Quitar las etiquetas deja un espacio donde estaba cada una, así que un enlace seguido de coma
// queda como "texto , coma". Se normaliza el espacio previo a la puntuación en ambos lados.
const norm = (s) => s.replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
const sinMarcador = (s) => s.replace(/Código de referencia: \S+ · versión \w+/g, '');

for (const pg of paginas.filter((p) => p.md)) {
  const base = path.join(RAIZ, archivoDe(pg));
  const html = fs.readFileSync(base + '.html', 'utf8');
  const md = fs.readFileSync(base + '.md', 'utf8');

  const th = norm(sinMarcador(
    html.match(/<main>([\s\S]*?)<\/main>/)[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  ));
  const tm = norm(sinMarcador(
    md.replace(/^#{1,6} /gm, '').replace(/^- /gm, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  ));

  if (th === tm) ok(`${archivoDe(pg)}  (${th.length} caracteres)`);
  else {
    const i = [...th].findIndex((c, j) => c !== tm[j]);
    mal(`${archivoDe(pg)} difiere en la posición ${i}`);
    console.log('        html: …' + th.slice(Math.max(0, i - 50), i + 50));
    console.log('        md  : …' + tm.slice(Math.max(0, i - 50), i + 50));
  }
}

// --- 2. Mecanismos de descubrimiento ----------------------------------------------------------
console.log('\nMecanismos de descubrimiento del .md');
const llms = fs.readFileSync(path.join(RAIZ, 'llms.txt'), 'utf8');

for (const pg of paginas.filter((p) => p.md)) {
  const html = fs.readFileSync(path.join(RAIZ, archivoDe(pg) + '.html'), 'utf8');
  const d = pg.descubrimiento ?? {};
  const real = {
    llmstxt: llms.includes('/' + archivoDe(pg) + '.md'),
    linkAlternate: /rel="alternate"[^>]*type="text\/markdown"/.test(html),
    linkVisible: html.includes('class="ver-md"'),
  };
  const malos = Object.keys(real).filter((k) => real[k] !== Boolean(d[k]));
  const activos = Object.keys(real).filter((k) => real[k]);
  if (malos.length === 0) ok(`${archivoDe(pg)}  [${activos.join(', ') || 'ninguno'}]`);
  else for (const k of malos) {
    mal(`${archivoDe(pg)}: ${k} declarado ${Boolean(d[k])} pero en los archivos está ${real[k]}`);
  }
}

// --- 3. Sitemap sin .md -----------------------------------------------------------------------
console.log('\nSitemap');
const sitemap = fs.readFileSync(path.join(RAIZ, 'sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
const mds = locs.filter((l) => l.endsWith('.md'));
mds.length === 0 ? ok(`${locs.length} URLs, ninguna .md`) : mal(`hay ${mds.length} URLs .md: ${mds.join(', ')}`);

// --- 4, 5, 6. Canónicas, scripts y referencias ------------------------------------------------
console.log('\nPáginas HTML del sitio');
const htmls = [];
const buscarHtml = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (['contenido', 'scripts', '.git', 'node_modules', 'assets'].includes(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) { buscarHtml(p); continue; }
    if (e.name.endsWith('.html')) htmls.push(p);
  }
};
buscarHtml(RAIZ);

let sinCanonica = 0, conScript = 0, refsOk = 0, refsMal = 0;
for (const p of htmls) {
  const html = fs.readFileSync(p, 'utf8');
  const rel = path.relative(RAIZ, p).replace(/\\/g, '/');

  const can = html.match(/<link rel="canonical" href="([^"]+)"/);
  const esperada = sitio.dominio + '/' + (rel === 'index.html' ? '' : rel.replace(/(^|\/)index\.html$/, '$1'));
  if (!can) { mal(`${rel}: sin etiqueta canónica`); sinCanonica++; }
  else if (can[1] !== esperada) { mal(`${rel}: canónica ${can[1]}, esperada ${esperada}`); sinCanonica++; }

  for (const s of html.matchAll(/<script([^>]*)>/g)) {
    if (!/type="application\/ld\+json"/.test(s[1])) { mal(`${rel}: <script> ejecutable`); conScript++; }
  }

  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|#|data:)/.test(m[1])) continue;
    fs.existsSync(path.resolve(path.dirname(p), m[1].split('#')[0]))
      ? refsOk++
      : (refsMal++, mal(`${rel} -> ${m[1]} no existe`));
  }
}
if (!sinCanonica) ok(`${htmls.length} páginas, todas con canónica propia`);
if (!conScript) ok('ningún <script> ejecutable (solo bloques ld+json)');
if (!refsMal) ok(`${refsOk} referencias relativas resueltas`);

console.log('\n' + (fallos === 0 ? 'Todo en orden.' : fallos + ' problema(s).'));
process.exit(fallos === 0 ? 0 : 1);
