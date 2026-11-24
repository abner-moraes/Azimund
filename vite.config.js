import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// repassa /back/* pro Spring, assim o navegador acha que é tudo a mesma origem
const backProxy = {
  '/back': {
    target: 'http://localhost:8080',
    configure: (proxy) => {
      proxy.on('proxyReq', (req) => req.removeHeader('origin'));
      proxy.on('proxyRes', (res) => {
        delete res.headers['www-authenticate'];
      });
    },
  },
};

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        mapa: fileURLToPath(new URL('./index.html', import.meta.url)),
        login: fileURLToPath(new URL('./login.html', import.meta.url)),
        cadastro: fileURLToPath(new URL('./cadastro.html', import.meta.url)),
      },
    },
  },
  server: { port: 5173, proxy: backProxy },
  preview: { port: 5173, proxy: backProxy },
});