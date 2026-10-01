// Servidor estático para previsualizar el sitio por HTTP, sin dependencias.
//
//   node scripts/servidor-local.mjs          (puerto 4321)
//   node scripts/servidor-local.mjs 8080     (otro puerto)
//
// Se comporta como un hosting estático común: sirve el archivo pedido, y si la ruta es una
// carpeta sirve su index.html. El sitio también se puede abrir con doble clic desde el disco;
// este servidor sirve para ver lo que realmente recibe un rastreador, con sus cabeceras y sus
// tipos de contenido.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUERTO = Number(process.argv[2]) || 4321;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const servidor = http.createServer((req, res) => {
  let ruta;
  try {
    ruta = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('400 URL mal formada');
  }

  // Resolver dentro de RAIZ y cortar cualquier intento de salir de la carpeta.
  const destino = path.resolve(RAIZ, '.' + ruta);
  if (destino !== RAIZ && !destino.startsWith(RAIZ + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('403 fuera de la raíz del sitio');
  }

  const candidatos = [destino, destino + '.html', path.join(destino, 'index.html')];
  for (const c of candidatos) {
    let st;
    try { st = fs.statSync(c); } catch { continue; }
    if (!st.isFile()) continue;
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(c)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'all',
    });
    console.log('200  ' + ruta);
    return res.end(fs.readFileSync(c));
  }

  console.log('404  ' + ruta);
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 no encontrado: ' + ruta);
});

servidor.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`El puerto ${PUERTO} ya está ocupado. Probá: node scripts/servidor-local.mjs 8080`);
    process.exit(1);
  }
  throw e;
});

servidor.listen(PUERTO, () => {
  console.log('Fuente Clara — sandbox');
  console.log('Sirviendo ' + RAIZ);
  console.log('Abrir en el navegador: http://localhost:' + PUERTO + '/');
  console.log('Cortar con Ctrl+C.');
});
