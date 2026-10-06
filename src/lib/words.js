/** Quita tildes y diéresis pero conserva la Ñ. Devuelve MAYÚSCULAS (el tablero va en mayúsculas). */
export function normalize(word) {
  return word
    .toLowerCase()
    .replace(/ñ/g, '@')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/@/g, 'ñ')
    .toUpperCase()
}

// Vite les pone un hash en el nombre al construir: si cambia una lista, cambia su dirección
const URLS = import.meta.glob('../words/es/*/*.txt', { query: '?url', import: 'default', eager: true })

const cache = new Map()
const ready = new Map()

async function fetchList(length, name) {
  const res = await fetch(URLS[`../words/es/${length}/${name}.txt`])
  if (!res.ok) throw new Error(`No se pudo cargar ${name}`)
  return res.text()
}

/** Reaprovecha la descarga que index.html lanza antes de que llegue React, si es del mismo modo. */
function fetchTexts(length) {
  const preload = window.__infinidlePreload
  if (preload?.length === length) {
    window.__infinidlePreload = null
    return preload.lists.catch(() => Promise.all([fetchList(length, 'solutions'), fetchList(length, 'valid')]))
  }
  return Promise.all([fetchList(length, 'solutions'), fetchList(length, 'valid')])
}

const lines = (text) => text.split('\n').map((w) => w.trim()).filter(Boolean)

/**
 * Carga solo las listas de una longitud (se piden al entrar en ese modo y se quedan en memoria).
 * - solutions: palabras a adivinar, con tildes (p. ej. "árbol")
 * - valid: Set de intentos aceptados en mayúsculas (p. ej. "ARBOL"); valid.txt ya viene normalizado
 */
export function loadWords(length) {
  if (!cache.has(length)) {
    const promise = fetchTexts(length).then(([solutionsText, validText]) => {
      const solutions = lines(solutionsText)
      const valid = new Set(lines(validText.toUpperCase()))
      solutions.forEach((s) => valid.add(normalize(s)))
      const words = { length, solutions, valid }
      ready.set(length, words)
      return words
    })
    promise.catch(() => cache.delete(length))
    cache.set(length, promise)
  }
  return cache.get(length)
}

/** Listas ya cargadas de una longitud, o null (lectura síncrona para el primer render). */
export const peekWords = (length) => ready.get(length) ?? null

/** Elige una solución al azar distinta de la anterior (sin historial: con ~2.000 por modo apenas se repiten). */
export function pickSolution(solutions, previous) {
  let word
  do word = solutions[Math.floor(Math.random() * solutions.length)]
  while (word === previous && solutions.length > 1)
  return word
}

/** Puntúa un intento como Wordle, gestionando letras repetidas. */
export function evaluate(guess, target) {
  const result = Array(guess.length).fill('absent')
  const remaining = {}
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === target[i]) result[i] = 'correct'
    else remaining[target[i]] = (remaining[target[i]] ?? 0) + 1
  }
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === 'correct') continue
    if (remaining[guess[i]] > 0) {
      result[i] = 'present'
      remaining[guess[i]]--
    }
  }
  return result
}

const RANK = { absent: 1, present: 2, correct: 3 }

/** Mejor estado conocido de cada letra, para colorear el teclado. */
export function keyStates(guesses, evaluations) {
  const states = {}
  guesses.forEach((guess, r) => {
    ;[...guess].forEach((letter, i) => {
      const s = evaluations[r][i]
      if (!states[letter] || RANK[s] > RANK[states[letter]]) states[letter] = s
    })
  })
  return states
}
