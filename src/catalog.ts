export type Title = { id: number; source?: 'demo' | 'tmdb'; type: 'movie' | 'tv'; name: string; overview: string; poster: string | null; genres: number[]; year: string };
export const genres = [{ id: 27, tv: 9648, name: 'Terror' }, { id: 10749, tv: 18, name: 'Romance' }, { id: 878, tv: 10765, name: 'Ciencia ficción' }, { id: 14, tv: 10765, name: 'Fantasía' }, { id: 28, tv: 10759, name: 'Acción' }, { id: 35, tv: 35, name: 'Comedia' }];
export const demo: Title[] = [
  { id: 1, type: 'movie', name: 'Más allá de Orión', year: '2026', genres: [878, 14], poster: null, overview: 'Una astrónoma recibe una señal que la lleva a explorar los límites del universo y sus propios recuerdos.' },
  { id: 2, type: 'movie', name: 'La última luz', year: '2026', genres: [27], poster: null, overview: 'Un faro abandonado vuelve a encenderse cada noche. Nadie en el pueblo quiere explicar por qué.' },
  { id: 3, type: 'tv', name: 'Días de verano', year: '2026', genres: [18, 35], poster: null, overview: 'Cuatro amigos se reencuentran en el lugar donde prometieron volver a empezar.' },
  { id: 4, type: 'tv', name: 'El bosque secreto', year: '2026', genres: [9648, 10765], poster: null, overview: 'Una joven descubre que las leyendas de su pueblo esconden un mundo que todavía sigue vivo.' },
  { id: 5, type: 'movie', name: 'Nos queda París', year: '2025', genres: [10749, 35], poster: null, overview: 'Dos desconocidos pierden el último tren y encuentran una historia que merece la pena contar.' },
  { id: 6, type: 'movie', name: 'Kilómetro cero', year: '2026', genres: [28], poster: null, overview: 'Una mecánica debe cruzar el desierto para recuperar algo mucho más valioso que un automóvil.' },
  { id: 7, type: 'tv', name: 'Órbita', year: '2026', genres: [10765, 10759], poster: null, overview: 'La tripulación de una estación espacial encuentra una puerta que no debería existir.' },
  { id: 8, type: 'tv', name: 'Vecinos', year: '2026', genres: [35, 18], poster: null, overview: 'Una comunidad de vecinos transforma cada problema cotidiano en una aventura inesperada.' }
];
const base = process.env.EXPO_PUBLIC_CATALOG_URL?.replace(/\/+$/, '');
export const isDemo = !base;
function normalize(x: any, type?: 'movie' | 'tv'): Title {
 return { id: x.id, source: 'tmdb', type: type || x.media_type, name: x.title || x.name, overview: x.overview || 'Sin sinopsis disponible.', poster: x.poster_path ? `https://image.tmdb.org/t/p/w342${x.poster_path}` : null, genres: x.genre_ids || x.genres?.map((g: any) => g.id) || [], year: (x.release_date || x.first_air_date || '').slice(0, 4) };
}
async function request(path: string, params: Record<string, string> = {}) {
 const url = `${base}${path}?${new URLSearchParams({ language: 'es-MX', ...params })}`;
 let response: Response;
 const controller = new AbortController();
 const timer = setTimeout(() => controller.abort(), 15000);
 try { response = await fetch(url, { signal: controller.signal }); }
 catch { throw new Error('No se pudo conectar con el catálogo. Comprueba que el servidor esté encendido y la dirección sea accesible desde este dispositivo.'); }
 finally { clearTimeout(timer); }
 if (!response.ok) {
  const data = await response.json().catch(() => ({}));
  throw new Error(data.code === 'TOKEN_MISSING' ? 'Falta configurar TMDB_TOKEN en el servidor de catálogo.' : data.code === 'TOKEN_REJECTED' ? 'TMDB rechazó el token. Revisa el token de lectura en el servidor.' : response.status === 429 ? 'El catálogo recibió demasiadas solicitudes. Intenta de nuevo en unos segundos.' : response.status === 404 ? 'Este título ya no está disponible en TMDB.' : 'TMDB no está disponible en este momento. Intenta de nuevo.');
 }
 return response.json();
}
export async function catalog(query = '', genre?: typeof genres[number], page = 1): Promise<Title[]> {
 if (!base) return page === 1 ? demo.filter(x => (!query || x.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())) && (!genre || x.genres.includes(x.type === 'movie' ? genre.id : genre.tv))) : [];
 const common = { page: String(page) };
 const sources: { path: string; params: Record<string, string>; type?: 'movie' | 'tv' }[] = query
  ? [{ path: '/search/multi', params: { ...common, query } }]
  : genre
   ? [{ path: '/discover/movie', params: { ...common, with_genres: String(genre.id) }, type: 'movie' }, { path: '/discover/tv', params: { ...common, with_genres: String(genre.tv) }, type: 'tv' }]
   : [{ path: '/movie/now_playing', params: { ...common, region: 'MX' }, type: 'movie' }, { path: '/discover/tv', params: { ...common, 'first_air_date.gte': new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10), 'first_air_date.lte': new Date().toISOString().slice(0, 10), sort_by: 'popularity.desc' }, type: 'tv' }];
 return (await Promise.all(sources.map(async source => {
  const data = await request(source.path, source.params);
  if (!Array.isArray(data.results)) throw new Error('El servidor devolvió un catálogo inválido.');
  return data.results.filter((x: any) => !x.adult && (source.type || x.media_type === 'movie' || x.media_type === 'tv')).map((x: any) => normalize(x, source.type));
 }))).flat();
}
export async function titleDetails(title: Title): Promise<Title> {
 if (!base || title.source !== 'tmdb') return title;
 return normalize(await request(`/${title.type}/${title.id}`), title.type);
}
