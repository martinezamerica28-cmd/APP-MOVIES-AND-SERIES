import AsyncStorage from '@react-native-async-storage/async-storage';
import { Title } from './catalog';
export type Entry = { title: Title; rating?: number; status?: 'Por ver' | 'Viendo' | 'Vista'; review?: string; favorite?: boolean; lists?: string[] };
export type Library = { entries: Record<string, Entry>; lists: string[] };
export const empty: Library = { entries: {}, lists: [] };
export const keyOf = (t: Title) => `${t.type}_${t.id}`;
export async function load(): Promise<Library> { const value = await AsyncStorage.getItem('cineclub.demo.v1'); return value ? JSON.parse(value) : empty; }
export async function save(value: Library) { await AsyncStorage.setItem('cineclub.demo.v1', JSON.stringify(value)); }
