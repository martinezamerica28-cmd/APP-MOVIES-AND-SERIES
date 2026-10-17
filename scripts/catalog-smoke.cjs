// Ejecutar contra una exportación web con EXPO_PUBLIC_CATALOG_URL=http://127.0.0.1:8787.
// Las respuestas están simuladas: esta prueba no utiliza ni valida un token real.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
 const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
 page.setDefaultTimeout(15000);
 const errors = []; page.on('pageerror', e => errors.push(e.message));
 const movie = { id: 1, title: 'Película de prueba TMDB', overview: 'Sinopsis de búsqueda.', poster_path: '/fixture.jpg', genre_ids: [27], release_date: '2026-01-01' };
 const tv = { id: 1, name: 'Serie de prueba TMDB', overview: 'Sinopsis de serie.', poster_path: '/fixture.jpg', genre_ids: [9648], first_air_date: '2026-01-01' };
 let rejectToken = true;
 await page.route('http://127.0.0.1:8787/**', async route => {
  const url = new URL(route.request().url());
  if (rejectToken) return route.fulfill({ status: 503, json: { code: 'TOKEN_MISSING' } });
  if (url.pathname === '/movie/1') return route.fulfill({ json: { ...movie, overview: 'Sinopsis completa de la ficha.', genres: [{ id: 27 }] } });
  if (url.pathname === '/search/multi') {
   const current = Number(url.searchParams.get('page') || '1');
   return route.fulfill({ json: { results: current === 1 ? [{ ...movie, media_type: 'movie' }, { id: 40, media_type: 'person', name: 'Persona excluida' }] : current === 2 ? [{ ...movie, id: 2, title: 'Segunda página TMDB', media_type: 'movie' }] : [] } });
  }
  return route.fulfill({ json: { results: [url.pathname.includes('/tv') ? tv : movie] } });
 });
 await page.route('https://image.tmdb.org/**', route => route.fulfill({ path: 'assets/icon.png', contentType: 'image/png' }));
 await page.addInitScript(() => {
  if (!localStorage.getItem('cineclub.demo.v1')) localStorage.setItem('cineclub.demo.v1', JSON.stringify({ entries: { movie_1: { title: { id: 1, type: 'movie', name: 'Demo guardado', overview: 'Ficticio', poster: null, genres: [], year: '2026' }, favorite: true } }, lists: ['Mi lista'] }));
 });
 await page.goto(process.env.CATALOG_TEST_URL || 'http://127.0.0.1:8766');
 await page.getByText('Falta configurar TMDB_TOKEN en el servidor de catálogo.', { exact: true }).waitFor();
 rejectToken = false;
 await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
 await page.getByRole('button', { name: 'Ver Película de prueba TMDB', exact: true }).first().click();
 await page.getByText('Sinopsis completa de la ficha.', { exact: true }).waitFor();
 await page.getByRole('button', { name: '♡ Agregar a favoritos', exact: true }).click();
 await page.getByRole('button', { name: '‹ Volver', exact: true }).click();
 await page.getByRole('textbox', { name: 'Buscar películas y series' }).fill('prueba');
 await page.getByRole('button', { name: 'Buscar', exact: true }).click();
 await page.getByRole('button', { name: 'Ver más resultados', exact: true }).click();
 await page.getByRole('button', { name: 'Ver Segunda página TMDB', exact: true }).waitFor();
 assert.equal(await page.getByText('Persona excluida', { exact: true }).count(), 0);
 await page.getByRole('button', { name: 'Ver más resultados', exact: true }).click();
 await page.getByRole('button', { name: 'Ver más resultados', exact: true }).waitFor({ state: 'hidden' });
 await page.getByRole('tab', { name: 'Yo', exact: true }).click();
 await page.getByRole('button', { name: 'Ver Demo guardado', exact: true }).waitFor();
 await page.getByRole('button', { name: 'Ver Película de prueba TMDB', exact: true }).waitFor();
 await page.waitForFunction(() => { const data = JSON.parse(localStorage.getItem('cineclub.demo.v1') || '{}'); return data.entries?.demo_movie_1?.favorite && data.entries?.tmdb_movie_1?.favorite; });
 assert.deepEqual(errors, []);
 console.log('PASS: catálogo TMDB con fixtures, token faltante y reintento, detalle, búsqueda, paginación, exclusión de personas y conservación independiente de favoritos demo/reales.');
 await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
