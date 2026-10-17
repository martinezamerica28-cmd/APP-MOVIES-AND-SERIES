import http from 'node:http';
import { pathToFileURL } from 'node:url';
const allowed = new Set(['movie/now_playing', 'discover/movie', 'discover/tv', 'search/multi']);
const detailPath = /^\/(movie|tv)\/[1-9]\d*$/;
export function createServer({ token = process.env.TMDB_TOKEN, fetcher = fetch } = {}) {
 const cache = new Map();
 function send(res, status, data) { res.writeHead(status); res.end(JSON.stringify(data)); }
 return http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  const input = new URL(req.url, 'http://localhost');
  if (input.pathname === '/health') return send(res, 200, { ok: true, catalogConfigured: !!token });
  const detail = detailPath.test(input.pathname);
  if (!allowed.has(input.pathname.slice(1)) && !detail) return send(res, 404, { error: 'Unknown endpoint' });
  if (!token) return send(res, 503, { error: 'TMDB_TOKEN is missing', code: 'TOKEN_MISSING' });
  const page = input.searchParams.get('page');
  if (page && (!/^[1-9]\d*$/.test(page) || Number(page) > 500)) return send(res, 400, { error: 'Invalid page' });
  if (input.pathname === '/search/multi' && !input.searchParams.get('query')?.trim()) return send(res, 400, { error: 'Search query is required' });
  const upstream = new URL(`https://api.themoviedb.org/3${input.pathname}`);
  for (const key of ['query', 'with_genres', 'language', 'region', 'page', 'first_air_date.gte', 'first_air_date.lte', 'sort_by']) { const value = input.searchParams.get(key); if (value) upstream.searchParams.set(key, value.slice(0, 200)); }
  upstream.searchParams.set('language', input.searchParams.get('language') || 'es-MX');
  upstream.searchParams.set('include_adult', 'false');
  const key = upstream.toString(), hit = cache.get(key);
  if (hit && hit.until > Date.now()) { res.writeHead(200); return res.end(hit.body); }
  try {
   const result = await fetcher(upstream, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
   if (!result.ok) {
    const status = result.status === 401 || result.status === 403 ? 502 : result.status === 404 ? 404 : result.status === 429 ? 429 : 502;
    return send(res, status, { error: 'Catalog unavailable', code: result.status === 401 || result.status === 403 ? 'TOKEN_REJECTED' : result.status === 429 ? 'RATE_LIMITED' : 'UPSTREAM_ERROR' });
   }
   const data = await result.json();
   if (detail && data.adult) return send(res, 404, { error: 'Title unavailable' });
   if (data.results) data.results = data.results.filter(x => !x.adult && (input.pathname !== '/search/multi' || x.media_type === 'movie' || x.media_type === 'tv'));
   const body = JSON.stringify(data);
   if (cache.size >= 200) cache.delete(cache.keys().next().value);
   cache.set(key, { body, until: Date.now() + 300000 });
   res.writeHead(200); res.end(body);
  } catch { send(res, 502, { error: 'Catalog unavailable', code: 'UPSTREAM_ERROR' }); }
 });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) createServer().listen(Number(process.env.PORT || 8787), '0.0.0.0', () => console.log('Servidor de catálogo iniciado en el puerto ' + (process.env.PORT || 8787)));
