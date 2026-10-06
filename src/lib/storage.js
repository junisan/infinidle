const PREFIX = 'infinidle:v1:'

// Limpieza de la v0, que guardaba todas las soluciones ya jugadas
try {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX + 'seen:'))
    .forEach((k) => localStorage.removeItem(k))
} catch {
  // Sin acceso a localStorage
}

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Modo privado o almacenamiento lleno: el juego sigue funcionando sin persistir
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // Sin acceso a localStorage
  }
}

export const emptyStats = () => ({ played: 0, won: 0, streak: 0, maxStreak: 0, distribution: {} })

export function recordResult(stats, won, attempts) {
  const next = { ...stats, distribution: { ...stats.distribution } }
  next.played++
  if (won) {
    next.won++
    next.streak++
    next.maxStreak = Math.max(next.maxStreak, next.streak)
    next.distribution[attempts] = (next.distribution[attempts] ?? 0) + 1
  } else {
    next.streak = 0
  }
  return next
}
