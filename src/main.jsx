import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { loadWords } from './lib/words.js'
import { load } from './lib/storage.js'

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
  })
