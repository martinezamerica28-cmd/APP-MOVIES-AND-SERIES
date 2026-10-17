import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, GoogleAuthProvider, OAuthProvider, signInWithCredential, signOut, deleteUser, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc, deleteDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Library, normalizeLibrary } from './storage';
const config = { apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY, authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID, appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID };
export const cloudEnabled = !!(config.apiKey && config.projectId && config.appId);
const app = cloudEnabled ? (getApps()[0] || initializeApp(config)) : undefined;
const auth = app ? (Platform.OS === 'web' ? getAuth(app) : initializeAuth(app, { persistence: require('firebase/auth').getReactNativePersistence(AsyncStorage) })) : undefined;
const db = app ? getFirestore(app) : undefined;
export function watchUser(callback: (user: User | null) => void) { if (!auth) { callback(null); return () => {}; } return onAuthStateChanged(auth, callback); }
export async function login(provider: 'google' | 'apple') {
 if (!auth) throw new Error('Configura Firebase en .env.local y reinicia Expo.');
 if (Platform.OS === 'web') throw new Error('El acceso nativo se prueba en un development build de iPhone.');
 if (provider === 'google') {
  if (!process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || !process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) throw new Error('Faltan los identificadores OAuth de Google.');
  const { GoogleSignin } = require('@react-native-google-signin/google-signin');
  GoogleSignin.configure({ iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID });
  const response = await GoogleSignin.signIn();
  const token = response.data?.idToken;
  if (!token) throw new Error('No se completó el acceso con Google.');
  return signInWithCredential(auth, GoogleAuthProvider.credential(token));
 }
 if (Platform.OS !== 'ios' || !await AppleAuthentication.isAvailableAsync()) throw new Error('Apple solo está disponible en dispositivos iOS compatibles.');
 const nonce = Crypto.randomUUID();
 const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);
 const response = await AppleAuthentication.signInAsync({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL], nonce: hashed });
 if (!response.identityToken) throw new Error('Apple no devolvió la credencial de acceso.');
 return signInWithCredential(auth, new OAuthProvider('apple.com').credential({ idToken: response.identityToken, rawNonce: nonce }));
}
export async function logout() { if (auth) await signOut(auth); }
export async function readCloud(uid: string): Promise<Library | undefined> { if (!db) return; const result = await getDoc(doc(db, 'users', uid)); return result.exists() ? normalizeLibrary(result.data().library as Library) : undefined; }
export async function writeCloud(uid: string, library: Library) { if (!db) throw new Error('Firestore no está configurado.'); await setDoc(doc(db, 'users', uid), { library: JSON.parse(JSON.stringify(library)) }); }
export async function removeAccount() { if (!auth?.currentUser || !db) return; const user = auth.currentUser; await deleteDoc(doc(db, 'users', user.uid)); await deleteUser(user); }
