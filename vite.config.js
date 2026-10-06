import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// URL pública del sitio: las etiquetas og:* necesitan direcciones absolutas para que
// WhatsApp, X, etc. muestren la imagen. En Cloudflare Pages se puede cambiar con la variable SITE_URL.
const SITE_URL = (process.env.SITE_URL || 'https://infinidle.juannicolas.eu').replace(/\/+$/, '')

// Estadísticas de uso con consentimiento (src/lib/analytics.js). Sin esta variable no hay estadísticas ni se
// pregunta nada: así no cuentan las pruebas ni los forks. Se configura en Cloudflare Pages, igual que el servidor:
// por defecto Umami Cloud; con una instancia propia, UMAMI_SCRIPT_URL es la dirección del script y
// UMAMI_HOST_URL, opcional, a dónde manda los eventos (data-host-url).
const UMAMI_WEBSITE_ID = process.env.UMAMI_WEBSITE_ID
const UMAMI_SCRIPT_URL = process.env.UMAMI_SCRIPT_URL || 'https://cloud.umami.is/script.js'
const UMAMI_HOST_URL = process.env.UMAMI_HOST_URL?.replace(/\/+$/, '')

// Lo que no hace falta para jugar sin conexión no se guarda en el dispositivo
const NOT_OFFLINE = ['_headers', 'og.png', 'logo.svg', 'fonts/OFL.txt', 'icons/apple-touch-icon.png']

/**
 * Pone en index.html (%WORD_URLS%) la dirección de cada lista de palabras, para el script que las
 * descarga antes de que llegue React: { 5: { solutions, valid }, 6: …, 7: … }.
 * Al construir son las de assets/, con hash; en desarrollo, las de src/ tal cual.
 */
function wordUrls() {
  const LIST = /^src\/words\/es\/(\d+)\/(\w+)\.txt$/
  const add = (urls, file, url) => {
    const [, length, name] = file.match(LIST)
    urls[length] = { ...urls[length], [name]: url }
  }
  return {
    name: 'word-urls',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const urls = {}
        if (ctx.bundle) {
          for (const output of Object.values(ctx.bundle)) {
            const file = output.originalFileNames?.find((name) => LIST.test(name))
            if (file) add(urls, file, `/${output.fileName}`)
          }
        } else {
          for (const file of readdirSync('src/words/es', { recursive: true })) {
            if (file.endsWith('.txt')) add(urls, `src/words/es/${file}`, `/src/words/es/${file}`)
          }
        }
        return html.replace('%WORD_URLS%', JSON.stringify(urls))
      },
    },
  }
}

/** Escribe dist/sw.js a partir de src/sw.js con la lista de todo lo que hay que guardar y su versión. */
function serviceWorker() {
  let root, outDir
  return {
    name: 'service-worker',
    apply: 'build',
    configResolved(config) {
      root = config.root
      outDir = resolve(root, config.build.outDir)
    },
    // closeBundle: dist/ ya está completo (JS y CSS con hash y lo copiado de public/)
    closeBundle() {
      const files = readdirSync(outDir, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => relative(outDir, join(entry.parentPath, entry.name)).split(sep).join('/'))
        .filter((file) => !NOT_OFFLINE.includes(file))
        .sort()
      // La versión sale del contenido: cambia si cambia cualquier fichero, lleve hash en el nombre o no
      const hash = createHash('sha256')
      for (const file of files) hash.update(file).update(readFileSync(join(outDir, file)))
      const version = hash.digest('hex').slice(0, 12)
      // index.html se pide como "/" (Cloudflare Pages redirige /index.html a /)
      const urls = files.map((file) => (file === 'index.html' ? '/' : `/${file}`))
      const sw = readFileSync(join(root, 'src/sw.js'), 'utf8')
        .replace("'__VERSION__'", JSON.stringify(version))
        .replace("['__FILES__']", JSON.stringify(urls))
      writeFileSync(join(outDir, 'sw.js'), sw)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    // Lo lee src/lib/analytics.js, que carga el script solo si el jugador acepta y solo en el dominio de
    // SITE_URL (no en local ni en las vistas previas)
    'import.meta.env.UMAMI': JSON.stringify(
      UMAMI_WEBSITE_ID
        ? {
            src: UMAMI_SCRIPT_URL,
            websiteId: UMAMI_WEBSITE_ID,
            hostUrl: UMAMI_HOST_URL,
            domain: new URL(SITE_URL).hostname,
          }
        : null,
    ),
  },
  plugins: [
    react(),
    {
      name: 'site-url',
      transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
    },
    wordUrls(),
    serviceWorker(),
  ],
})
