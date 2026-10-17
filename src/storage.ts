import AsyncStorage from '@react-native-async-storage/async-storage';
import { Title } from './catalog';
export type Entry = { title: Title; rating?: number; status?: 'Por ver' | 'Viendo' | 'Vista'; review?: string; favorite?: boolean; lists?: string[] };
export type Library = { entries: Record<string, Entry>; lists: string[]; profile?: { name?: string; bio?: string; photoUri?: string; joinedAt?: string } };
export const empty: Library = { entries: {}, lists: [] };
export const keyOf = (t: Title) => `${t.source || (t.poster?.startsWith('https://image.tmdb.org/') ? 'tmdb' : 'demo')}_${t.type}_${t.id}`;
export function normalizeLibrary(value: Library): Library { return { ...value, entries: Object.fromEntries(Object.values(value.entries).map(entry => [keyOf(entry.title), { ...entry, title: { ...entry.title, source: entry.title.source || (entry.title.poster?.startsWith('https://image.tmdb.org/') ? 'tmdb' : 'demo') } }])) }; }
export async function load(): Promise<Library> { const value = await AsyncStorage.getItem('cineclub.demo.v1'); const library = normalizeLibrary(value ? JSON.parse(value) : { ...empty }); return { ...library, profile: { ...library.profile, joinedAt: library.profile?.joinedAt || new Date().toISOString() } }; }
export async function save(value: Library) { await AsyncStorage.setItem('cineclub.demo.v1', JSON.stringify(value)); }
