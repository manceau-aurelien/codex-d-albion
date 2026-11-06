/**
 * Génère les icônes de l'appli (PNG) sans dépendance : fond sombre, anneau et étoile ambrés.
 * Usage : node scripts/make-icons.mjs
 */
import fs from 'node:fs';
import zlib from 'node:zlib';

const BG = [12, 10, 9];
const AMBER = [251, 191, 36];

function crc32(buf) {
  let c, crc = ~0;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return ~crc >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x / size, y / size);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))
  ]);
}

// scale : part de l'icône occupée par le motif (zone de sécurité plus petite pour « maskable »)
function makePixel(scale) {
  const sample = (u, v) => {
    const x = (u - 0.5) / scale, y = (v - 0.5) / scale;
    const d = Math.hypot(x, y);
    const ring = d > 0.40 && d < 0.46;
    const star = Math.pow(Math.abs(x), 0.55) + Math.pow(Math.abs(y), 0.55) <= Math.pow(0.34, 0.55);
    return ring || star;
  };
  return (u, v) => {
    let hits = 0;
    const n = 3;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (sample(u + (i + 0.5) / n / 512, v + (j + 0.5) / n / 512)) hits++;
    }
    const a = hits / (n * n);
    return BG.map((c, k) => Math.round(c + (AMBER[k] - c) * a));
  };
}

fs.mkdirSync('icons', { recursive: true });
fs.writeFileSync('icons/icon-192.png', png(192, makePixel(1.0)));
fs.writeFileSync('icons/icon-512.png', png(512, makePixel(1.0)));
fs.writeFileSync('icons/icon-maskable-512.png', png(512, makePixel(0.72)));
fs.writeFileSync('icons/apple-touch-icon.png', png(180, makePixel(0.9)));
console.log('✅ Icônes générées dans icons/');
