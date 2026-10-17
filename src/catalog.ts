export type Title = { id: number; type: 'movie' | 'tv'; name: string; overview: string; poster: string | null; genres: number[]; year: string };
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
const base = process.env.EXPO_PUBLIC_CATALOG_URL;
export const isDemo = !base;
function normalize(x: any, type?: 'movie' | 'tv'): Title { return { id: x.id, type: type || x.media_type, name: x.title || x.name, overview: x.overview || 'Sin sinopsis disponible.', poster: x.poster_path ? `https://image.tmdb.org/t/p/w342${x.poster_path}` : null, genres: x.genre_ids || x.genres?.map((g: any) => g.id) || [], year: (x.release_date || x.first_air_date || '').slice(0, 4) }; }
export async function catalog(query = '', genre?: typeof genres[number]): Promise<Title[]> {
  if (!base) return demo.filter(x => (!query || x.name.toLowerCase().includes(query.toLowerCase())) && (!genre || x.genres.includes(x.type === 'movie' ? genre.id : genre.tv)));
  const paths = query ? [`/search/multi?query=${encodeURIComponent(query)}`] : genre ? [`/discover/movie?with_genres=${genre.id}`, `/discover/tv?with_genres=${genre.tv}`] : ['/movie/now_playing?', `/discover/tv?first_air_date.gte=${new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)}&first_air_date.lte=${new Date().toISOString().slice(0, 10)}&sort_by=popularity.desc`];
  const results = await Promise.all(paths.map(async (path) => { const r = await fetch(`${base}${path}${path.includes('?') && !path.endsWith('?') ? '&' : ''}language=es-MX`); if (!r.ok) throw new Error('No se pudo cargar el catálogo. Intenta de nuevo.'); const data = await r.json(); return data.results.filter((x: any) => x.media_type !== 'person').map((x: any) => normalize(x, query ? undefined : path.includes('/movie') ? 'movie' : 'tv')); }));
  return results.flat();
}
