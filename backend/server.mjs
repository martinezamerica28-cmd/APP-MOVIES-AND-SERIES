import http from 'node:http';
import { pathToFileURL } from 'node:url';
const allowed = new Set(['movie/now_playing', 'discover/movie', 'discover/tv', 'search/multi']);
export function createServer({ token = process.env.TMDB_TOKEN, fetcher = fetch } = {}) {
 const cache = new Map();
 return http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') { res.writeHead(405); return res.end('{"error":"Method not allowed"}'); }
  const input = new URL(req.url, 'http://localhost');
  if (input.pathname === '/health') return res.end('{"ok":true}');
  if (!allowed.has(input.pathname.slice(1))) { res.writeHead(404); return res.end('{"error":"Unknown endpoint"}'); }
  if (!token) { res.writeHead(503); return res.end('{"error":"TMDB_TOKEN is missing"}'); }
  const upstream = new URL(`https://api.themoviedb.org/3${input.pathname}`);
  for (const key of ['query', 'with_genres', 'language', 'first_air_date.gte', 'first_air_date.lte', 'sort_by']) { const value = input.searchParams.get(key); if (value) upstream.searchParams.set(key, value.slice(0, 200)); }
  upstream.searchParams.set('include_adult', 'false');
  const key = upstream.toString(), hit = cache.get(key);
  if (hit && hit.until > Date.now()) return res.end(hit.body);
  try {
   const result = await fetcher(upstream, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
   if (!result.ok) { res.writeHead(result.status === 429 ? 429 : 502); return res.end('{"error":"Catalog unavailable"}'); }
   const body = JSON.stringify(await result.json());
   if (cache.size >= 200) cache.delete(cache.keys().next().value);
   cache.set(key, { body, until: Date.now() + 300000 });
   res.end(body);
  } catch { res.writeHead(502); res.end('{"error":"Catalog unavailable"}'); }
 });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) createServer().listen(Number(process.env.PORT || 8787), '0.0.0.0', () => console.log('Catalog server listening'));
