import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        mapa: fileURLToPath(new URL('./index.html', import.meta.url)),
        login: fileURLToPath(new URL('./login.html', import.meta.url)),
        cadastro: fileURLToPath(new URL('./cadastro.html', import.meta.url))
      }
    }
  },
  server: { port: 5173 },
  preview: { port: 5173 }
});
