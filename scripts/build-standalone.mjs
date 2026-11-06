import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist/assets');
const files = fs.readdirSync(distDir);
const cssFile = files.find((f) => f.endsWith('.css'));
const jsFile = files.find((f) => f.endsWith('.js'));

const css = fs.readFileSync(path.join(distDir, cssFile), 'utf8');
// Sécurise toute séquence éventuelle </script dans le bundle JS
const js = fs.readFileSync(path.join(distDir, jsFile), 'utf8').replace(/<\/script/gi, '<\\/script');

const html = `<!DOCTYPE html>
<html lang="fr" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="theme-color" content="#0c0a09" />
    <title>Le Codex d'Albion — Palier I : Le Seuil de Pierre</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
    <style>${css}</style>
  </head>
  <body class="bg-stone-950 text-stone-100 antialiased selection:bg-amber-500/30">
    <div id="root"></div>
    <script type="module">${js}</script>
  </body>
</html>`;

const targets = [
  path.resolve('index.html'),
  path.resolve('dist/index.html')
];

for (const target of targets) {
  fs.writeFileSync(target, html, 'utf8');
  console.log(`✅ Fichier autonome prêt au clic : ${target} (${Math.round(html.length / 1024)} Ko)`);
}
