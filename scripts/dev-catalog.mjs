import { spawn } from 'node:child_process';
import { networkInterfaces } from 'node:os';
import { createServer } from '../backend/server.mjs';
if (!process.env.TMDB_TOKEN?.trim()) {
 console.error('Falta TMDB_TOKEN. Copia .env.example a .env.local y añade el token de lectura de TMDB solo en ese archivo. No lo compartas ni lo subas a GitHub.');
 process.exit(1);
}
const web = process.argv.includes('--web');
const address = process.env.CATALOG_LAN_HOST || Object.values(networkInterfaces()).flat().find(item => item?.family === 'IPv4' && !item.internal)?.address;
const port = Number(process.env.PORT || 8787);
const host = web ? '127.0.0.1' : address;
if (!host) { console.error('No se encontró una IP de red. Configura CATALOG_LAN_HOST con la IP del PC.'); process.exit(1); }
const server = createServer();
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `El puerto ${port} está ocupado. Cierra el servidor anterior e intenta de nuevo.` : 'No se pudo iniciar el servidor del catálogo.'); process.exitCode = 1; });
server.listen(port, '0.0.0.0', async () => {
 const check = await fetch(`http://127.0.0.1:${port}/movie/now_playing?language=es-MX&region=MX`).catch(() => undefined);
 if (!check?.ok) {
  const data = await check?.json().catch(() => ({}));
  console.error(data?.code === 'TOKEN_REJECTED' ? 'TMDB rechazó el token. Usa el token de acceso de lectura de la API.' : 'No se pudo consultar TMDB. Revisa la conexión y la configuración del token.');
  server.close(); process.exitCode = 1; return;
 }
 console.log('TMDB conectado. Iniciando Expo con catálogo real.');
 const { TMDB_TOKEN, ...publicEnvironment } = process.env;
 const child = spawn(process.execPath, ['node_modules/expo/bin/cli', 'start', '--go', '--clear', ...(web ? ['--web'] : [])], { stdio: 'inherit', env: { ...publicEnvironment, EXPO_PUBLIC_CATALOG_URL: `http://${host}:${port}` } });
 child.on('error', () => { console.error('No se pudo iniciar Expo. Ejecuta npm ci primero.'); server.close(); process.exitCode = 1; });
 child.on('exit', code => { server.close(); process.exitCode = code || 0; });
 for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { child.kill(signal); server.close(); });
});
