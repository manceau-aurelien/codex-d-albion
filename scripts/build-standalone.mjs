import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// 1) Fichier autonome : app.html + CSS et JS issus du build Vite, tout inline (marche en double-clic, file://).
const distDir = path.resolve('.build/assets');
const files = fs.readdirSync(distDir);
const cssFile = files.find((f) => f.endsWith('.css'));
const jsFile = files.find((f) => f.endsWith('.js'));

const css = fs.readFileSync(path.join(distDir, cssFile), 'utf8');
// Sécurise toute séquence éventuelle </script dans le bundle JS
const js = fs.readFileSync(path.join(distDir, jsFile), 'utf8').replace(/<\/script/gi, '<\\/script');

const template = fs.readFileSync('app.html', 'utf8');
const html = template
  .replace('</head>', () => `  <style>${css}</style>\n  </head>`)
  .replace('<script type="module" src="/src/main.tsx"></script>', () => `<script type="module">${js}</script>`);
if (!html.includes('<script type="module">') || !html.includes('<style>')) {
  throw new Error('app.html : balises attendues introuvables');
}
fs.writeFileSync('index.html', html, 'utf8');
console.log(`✅ index.html autonome prêt (${Math.round(html.length / 1024)} Ko)`);

// 2) Service worker : versions calculées à partir du contenu réel des fichiers.
const sha = (buffers) => {
  const h = crypto.createHash('sha1');
  buffers.forEach((b) => h.update(b));
  return h.digest('hex').slice(0, 10);
};
const listFiles = (dir) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).sort().map((f) => `${dir}/${f}`) : [];

const coreUrls = [
  './index.html',
  './manifest.webmanifest',
  ...listFiles('icons').map((f) => `./${f}`)
];
const audioUrls = listFiles('audio/tier1').map((f) => `./${f}`);

const coreVersion = sha(coreUrls.map((u) => fs.readFileSync(u.slice(2))));
const audioVersion = sha(audioUrls.map((u) => fs.readFileSync(u.slice(2))));

const sw = fs
  .readFileSync('scripts/sw-template.js', 'utf8')
  .replace('__CORE_VERSION__', coreVersion)
  .replace('__AUDIO_VERSION__', audioVersion)
  .replace('__CORE_URLS__', JSON.stringify(coreUrls))
  .replace('__AUDIO_URLS__', JSON.stringify(audioUrls));
fs.writeFileSync('sw.js', sw, 'utf8');
console.log(`✅ sw.js généré (${coreUrls.length} fichiers principaux, ${audioUrls.length} fichiers audio)`);
