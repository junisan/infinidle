import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// URL pública del sitio: las etiquetas og:* necesitan direcciones absolutas para que
// WhatsApp, X, etc. muestren la imagen. En Cloudflare Pages se puede cambiar con la variable SITE_URL.
const SITE_URL = (process.env.SITE_URL || 'https://infinidle.juannicolas.eu').replace(/\/+$/, '')

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'site-url',
      transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
    },
  ],
})
