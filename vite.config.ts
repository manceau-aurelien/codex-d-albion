import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `index.html` à la racine est le fichier autonome généré (servi par GitHub Pages) :
// le vrai point d'entrée Vite est donc `app.html`. Le build intermédiaire va dans `.build/`
// puis `scripts/build-standalone.mjs` produit `index.html` et `sw.js` (hors-ligne).
export default defineConfig({
  base: './',
  publicDir: false,
  build: {
    outDir: '.build',
    emptyOutDir: true,
    // Les polices (woff2) sont inlinées dans le CSS pour garder un fichier 100 % autonome
    assetsInlineLimit: 100_000,
    rollupOptions: { input: 'app.html' }
  },
  plugins: [react()]
});
