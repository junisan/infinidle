#!/usr/bin/env node
/**
 * Genera las listas de palabras que consume la app (public/words/es/).
 *
 *   node scripts/build-words.mjs          # usa la caché de scripts/.cache si existe
 *   node scripts/build-words.mjs --fresh  # vuelve a descargar las fuentes
 *
 * Fuentes:
 *  - RAE (lemas, con tildes): JorgeDuenasLerin/diccionario-espanol-txt
 *  - Formas flexionadas (plurales, conjugaciones, sin tildes): words/an-array-of-spanish-words
 *  - Frecuencia de uso (subtítulos, con tildes): hermitdave/FrequencyWords
 *
 * Salida por longitud N (5, 6, 7):
 *  - public/words/es/N/solutions.txt  → palabras a adivinar (con tildes), lemas comunes
 *  - public/words/es/N/valid.txt      → palabras aceptadas como intento (normalizadas)
 */
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = join(ROOT, 'scripts/.cache')
const OUT = join(ROOT, 'public/words/es')

const LENGTHS = [5, 6, 7]
// Máximo de soluciones por longitud (las más frecuentes primero)
const MAX_SOLUTIONS = 2500
// Apariciones mínimas en el corpus de frecuencia para ser solución
const MIN_FREQ = 150

const SOURCES = {
  rae: 'https://raw.githubusercontent.com/JorgeDuenasLerin/diccionario-espanol-txt/master/data/allwords.txt',
  forms: 'https://raw.githubusercontent.com/words/an-array-of-spanish-words/master/index.json',
  freq: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt',
}

const fresh = process.argv.includes('--fresh')

async function fetchCached(name, url) {
  const file = join(CACHE, name)
  if (!fresh) {
    try {
      await stat(file)
      return readFile(file, 'utf8')
    } catch {}
  }
  console.log(`↓ ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} al descargar ${url}`)
  const text = await res.text()
  await mkdir(CACHE, { recursive: true })
  await writeFile(file, text)
  return text
}

/** Quita tildes y diéresis pero conserva la Ñ. Devuelve minúsculas. */
export function normalize(word) {
  return word
    .toLowerCase()
    .replace(/ñ/g, '@')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/@/g, 'ñ')
}

const SPANISH_WORD = /^[a-zñáéíóúü]+$/
// Extranjerismos que el listado RAE incluye (crack, maxwell, show, sprint…): válidos como intento, nunca solución
const FOREIGN = /[kw]|ck|sh|th|tt|ss|ff|pp|gg|bb|dd|zz|oo|ee|uu|[^aeiouáéíóúdjlnrsxyz]$|^[^aeiouáéíóú]*$|y[^aeiou]/
const BOARD_WORD = /^[a-zñ]+$/

/** "cantarero, ra" → [cantarero, cantarera]; "casado, da" → [casado, casada]; "cantarín, na" → [cantarín, cantarina] */
function expandRaeEntry(line) {
  const entry = line.trim()
  // Fuera afijos ("-áceo") y nombres propios/siglas ("David", "ABS")
  if (!entry || entry.startsWith('-') || entry.endsWith('-') || entry[0] !== entry[0].toLowerCase()) return []
  const m = entry.match(/^([^,\s]+),\s*([^,\s]+)$/)
  if (!m) return entry.includes(' ') ? [] : [entry]
  const [, masc, suffix] = m
  const plain = normalize(masc)
  const suf = normalize(suffix)
  // Busca el punto de corte: la terminación femenina sustituye a partir de la última vocal/consonante coincidente
  let fem = null
  for (let cut = plain.length; cut >= 0; cut--) {
    if (plain.slice(cut - 1, cut) === suf[0]) {
      fem = plain.slice(0, cut - 1) + suf
      break
    }
  }
  // Masculinos terminados en consonante (cantarín → cantarina, español → española)
  if (!fem || fem.length < plain.length) fem = plain + suf.slice(-1)
  return [masc, fem]
}

async function main() {
  const [raeText, formsText, freqText] = await Promise.all([
    fetchCached('rae.txt', SOURCES.rae),
    fetchCached('forms.json', SOURCES.forms),
    fetchCached('freq.txt', SOURCES.freq),
  ])

  // Frecuencia por grafía exacta: así "olera" (lema raro) no hereda la frecuencia de "olerá"
  const freq = new Map()
  for (const line of freqText.split('\n')) {
    const [word, count] = line.trim().split(' ')
    if (word && SPANISH_WORD.test(word)) freq.set(word, Number(count))
  }

  // Lemas RAE (con tildes) → candidatos a solución
  const lemmas = new Map() // normalizada → con tildes
  for (const line of raeText.split('\n')) {
    for (const w of expandRaeEntry(line)) {
      const lower = w.toLowerCase()
      if (!SPANISH_WORD.test(lower)) continue
      const n = normalize(lower)
      if (!lemmas.has(n)) lemmas.set(n, lower)
    }
  }

  const forms = JSON.parse(formsText)
  const blocklist = new Set(
    (await readFile(join(ROOT, 'scripts/blocklist.txt'), 'utf8').catch(() => ''))
      .split('\n')
      .map((l) => normalize(l.trim()))
      .filter((l) => l && !l.startsWith('#')),
  )

  for (const len of LENGTHS) {
    const valid = new Set()
    const add = (w) => {
      const n = normalize(w)
      if (n.length === len && BOARD_WORD.test(n)) valid.add(n)
    }
    forms.forEach(add)
    lemmas.forEach((_, n) => add(n))

    const solutions = [...lemmas.entries()]
      // Fuera imperativos plurales ("mirad", "formad") que el listado trae como entradas
      .filter(([n]) => !(n.endsWith('d') && lemmas.has(n.slice(0, -1) + 'r')))
      .filter(([n]) => !FOREIGN.test(n))
      .filter(([n, w]) => n.length === len && BOARD_WORD.test(n) && !blocklist.has(n) && (freq.get(w) ?? 0) >= MIN_FREQ)
      .sort(([, a], [, b]) => freq.get(b) - freq.get(a))
      .slice(0, MAX_SOLUTIONS)
      .map(([, w]) => w)

    solutions.forEach(add)

    const dir = join(OUT, String(len))
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'solutions.txt'), solutions.sort((a, b) => a.localeCompare(b, 'es')).join('\n') + '\n')
    await writeFile(join(dir, 'valid.txt'), [...valid].sort().join('\n') + '\n')
    console.log(`${len} letras → ${solutions.length} soluciones, ${valid.size} válidas`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
