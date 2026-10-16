import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { loadWords } from './lib/words.js'
import { load } from './lib/storage.js'
import { startAnalytics } from './lib/analytics.js'
import { endIntro } from './lib/intro.js'

// No montamos React hasta tener las palabras del modo guardado: así la pantalla de arranque
// de index.html (CARGANDO) sigue animándose sin cortes y se pasa directamente al tablero.
const { length = 5 } = load('settings', {})
loadWords(length)
  .catch(() => {}) // Si falla, App muestra el error y permite reintentar
  .finally(() => {
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
    // En el arranque en frío, la intro (index.html) termina sobre el logo de la cabecera
    endIntro()
  })

// Estadísticas de uso, solo si el jugador ya las había aceptado (si no, App le pregunta antes de jugar)
startAnalytics()

// En la app instalada en Android, al volver de otra pantalla (p. ej. la RAE, que se abre encima) Chrome
// repinta la barra de navegación con el color del manifiesto, blanco, aunque el sistema esté en oscuro.
// Cambiar theme-color y devolverlo en el siguiente fotograma le obliga a recalcularlo con el de la página.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return
  const metas = document.querySelectorAll('meta[name="theme-color"]')
  const colors = [...metas].map((meta) => meta.content)
  metas.forEach((meta) => (meta.content = '#000000'))
  requestAnimationFrame(() => metas.forEach((meta, i) => (meta.content = colors[i])))
})

// Guarda el juego en el dispositivo para poder jugar sin conexión (src/sw.js). Solo en producción, y
// tras la carga, para que la descarga de lo que se guarda no compita con la primera partida.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
}
