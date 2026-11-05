import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['audio/tier1/**/*'],
      manifest: {
        name: "Le Codex d'Albion — Apprentissage de l'Anglais",
        short_name: "Codex d'Albion",
        description: "Déchiffrez l'anglais brique par brique, découvrez les formules grammaticales par induction et affrontez le Gardien Audio.",
        theme_color: '#0c0a09',
        background_color: '#0c0a09',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'fr'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,opus,webm,mp3}']
      }
    })
  ]
});
