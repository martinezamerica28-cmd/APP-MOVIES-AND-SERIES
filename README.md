# Cineclub

App de películas y series en React Native + Expo + TypeScript, basada en los bocetos del proyecto. Diseño claro inspirado en superficies de relieve suave: tonos lavanda, botones fucsia, tarjetas redondeadas y navegación inferior con Inicio, Explorar, Favoritos y Yo. Conserva filas horizontales, menú lateral y perfil privado.

## Empezar desde un PC

Requisitos: Node 24.12.0 o superior de la rama LTS, npm y Expo Go compatible con Expo SDK 57 en el iPhone.

```sh
npm ci
npm start
```

Este proyecto utiliza **Expo SDK 57**, compatible con Expo Go cliente 57.0.9 / SDK 57.0.0. `npm start` selecciona explícitamente Expo Go.

Si descargaste antes la versión con SDK 58: detén Expo con Ctrl+C, descarga de nuevo el ZIP de GitHub, extráelo en una carpeta nueva y ejecuta `npm ci` y `npx expo start --go --clear` desde esa carpeta.

Escanea el QR con la cámara del iPhone. PC y teléfono deben estar en la misma red. Si tu Expo Go no admite este SDK, utiliza un development build compatible; no cambies versiones aisladas de React Native. También puedes ejecutar `npm run web`.

Sin variables, funciona con un **catálogo ficticio claramente identificado** y un perfil local. Puedes buscar, explorar géneros, calificar, marcar estados, escribir reseñas, guardar favoritos y crear/eliminar listas. Los datos sobreviven al cierre de la app. Las listas locales no se mezclan automáticamente con las de una cuenta.

## Catálogo real de TMDB

1. Obtén un token de lectura de TMDB y revisa sus condiciones y atribución.
2. Copia `.env.example` a `.env.local`. No publiques ese archivo.
3. Inicia el servidor con `node --env-file=.env.local backend/server.mjs` (Node no carga `.env.local` automáticamente).
4. Configura `EXPO_PUBLIC_CATALOG_URL` con la dirección de tu servidor **accesible desde el iPhone** y sin barra final. Para pruebas LAN usa la IP del PC y puerto 8787; para distribución usa un servidor HTTPS.
5. Reinicia Expo. `TMDB_TOKEN` permanece en el servidor y nunca lleva prefijo `EXPO_PUBLIC_`.

El proxy permite únicamente cuatro endpoints, conserva la verificación HTTPS, limita la caché a 200 entradas y aplica timeout. Antes de publicar, añade autenticación y límites de tráfico en el alojamiento. `CORS_ORIGIN` restringe el origen web; CORS no sustituye autenticación.

Las películas usan `now_playing`. Las series en estreno son series cuya primera emisión ocurrió en los últimos 90 días, no todas las series que siguen emitiendo episodios. Terror en series se aproxima por Misterio, Romance por Drama y Fantasía/Ciencia ficción comparten la categoría de TMDB; esas equivalencias no son exactas. El catálogo carga la primera página de cada sección: la paginación es una mejora pendiente.

## Firebase y cuentas privadas

1. Crea un proyecto Firebase, habilita Firestore y registra una app web para obtener la configuración pública `EXPO_PUBLIC_FIREBASE_*`.
2. Publica `firestore.rules` en Firebase antes de conectar usuarios. Las reglas restringen cada documento a su propietario.
3. Habilita Google y Apple como proveedores en Firebase Auth.
4. Cambia `ios.bundleIdentifier` en `app.json` a un identificador propio y registra ese mismo identificador en Apple y Google.
5. Configura los clientes OAuth de Google iOS y web. Añade sus IDs a `.env.local`, y el esquema iOS invertido a `GOOGLE_IOS_URL_SCHEME`. El plugin lo incorpora al development build.
6. Para Apple, configura la capacidad Sign in with Apple y las credenciales que solicite Firebase; guarda las claves privadas en las consolas correspondientes, nunca en Git.
7. Genera un development build. Google nativo no funciona en Expo Go. La app web sirve para el demo, no implementa acceso OAuth web.

`src/cloud.ts` conecta credenciales nativas a Firebase Auth. En iOS persiste la sesión con AsyncStorage. Cada usuario guarda su biblioteca en `users/{uid}`; al cerrar sesión vuelve al perfil local. No se han probado los proveedores reales sin las cuentas y credenciales del propietario.

El perfil permite eliminar la cuenta y su documento de biblioteca. Firebase puede exigir una sesión reciente: vuelve a iniciar sesión antes de eliminar. Antes del lanzamiento debe completarse y verificarse la revocación de autorización de Apple en el backend y el flujo de recuperación ante errores de eliminación.

La biblioteca se guarda en un único documento para este MVP: migra a subcolecciones y guardado de reseñas al finalizar la edición para colecciones grandes, menor consumo y conflictos entre dispositivos. No se implementa resolución de conflictos entre ediciones simultáneas.

## iPhone y compilación en la nube

```sh
npx eas-cli login
npx eas-cli init
npx eas-cli device:create
npx eas-cli build --platform ios --profile development
npx expo start --dev-client
```

EAS init vincula tu proyecto; revisa los cambios generados. Registra el iPhone para distribución interna e instala la compilación desde EAS. Vuelve a compilar cuando cambies plugins o configuración nativa. Configura también las variables necesarias en el entorno EAS usado por cada perfil; las variables públicas quedan incluidas en el binario.

Para TestFlight:

```sh
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production
```

Necesitas Apple Developer Program (normalmente USD 99/año, sujeto a país e impuestos), una app en App Store Connect y firma de distribución. EAS puede administrar certificados sin un Mac. Revisa precios y cuotas vigentes de Expo y Firebase. Submit sube el binario; la ficha, revisión y publicación se completan en App Store Connect.

Antes de publicar: política de privacidad alojada, declaraciones de datos, capturas reales, icono propio (los actuales son los de la plantilla), clasificación por edad, atribución/logotipo de TMDB según sus reglas y validación de eliminación de cuenta y acceso Google/Apple. No se ha hecho una compilación firmada, envío a Apple ni publicación desde este repositorio.

## Validación

```sh
npm run typecheck
npm test
npx expo export --platform all
```

Las pruebas del backend verifican rutas permitidas, ausencia de token, caché y errores del proveedor usando respuestas simuladas. No verifican la conectividad real a TMDB.

Para repetir la prueba de interfaz: instala Playwright, ejecuta `npx playwright install chromium`, exporta la web, sirve `dist` en el puerto 8765 y ejecuta `node scripts/smoke.cjs`. Cubre búsqueda, géneros, favoritos, reseñas, estados, listas y persistencia tras recargar.

## Archivos

- `App.tsx`: pantallas y navegación modal del MVP; no depende de un servicio externo para arrancar.
- `src/catalog.ts`: adaptador de TMDB y catálogo demo.
- `src/storage.ts`: biblioteca local tipada.
- `src/cloud.ts`: autenticación y biblioteca por usuario.
- `backend/server.mjs`: proxy de TMDB sin dependencias adicionales.
- `eas.json`: perfiles development, preview y production.

Siguiente refactor recomendado: separar las pantallas de `App.tsx` y migrar la navegación a Expo Router cuando se necesiten enlaces profundos y restauración de rutas.
