// Estadísticas de uso anónimas con Umami. vite.config.js añade el script a index.html solo si existe la
// variable UMAMI_WEBSITE_ID, y solo cuenta en el dominio de producción (data-domains). Sin cookies ni
// identificadores: cada evento lleva datos de la partida y, para saber si la gente vuelve, tramos de antigüedad.
// Sin conexión o con un bloqueador, no se envía nada y el juego sigue igual.
import { load, save } from './storage.js'

const DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
// Cada cuánto, como mucho, se recuerda a quien tiene las estadísticas bloqueadas que puede permitirlas
const BLOCKED_NOTICE_EVERY = 7 * 864e5

let sessionGames = 0

export function track(name, data) {
  try {
    window.umami?.track(name, data)
  } catch {
    // Nunca debe romper el juego
  }
}

const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true

/** Apunta hoy como día jugado y devuelve en qué tramo está el jugador por antigüedad y por días jugados. */
function loyalty() {
  const today = new Date().toLocaleDateString('sv') // AAAA-MM-DD en hora local
  const player = load('player', { first: today, last: null, days: 0 })
  if (player.last !== today) {
    player.last = today
    player.days++
    save('player', player)
  }
  const age = Math.round((Date.parse(today) - Date.parse(player.first)) / 864e5)
  const { days } = player
  return {
    antiguedad: age === 0 ? 'primer día' : age <= 7 ? '1-7 días' : age <= 30 ? '8-30 días' : 'más de 30 días',
    dias_jugados: days === 1 ? '1' : days <= 3 ? '2-3' : days <= 7 ? '4-7' : days <= 30 ? '8-30' : 'más de 30',
  }
}

export function trackGameEnd({ length, maxAttempts, won, attempts, solution, editedTile }) {
  const now = new Date()
  track('partida', {
    letras: length,
    intentos_max: maxAttempts,
    resultado: won ? 'ganada' : 'perdida',
    intentos: attempts,
    palabra: solution,
    hora: now.getHours(),
    dia: DAYS[now.getDay()],
    partida_sesion: ++sessionGames,
    corrigio_casilla: editedTile,
    instalada: installed(),
    ...loyalty(),
  })
}

/**
 * El script está en la página, hay conexión, terminó de cargar y aun así Umami no está: casi seguro un
 * bloqueador.
 * Devuelve true como mucho una vez cada BLOCKED_NOTICE_EVERY, y apunta que ya se ha mostrado.
 */
export function shouldShowBlockedNotice() {
  const configured = document.querySelector('script[data-website-id]')
  if (!configured || !navigator.onLine || document.readyState !== 'complete' || window.umami) return false
  if (Date.now() - load('blockedNoticeAt', 0) < BLOCKED_NOTICE_EVERY) return false
  save('blockedNoticeAt', Date.now())
  return true
}
