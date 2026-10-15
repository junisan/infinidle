// Versión que se ve en Ajustes: la que se está ejecutando (la pone vite.config.js al compilar) y la que
// tiene guardada el service worker para jugar sin conexión.
const { commit, date } = import.meta.env.BUILD

export const appVersion = {
  commit: import.meta.env.PROD ? commit : 'desarrollo',
  date: new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)),
}

/** Commit de lo que hay guardado para jugar sin conexión, o null si aún no hay nada guardado. */
export async function offlineCommit() {
  if (!('serviceWorker' in navigator)) return null
  const registration = await navigator.serviceWorker.getRegistration()
  const worker = registration?.active
  if (!worker) return null
  return new Promise((resolve) => {
    const channel = new MessageChannel()
    channel.port1.onmessage = (event) => resolve(event.data.commit)
    worker.postMessage('version', [channel.port2])
    setTimeout(() => resolve(null), 1000)
  })
}
