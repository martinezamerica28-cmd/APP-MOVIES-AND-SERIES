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

1. Crea una cuenta en https://www.themoviedb.org/signup y solicita acceso en Ajustes → API. Necesitas el **token de acceso de lectura de la API**, no una clave corta v3. Acepta las condiciones y revisa la atribución/licencia correspondiente a tu uso.
2. En Windows, activa en el Explorador **Ver → Mostrar → Extensiones de nombre de archivo**. Copia `.env.example` con el nombre `.env.local` (sin `.txt`). Nunca publiques este archivo ni pegues el token en chats.
3. Edita solo la línea `TMDB_TOKEN=` de `.env.local` para colocar tu token después del signo igual, sin la palabra Bearer. No uses `EXPO_PUBLIC_` para este token.
4. Para revisar en tu PC ejecuta:

```sh
npm ci
npm run dev:web
```

El comando inicia el servidor, comprueba una consulta real a TMDB e inicia Expo web conectado al servidor. Si no hay token o TMDB lo rechaza, explica el problema y se detiene. Mantén la terminal abierta.

Para el iPhone, detén ese proceso con Ctrl+C y ejecuta:

```sh
npm run dev:iphone
```

Elige la misma red Wi-Fi en ambos dispositivos y escanea el QR en Expo Go. Permite Node en redes privadas si el firewall de Windows lo solicita. El script usa la IP LAN del PC; si hay varias interfaces (VPN/VirtualBox/etc.), añade `CATALOG_LAN_HOST=192.168.1.50` a `.env.local`, sustituyendo el ejemplo por la IPv4 que muestra `ipconfig` para tu Wi-Fi. El modo túnel de Expo solo transporta Metro: no publica automáticamente este servidor de catálogo.

Sin token puedes seguir usando `npm run web` / `npm start` con catálogo ficticio. Si configuraste manualmente `EXPO_PUBLIC_CATALOG_URL`, bórrala para volver al demo.

### Servidor por separado y distribución

`npm run backend` carga `.env.local` e inicia el proxy en el puerto 8787. `/health` indica si hay configuración, pero solo una consulta de catálogo valida el token. Para alojarlo en producción usa un servidor HTTPS, configura ahí `TMDB_TOKEN` y apunta `EXPO_PUBLIC_CATALOG_URL` a su dirección, sin barra final. Reinicia Expo después de cambiar variables públicas. El token se usa únicamente en el servidor; no se incorpora al código cliente.

El proxy permite consultas de catálogo, búsqueda y detalles por ID, tiene timeout y una caché de cinco minutos con 200 entradas. Añade autenticación y límites de tráfico en tu alojamiento antes de ofrecerlo públicamente. `CORS_ORIGIN` restringe el origen web y no sustituye esos controles.

Las películas usan `now_playing` con `region=MX`. Las series en estreno son series cuya primera emisión ocurrió en los últimos 90 días. Las búsquedas y pantallas por género permiten cargar páginas adicionales. Se excluyen personas y contenido marcado como adulto. Los errores de conexión, token faltante/rechazado y límite de solicitudes se muestran sin revelar credenciales. Las fichas cargan el detalle de TMDB al abrirlas.

Terror en series se aproxima por Misterio, Romance por Drama y Fantasía/Ciencia ficción comparten una categoría de TMDB; esas equivalencias no son exactas. El catálogo requiere atribución y el logotipo oficial de TMDB según sus condiciones antes de publicar: el pie de página contiene el aviso textual; el logotipo aún está pendiente.

Los identificadores de favoritos y reseñas separan demo/TMDB y películas/series. Los datos locales previos migran al leerlos, conservando listas y perfil; no se convierten los títulos ficticios en títulos reales.

La integración se puede verificar con fixtures y sin credenciales, pero eso no demuestra conexión real a TMDB. La validación de una consulta real solo se completa al configurar un token válido.

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

Las pruebas del backend verifican rutas permitidas, ausencia/rechazo de token, caché, detalles, paginación, filtros y errores del proveedor usando respuestas simuladas. No verifican la conectividad real a TMDB.

Para repetir la prueba de interfaz: instala Playwright, ejecuta `npx playwright install chromium`, exporta la web, sirve `dist` en el puerto 8765 y ejecuta `node scripts/smoke.cjs`. Cubre búsqueda, géneros, favoritos, reseñas, estados, listas y persistencia tras recargar.

## Archivos

- `src/ProfileScreen.tsx`: perfil con foto, nombre, descripción, fecha, filas horizontales y listas que se abren por separado. Permite editar el perfil y elegir una foto; se reduce a 256 píxeles antes de guardarla.
- `App.tsx`: pantallas y navegación modal del MVP; no depende de un servicio externo para arrancar.
- `src/catalog.ts`: adaptador de TMDB y catálogo demo.
- `src/storage.ts`: biblioteca local tipada.
- `src/cloud.ts`: autenticación y biblioteca por usuario.
- `backend/server.mjs`: proxy de TMDB sin dependencias adicionales.
- `eas.json`: perfiles development, preview y production.

Siguiente refactor recomendado: separar las pantallas de `App.tsx` y migrar la navegación a Expo Router cuando se necesiten enlaces profundos y restauración de rutas.

El perfil conserva Por ver, calificaciones y reseñas después de las secciones del boceto. No se crean listas de ejemplo. Los perfiles locales existentes conservan su colección y reciben una fecha de inicio local al abrir esta versión. La edición de datos se guarda junto con la biblioteca; la sincronización real con Firebase sigue pendiente de configurar y validar.

`node scripts/catalog-smoke.cjs` verifica el modo TMDB con respuestas interceptadas (sin token real), incluidos errores y reintentos, ficha completa, paginación y migración de favoritos demo/reales. Requiere exportar la web con `EXPO_PUBLIC_CATALOG_URL=http://127.0.0.1:8787`, servir esa exportación en el puerto 8766 y Chromium/Playwright instalado. No sustituye la consulta real que hace `npm run dev:web`.
