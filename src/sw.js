// Service worker: deja el juego guardado en el dispositivo para poder jugar sin conexión.
// No se empaqueta con la app: al terminar el build, vite.config.js lo copia a dist/sw.js y rellena
// VERSION (hash del contenido de todo lo guardado), FILES y COMMIT. Cualquier cambio en un despliegue cambia
// sw.js, el navegador instala el nuevo, descarga todo de nuevo y borra la caché anterior.
const VERSION = '__VERSION__'
const FILES = ['__FILES__']
// Commit de lo guardado: lo pregunta Ajustes para saber si la versión sin conexión está al día
const COMMIT = '__COMMIT__'
const CACHE = `infinidle-${VERSION}`
// Con cobertura mala (no hay red, pero tampoco falla) no se espera más que esto para la página
const NETWORK_TIMEOUT = 3000
// Sin esto, una cabecera Vary (p. ej. Vary: Origin) impide servir los JS de tipo módulo desde la caché
const MATCH = { ignoreVary: true }

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.all(FILES.map((url) => store(cache, url))))
      .then(() => self.skipWaiting()),
  )
})

/**
 * Lo de assets/ lleva hash en el nombre: si ya estaba guardado de una versión anterior, es el mismo fichero
 * y no se vuelve a descargar (cada commit cambia el JS, pero las listas casi nunca).
 * Lo demás se pide con 'reload', que salta la caché HTTP: podría venir de la versión anterior.
 */
async function store(cache, url) {
  const old = url.startsWith('/assets/') && (await caches.match(url, MATCH))
  if (old) return cache.put(url, old)
  const response = await fetch(new Request(url, { cache: 'reload' }))
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  return cache.put(url, response)
}

self.addEventListener('message', (event) => {
  if (event.data === 'version') event.ports[0]?.postMessage({ commit: COMMIT })
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return
  if (request.mode === 'navigate') event.respondWith(page(request))
  else event.respondWith(caches.match(request, MATCH).then((cached) => cached ?? fetch(request)))
})

/**
 * La página va primero a la red, por si hay versión nueva; sin red, la guardada.
 * La respuesta de la red no se guarda: la copia de la caché tiene que ir con los JS y CSS de esa misma
 * versión. La página nueva la guarda el service worker nuevo al instalarse.
 */
async function page(request) {
  const network = fetch(request)
  try {
    return await Promise.race([
      network,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NETWORK_TIMEOUT)),
    ])
  } catch {
    return (await caches.match('/', MATCH)) ?? network
  }
}
