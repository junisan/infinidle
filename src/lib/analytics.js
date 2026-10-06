// Estadísticas de uso con Umami. Sin la variable UMAMI_WEBSITE_ID al construir (vite.config.js), o fuera del
// dominio de producción, no hay estadísticas, ni se pregunta nada.
// Lo que se pregunta al jugador es si se le puede reconocer: aceptar crea un identificador aleatorio
// (Distinct ID de Umami) que permite saber si vuelve, pero no quién es. Responda lo que responda, se cuentan
// visitas y eventos; si rechaza, de forma anónima, sin identificador. Hasta que responde no se carga nada.
// Sin conexión o con un bloqueador, no se envía nada y el juego sigue igual.
import { load, remove, save } from './storage.js'

const UMAMI = import.meta.env.UMAMI
/** Hay estadísticas configuradas y estamos en el dominio de producción: hay que pedir consentimiento. */
export const analyticsAvailable = !!UMAMI && location.hostname === UMAMI.domain

const DAY = 864e5
// Cuánto vale cada respuesta antes de volver a preguntar
const GRANTED_FOR = 730 * DAY // 24 meses
const DENIED_FOR = 7 * DAY

const DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
// Cada cuánto, como mucho, se recuerda a quien tiene las estadísticas bloqueadas que puede permitirlas
const BLOCKED_NOTICE_EVERY = 7 * DAY

let sessionGames = 0
// Estado del script de Umami: null (no se ha pedido), 'loading' o 'done' (cargado o fallido)
let script = null

/** Respuesta guardada, si sigue vigente: { granted, at, id } */
function consent() {
  const saved = load('consent', null)
  if (!saved) return null
  return Date.now() - saved.at < (saved.granted ? GRANTED_FOR : DENIED_FOR) ? saved : null
}

export const needsConsent = () => analyticsAvailable && !consent()
export const consentGranted = () => analyticsAvailable && !!consent()?.granted
const answered = () => analyticsAvailable && !!consent()

/** Guarda la respuesta del jugador y empieza a contar, con identificador o sin él. */
export function setConsent(granted) {
  if (!analyticsAvailable) return
  // Al renovar la aceptación se mantiene el identificador, para seguir sabiendo que es el mismo jugador
  const previous = load('consent', null)
  const id = granted ? (previous?.granted && previous.id) || crypto.randomUUID() : undefined
  save('consent', { granted, at: Date.now(), id })
  // Cambia de opinión en Ajustes sin recargar: la visita ya está contada, solo cambia el identificador
  if (window.umami) return identify()
  startAnalytics()
}

/**
 * Con permiso, manda el identificador. Sin él, lo olvida: el script de Umami no permite borrarlo, pero
 * identify() sí vacía la sesión que tiene guardada, y umamiBeforeSend descarta ese envío y quita el
 * identificador de los siguientes, que van a una sesión anónima nueva.
 */
function identify() {
  try {
    window.umami.identify(consentGranted() ? consent().id : {})
  } catch {
    // Nunca debe romper el juego
  }
}

// Umami lo llama antes de cada envío (data-before-send)
window.umamiBeforeSend = (type, payload) => {
  if (consentGranted()) return payload
  if (type === 'identify') return null
  const { id: _id, ...anonymous } = payload
  return anonymous
}

/** Carga el script de Umami si el jugador ya ha respondido. */
export function startAnalytics() {
  if (!answered() || script) return
  script = 'loading'
  const el = document.createElement('script')
  el.src = UMAMI.src
  el.dataset.websiteId = UMAMI.websiteId
  if (UMAMI.hostUrl) el.dataset.hostUrl = UMAMI.hostUrl
  el.dataset.domains = UMAMI.domain
  el.dataset.beforeSend = 'umamiBeforeSend'
  // Sin visita automática (saldría sin el identificador) ni eventos por atributos data-umami-event
  el.dataset.autoTrack = 'false'
  el.onload = () => {
    script = 'done'
    try {
      // La primera visita tiene que salir ya con el identificador, si lo hay
      if (consentGranted()) window.umami?.identify(consent().id)
      window.umami?.track()
    } catch {
      // Nunca debe romper el juego
    }
  }
  el.onerror = () => {
    script = 'done'
  }
  document.head.append(el)
}

export function track(name, data) {
  if (!answered()) return
  try {
    window.umami?.track(name, data)
  } catch {
    // Nunca debe romper el juego
  }
}

const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true

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
  })
}

/**
 * El jugador aceptó, hay conexión, el script terminó (de cargar o de fallar) y aun así Umami no está:
 * casi seguro un bloqueador.
 * Devuelve true como mucho una vez cada BLOCKED_NOTICE_EVERY, y apunta que ya se ha mostrado.
 */
export function shouldShowBlockedNotice() {
  if (!consentGranted() || script !== 'done' || !navigator.onLine || window.umami) return false
  if (Date.now() - load('blockedNoticeAt', 0) < BLOCKED_NOTICE_EVERY) return false
  save('blockedNoticeAt', Date.now())
  return true
}

// La versión anterior guardaba aquí la fecha de la primera partida y los días jugados, sin consentimiento
remove('player')
