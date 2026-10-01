// Genera assets/precio-plan-hogar.png: captura simulada de una tabla de precios.
// El precio queda SOLO como pixeles (sin capa de texto), que es el punto del experimento.
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const FONT = {
  '0':'01110,10001,10011,10101,11001,10001,01110','1':'00100,01100,00100,00100,00100,00100,01110',
  '2':'01110,10001,00001,00010,00100,01000,11111','3':'11111,00010,00100,00010,00001,10001,01110',
  '4':'00010,00110,01010,10010,11111,00010,00010','5':'11111,10000,11110,00001,00001,10001,01110',
  '6':'00110,01000,10000,11110,10001,10001,01110','7':'11111,00001,00010,00100,01000,01000,01000',
  '8':'01110,10001,10001,01110,10001,10001,01110','9':'01110,10001,10001,01111,00001,00010,01100',
  'A':'01110,10001,10001,11111,10001,10001,10001','B':'11110,10001,10001,11110,10001,10001,11110',
  'C':'01110,10001,10000,10000,10000,10001,01110','D':'11100,10010,10001,10001,10001,10010,11100',
  'E':'11111,10000,10000,11110,10000,10000,11111','F':'11111,10000,10000,11110,10000,10000,10000',
  'G':'01110,10001,10000,10111,10001,10001,01111','H':'10001,10001,10001,11111,10001,10001,10001',
  'I':'01110,00100,00100,00100,00100,00100,01110','J':'00111,00010,00010,00010,00010,10010,01100',
  'K':'10001,10010,10100,11000,10100,10010,10001','L':'10000,10000,10000,10000,10000,10000,11111',
  'M':'10001,11011,10101,10101,10001,10001,10001','N':'10001,11001,10101,10011,10001,10001,10001',
  'O':'01110,10001,10001,10001,10001,10001,01110','P':'11110,10001,10001,11110,10000,10000,10000',
  'Q':'01110,10001,10001,10001,10101,10010,01101','R':'11110,10001,10001,11110,10100,10010,10001',
  'S':'01111,10000,10000,01110,00001,00001,11110','T':'11111,00100,00100,00100,00100,00100,00100',
  'U':'10001,10001,10001,10001,10001,10001,01110','V':'10001,10001,10001,10001,10001,01010,00100',
  'W':'10001,10001,10001,10101,10101,11011,10001','X':'10001,10001,01010,00100,01010,10001,10001',
  'Y':'10001,10001,01010,00100,00100,00100,00100','Z':'11111,00001,00010,00100,01000,10000,11111',
  '$':'00100,01111,10100,01110,00101,11110,00100','.':'00000,00000,00000,00000,00000,01100,01100',
  ',':'00000,00000,00000,00000,01100,01100,11000','/':'00001,00010,00010,00100,01000,01000,10000',
  '-':'00000,00000,00000,11111,00000,00000,00000',':':'00000,01100,01100,00000,01100,01100,00000',
  '(':'00010,00100,01000,01000,01000,00100,00010',')':'01000,00100,00010,00010,00010,00100,01000',
  '%':'11001,11010,00010,00100,01000,01011,10011','+':'00000,00100,00100,11111,00100,00100,00000',
  ' ':'00000,00000,00000,00000,00000,00000,00000',
};
const glyph = (ch) => FONT[ch] ?? FONT[' '];

const W = 960, H = 540;
const buf = Buffer.alloc(W * H * 3, 0xff);
const px = (x, y, [r, g, b]) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = r; buf[i + 1] = g; buf[i + 2] = b;
};
const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c); };
const textW = (s, sc) => sc * (6 * s.length - 1);
const text = (str, x, y, sc, c) => {
  let cx = x;
  for (const raw of str.toUpperCase()) {
    const rows = glyph(raw).split(',');
    for (let ry = 0; ry < 7; ry++) for (let rx = 0; rx < 5; rx++)
      if (rows[ry][rx] === '1') rect(cx + rx * sc, y + ry * sc, sc, sc, c);
    cx += 6 * sc;
  }
};

const AZUL = [16, 73, 107], GRIS_H = [232, 238, 242], BORDE = [197, 208, 216];
const TINTA = [26, 32, 38], SUAVE = [108, 122, 134], ACENTO = [12, 110, 90];

rect(0, 0, W, 104, AZUL);
text('FUENTE CLARA', 48, 24, 4, [255, 255, 255]);
text('LISTA DE PRECIOS VIGENTE', 48, 66, 2, [186, 208, 224]);
const marca = 'SANDBOX - MARCA FICTICIA';
text(marca, W - 48 - textW(marca, 2), 66, 2, [140, 172, 198]);

// Marco de la tabla
rect(48, 152, W - 96, 2, BORDE);
rect(48, 152, 2, 200, BORDE);
rect(W - 50, 152, 2, 200, BORDE);
rect(48, 350, W - 96, 2, BORDE);
rect(50, 154, W - 100, 54, GRIS_H);
rect(48, 208, W - 96, 2, BORDE);

text('PLAN', 72, 172, 2, SUAVE);
text('ENTREGA MENSUAL', 300, 172, 2, SUAVE);
text('PRECIO', 640, 172, 2, SUAVE);

text('HOGAR', 72, 246, 3, TINTA);
text('2 BIDONES DE 20 L', 300, 240, 2, TINTA);
text('RETIRO SIN CARGO', 300, 276, 2, SUAVE);

text('$12.900', 640, 236, 5, ACENTO);
text('/ MES', 640, 300, 2, SUAVE);

text('PRECIOS EN PESOS - IVA INCLUIDO', 48, 392, 2, SUAVE);
text('CAPTURA DE REFERENCIA - CONTENIDO DE PRUEBA', 48, 424, 2, SUAVE);
rect(48, 468, 260, 4, AZUL);
text('FUENTECLARA - SANDBOX', 48, 488, 2, [150, 162, 172]);

// --- PNG ---
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 3 + 1)] = 0;
  buf.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
}
const TBL = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return t;
})();
const crc32 = (b) => { let c = 0xffffffff; for (const v of b) c = TBL[(c ^ v) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);
const out = process.argv[2];
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png);
console.log('OK', out, png.length, 'bytes', W + 'x' + H);
