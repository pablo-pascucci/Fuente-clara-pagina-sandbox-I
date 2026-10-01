// Generador del sitio: una única fuente de contenido -> HTML + Markdown + llms.txt
//
//   node scripts/generar-sitio.mjs
//
// Lee `contenido/_sitio.json` (configuración global) y un archivo JSON por página dentro de
// `contenido/`. De cada página emite su `.html` y, si declara `md: true`, su `.md`. Al final
// reescribe `llms.txt` con las páginas que declaran `descubrimiento.llmstxt`.
//
// El texto se escribe UNA sola vez, en el archivo de contenido. Nunca se editan los .html ni
// los .md: son salidas y se pisan en cada corrida.
//
// Los archivos que empiezan con guion bajo no son páginas (son fragmentos compartidos, como
// `exp-md-dual/_base.json`, que varias páginas referencian con `cuerpoDe`).
//
// Mecanismos de descubrimiento del .md, independientes entre sí — es lo que mide exp-md-dual:
//   descubrimiento.llmstxt       -> la página aparece listada en /llms.txt
//   descubrimiento.linkAlternate -> <link rel="alternate" type="text/markdown"> en el <head>
//   descubrimiento.linkVisible   -> enlace visible en el pie de la página
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(RAIZ, 'contenido');

const sitio = JSON.parse(fs.readFileSync(path.join(DIR, '_sitio.json'), 'utf8'));

// --- Carga de páginas y fragmentos ------------------------------------------------------------

const archivos = [];
const recorrer = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { recorrer(p); continue; }
    if (!e.name.endsWith('.json')) continue;
    archivos.push(p);
  }
};
recorrer(DIR);

const fragmentos = new Map();
const paginas = [];
for (const p of archivos) {
  const rel = path.relative(DIR, p).replace(/\\/g, '/').replace(/\.json$/, '');
  const doc = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (path.basename(p).startsWith('_')) { fragmentos.set(rel, doc); continue; }
  doc._origen = rel;
  paginas.push(doc);
}

// Un cuerpo puede venir de un fragmento compartido más nodos propios al final.
for (const pg of paginas) {
  let cuerpo = pg.cuerpo ?? [];
  if (pg.cuerpoDe) {
    const frag = fragmentos.get(pg.cuerpoDe);
    if (!frag) throw new Error(`${pg._origen}: no existe el fragmento "${pg.cuerpoDe}"`);
    cuerpo = [...frag.cuerpo, ...cuerpo];
  }
  pg.cuerpo = [...cuerpo, ...(pg.cuerpoExtra ?? [])];
}

// --- Rutas ------------------------------------------------------------------------------------

// `ruta` es la ruta del sitio sin extensión: "" para la home, "quienes-somos",
// "exp-md-dual/solo-llmstxt". De ahí salen los nombres de archivo y la URL canónica.
const nombreArchivo = (pg) => (pg.ruta === '' ? 'index' : pg.ruta);
const salidaHtml = (pg) => path.join(RAIZ, nombreArchivo(pg) + '.html');
const salidaMd = (pg) => path.join(RAIZ, nombreArchivo(pg) + '.md');
const urlCanonica = (pg) => sitio.dominio + '/' + (pg.ruta === '' ? '' : pg.ruta + '.html');
const urlMd = (pg) => sitio.dominio + '/' + nombreArchivo(pg) + '.md';

// Profundidad de la página -> prefijo relativo. Todo enlace interno va relativo para que el
// sitio también se pueda abrir desde el disco, sin servidor.
const prefijo = (pg) => '../'.repeat(nombreArchivo(pg).split('/').length - 1);
const rel = (pg, destino) => prefijo(pg) + destino;
const relMd = (pg) => path.basename(nombreArchivo(pg)) + '.md';

// --- Renderizado ------------------------------------------------------------------------------

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');

const nodoHtml = (n, pg) => {
  if (n.h2) return `  <h2>${esc(n.h2)}</h2>`;
  if (n.h3) return `  <h3>${esc(n.h3)}</h3>`;
  if (n.p) return `  <p>${esc(n.p)}</p>`;
  if (n.ul) return '  <ul>\n' + n.ul.map((i) => `    <li>${esc(i)}</li>`).join('\n') + '\n  </ul>';
  if (n.pLinks) {
    const partes = n.pLinks.map((t) => (typeof t === 'string'
      ? esc(t)
      : `<a href="${escAttr(rel(pg, t.destino))}">${esc(t.texto)}</a>`));
    return `  <p>${partes.join('')}</p>`;
  }
  if (n.tarjetas) {
    return '  <ul class="tarjetas">\n' + n.tarjetas.map((t) =>
      `    <li>\n      <a href="${escAttr(rel(pg, t.destino))}">${esc(t.titulo)}</a>\n`
      + `      <span>${esc(t.texto)}</span>\n    </li>`).join('\n') + '\n  </ul>';
  }
  if (n.marcador) {
    return `  <p class="trazador">Código de referencia: ${esc(n.marcador)} · versión HTML</p>`;
  }
  if (n.aviso) {
    return '  <div class="nota-experimento">\n    <h2>Aviso</h2>\n'
      + n.aviso.map((p) => `    <p>${esc(p)}</p>`).join('\n') + '\n  </div>';
  }
  throw new Error('nodo desconocido: ' + JSON.stringify(n));
};

