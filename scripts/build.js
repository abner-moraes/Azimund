import * as esbuild from 'esbuild';
import { cp, mkdir } from 'node:fs/promises';

// Compila somente o front-end. O servidor do esbuild serve arquivos estáticos.
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
await cp('index.html', 'dist/index.html');

const options = {
  entryPoints: ['js/main.jsx'],
  bundle: true,
  outfile: 'dist/app.js',
  format: 'esm',
  loader: { '.svg': 'dataurl', '.png': 'dataurl' },
  sourcemap: true
};

if (process.argv.includes('--watch')) {
  const context = await esbuild.context(options);
  await context.watch();
  await context.serve({ servedir: 'dist', port: 5173, host: '127.0.0.1' });
  console.log('Azimund: http://localhost:5173');
} else {
  await esbuild.build(options);
  console.log('Front-end compilado em dist.');
}