const nodoMd = (n, pg) => {
  if (n.h2) return `## ${n.h2}`;
  if (n.h3) return `### ${n.h3}`;
  if (n.p) return n.p;
  if (n.ul) return n.ul.map((i) => `- ${i}`).join('\n');
  if (n.pLinks) {
    return n.pLinks.map((t) => (typeof t === 'string' ? t : `[${t.texto}](${rel(pg, t.destino)})`)).join('');
  }
  if (n.tarjetas) {
    return n.tarjetas.map((t) => `- [${t.titulo}](${rel(pg, t.destino)})\n  ${t.texto}`).join('\n');
  }
  if (n.marcador) return `Código de referencia: ${n.marcador} · versión Markdown`;
  if (n.aviso) return '## Aviso\n\n' + n.aviso.join('\n\n');
  throw new Error('nodo desconocido: ' + JSON.stringify(n));
};

const paginaHtml = (pg) => {
  const nav = sitio.navs[pg.nav ?? 'institucional'];
  if (!nav) throw new Error(`${pg._origen}: no existe la navegación "${pg.nav}"`);
  const d = pg.descubrimiento ?? {};

  const alternate = pg.md && d.linkAlternate
    ? `\n<link rel="alternate" type="text/markdown" href="${escAttr(relMd(pg))}" title="Versión Markdown">`
    : '';

  const linkVisible = pg.md && d.linkVisible
    ? `\n    <p class="ver-md"><a href="${escAttr(relMd(pg))}">${esc(sitio.textoLinkMd)}</a></p>`
    : '';

  return `<!DOCTYPE html>
<html lang="${sitio.idioma}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pg.tituloHtml)}</title>
<meta name="description" content="${escAttr(pg.descripcion)}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<link rel="canonical" href="${escAttr(urlCanonica(pg))}">${alternate}
<link rel="stylesheet" href="${escAttr(rel(pg, 'assets/estilo.css'))}">
</head>
<body>

<header class="sitio">
  <div class="contenedor">
    <a href="${escAttr(rel(pg, 'index.html'))}"><span class="marca">${esc(sitio.marca)}</span></a>
    <div class="bajada">${esc(sitio.bajada)}</div>
  </div>
</header>

<nav class="principal">
  <div class="contenedor">
${nav.map((i) => `    <a href="${escAttr(rel(pg, i.destino))}">${esc(i.texto)}</a>`).join('\n')}
  </div>
</nav>

<main>
<div class="contenedor">

  <h1>${esc(pg.titulo)}</h1>

${pg.cuerpo.map((n) => nodoHtml(n, pg)).join('\n\n')}

</div>
</main>

<footer class="sitio">
  <div class="contenedor">
${sitio.footer.map((p) => `    <p>${esc(p)}</p>`).join('\n')}${linkVisible}
  </div>
</footer>

</body>
</html>
`;
};

const paginaMd = (pg) => `# ${pg.titulo}\n\n${pg.cuerpo.map((n) => nodoMd(n, pg)).join('\n\n')}\n`;

// --- llms.txt ---------------------------------------------------------------------------------

const generarLlms = () => {
  const l = sitio.llmstxt;
  const partes = [`# ${l.titulo}`, '', `> ${l.resumen}`, ''];
  for (const p of l.prosa) partes.push(p, '');

  for (const seccion of l.secciones) {
    const entradas = paginas
      .filter((pg) => pg.md && pg.descubrimiento?.llmstxt && pg.llmstxt?.seccion === seccion)
      .sort((a, b) => (a.llmstxt.orden ?? 0) - (b.llmstxt.orden ?? 0));
    if (!entradas.length) continue;
    partes.push(`## ${seccion}`, '');
    for (const pg of entradas) {
      partes.push(`- [${pg.llmstxt.etiqueta ?? pg.titulo}](${urlMd(pg)}): ${pg.llmstxt.nota}`);
    }
    partes.push('');
  }
  return partes.join('\n').replace(/\n+$/, '\n');
};

// --- Escritura --------------------------------------------------------------------------------

// Una página declarada en llms.txt sin su bloque de metadatos sería una entrada rota.
for (const pg of paginas) {
  if (pg.descubrimiento?.llmstxt && !pg.llmstxt) {
    throw new Error(`${pg._origen}: declara descubrimiento.llmstxt pero no tiene bloque "llmstxt"`);
  }
  if (pg.descubrimiento?.llmstxt && !sitio.llmstxt.secciones.includes(pg.llmstxt.seccion)) {
    throw new Error(`${pg._origen}: la sección "${pg.llmstxt.seccion}" no está en _sitio.json`);
  }
  if (!pg.md && Object.values(pg.descubrimiento ?? {}).some(Boolean)) {
    throw new Error(`${pg._origen}: declara un mecanismo de descubrimiento pero no genera .md`);
  }
}

for (const pg of paginas) {
  const destinoHtml = salidaHtml(pg);
  fs.mkdirSync(path.dirname(destinoHtml), { recursive: true });
  fs.writeFileSync(destinoHtml, paginaHtml(pg));
  let linea = '  ' + path.relative(RAIZ, destinoHtml).replace(/\\/g, '/');
  if (pg.md) {
    fs.writeFileSync(salidaMd(pg), paginaMd(pg));
    linea += '  +  ' + path.relative(RAIZ, salidaMd(pg)).replace(/\\/g, '/');
  }
  const d = pg.descubrimiento ?? {};
  const vias = ['llmstxt', 'linkAlternate', 'linkVisible'].filter((k) => d[k]);
  console.log(linea + (pg.md ? '   [' + (vias.join(', ') || 'sin vía de descubrimiento') + ']' : ''));
}

fs.writeFileSync(path.join(RAIZ, 'llms.txt'), generarLlms());
console.log('  llms.txt');
console.log('\n' + paginas.length + ' páginas generadas.');
