import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Board, { FLIP_DURATION, FLIP_STAGGER } from './components/Board.jsx'
import Keyboard from './components/Keyboard.jsx'
import Loading from './components/Loading.jsx'
import Wordmark from './components/Wordmark.jsx'
import { HelpIcon, StatsIcon, SettingsIcon } from './components/Icons.jsx'
import { ConsentPanel, EndPanel, HelpPanel, SettingsPanel, StatsPanel } from './components/Panels.jsx'
import { MAX_ATTEMPTS, MIN_ATTEMPTS } from './lib/config.js'
import { evaluate, keyStates, loadWords, normalize, peekWords, pickSolution } from './lib/words.js'
import { emptyStats, load, recordResult, save } from './lib/storage.js'
import {
  consentGranted,
  needsConsent,
  setConsent,
  shouldShowBlockedNotice,
  track,
  trackGameEnd,
} from './lib/analytics.js'

const PRAISE = ['¡Genial!', '¡Magnífico!', '¡Impresionante!', '¡Espléndido!', '¡Muy bien!', '¡Bien!', '¡Por los pelos!']
const EMOJI = { correct: '🟩', present: '🟨', absent: '⬛' }

function newGame(length, maxAttempts, solutions, previous) {
  return { length, maxAttempts, solution: pickSolution(solutions, previous), guesses: [], status: 'playing' }
}

/** Partida guardada de ese modo (si su solución sigue en la lista) o una nueva. */
function restoreGame(words, maxAttempts) {
  const saved = load(`game:${words.length}`, null)
  return saved && words.solutions.includes(saved.solution) ? saved : newGame(words.length, maxAttempts, words.solutions)
}

// Fila en juego: una letra (o '') por casilla y la casilla donde escribe el cursor
const emptyInput = (length) => ({ letters: Array(length).fill(''), cursor: 0 })

/** Aplica una tecla a la fila en juego. Pura, para que pulsaciones muy seguidas no se pisen. */
function editInput({ letters, cursor }, key) {
  const len = letters.length
  const set = (i, l) => letters.map((x, j) => (j === i ? l : x))
  if (key === 'LEFT') return { letters, cursor: Math.max(0, cursor - 1) }
  if (key === 'RIGHT') return { letters, cursor: Math.min(len - 1, cursor + 1) }
  if (key === 'BACKSPACE') {
    // Borra la casilla del cursor si tiene letra; si no, retrocede y borra la anterior
    if (cursor < len && letters[cursor]) return { letters: set(cursor, ''), cursor }
    if (cursor > 0) return { letters: set(cursor - 1, ''), cursor: cursor - 1 }
    return { letters, cursor }
  }
  if (cursor < len) return { letters: set(cursor, key), cursor: cursor + 1 }
  return { letters, cursor }
}

export default function App() {
  const [settings, setSettings] = useState(() => load('settings', { length: 5, attempts: 6 }))
  const { length } = settings
  // main.jsx ya ha cargado las listas del modo guardado: el primer render pinta el tablero directamente
  const [words, setWords] = useState(() => peekWords(settings.length))
  const [error, setError] = useState(null)
  const [game, setGame] = useState(() => words && restoreGame(words, settings.attempts))
  const loadedLength = useRef(words ? settings.length : null)
  const [input, setInput] = useState(() => emptyInput(settings.length))
  const [busy, setBusy] = useState(false)
  // Copias síncronas de la fila y del bloqueo por animación: varias teclas pueden llegar antes del
  // siguiente render (p. ej. la última letra y Enter a la vez) y deben ver siempre el valor más reciente
  const inputRef = useRef(input)
  const busyRef = useRef(false)
  const changeInput = (next) => {
    inputRef.current = typeof next === 'function' ? next(inputRef.current) : next
    setInput(inputRef.current)
  }
  const changeBusy = (value) => {
    busyRef.current = value
    setBusy(value)
  }
  const [revealRow, setRevealRow] = useState(-1)
  const [bounceRow, setBounceRow] = useState(-1)
  const [shake, setShake] = useState(false)
  const [toasts, setToasts] = useState([])
  // Antes de jugar, si hay estadísticas configuradas, hay que responder si se aceptan; luego, la ayuda la primera vez
  const helpOrNothing = () => (load('seenHelp', false) ? null : 'help')
  const [panel, setPanel] = useState(() => (needsConsent() ? 'consent' : helpOrNothing()))
  const [consent, setConsentState] = useState(consentGranted)
  const [stats, setStats] = useState(() => load(`stats:${settings.length}`, emptyStats()))
  const [logoKey, setLogoKey] = useState(0)
  const [blockedNotice, setBlockedNotice] = useState(false)
  // Si en esta partida se ha usado lo de tocar una casilla para corregirla (va en las estadísticas)
  const editedTile = useRef(false)
  // Último intento rechazado: repetir Enter con la misma palabra no lo vuelve a contar
  const lastRejected = useRef(null)
  const timers = useRef([])
  // Los intentos solo afectan a partidas nuevas: el efecto de carga lo lee sin depender de él
  const attemptsRef = useRef(settings.attempts)
  useEffect(() => {
    attemptsRef.current = settings.attempts
  }, [settings.attempts])

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms))
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const toast = useCallback((text, ms = 1500) => {
    const id = Math.random()
    setToasts((t) => [...t, { id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms)
  }, [])

  useEffect(() => save('settings', settings), [settings])
  useEffect(() => {
    if (game) save(`game:${game.length}`, game)
  }, [game])

  // Carga las listas al cambiar de modo y recupera la partida guardada de ese modo
  useEffect(() => {
    if (loadedLength.current === length) return
    let cancelled = false
    loadWords(length)
      .then((w) => {
        if (cancelled) return
        loadedLength.current = length
        setWords(w)
        setError(null)
        setGame(restoreGame(w, attemptsRef.current))
        setStats(load(`stats:${length}`, emptyStats()))
        changeInput(emptyInput(length))
        editedTile.current = false
        setRevealRow(-1)
        setBounceRow(-1)
      })
      .catch((e) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [length])

  // Al cambiar de modo, hasta que llegan sus listas se muestra la pantalla de carga
  const ready = words?.length === length && game?.length === length

  const evaluations = useMemo(
    () => (game ? game.guesses.map((g) => evaluate(g, normalize(game.solution))) : []),
    [game],
  )
  const keyboardStates = useMemo(() => {
    if (!game) return {}
    const n = busy ? game.guesses.length - 1 : game.guesses.length
    return keyStates(game.guesses.slice(0, n), evaluations.slice(0, n))
  }, [game, evaluations, busy])

  const nextWord = useCallback(() => {
    if (!words) return
    setGame((g) => newGame(length, settings.attempts, words.solutions, g?.solution))
    changeInput(emptyInput(length))
    editedTile.current = false
    setRevealRow(-1)
    setBounceRow(-1)
    setPanel(null)
  }, [words, length, settings.attempts])

  const fail = (msg) => {
    toast(msg)
    setShake(true)
    later(() => setShake(false), 600)
  }

  const submit = () => {
    const word = inputRef.current.letters.join('')
    if (word.length < game.length) return fail('Faltan letras')
    if (!words.valid.has(word)) {
      // Las que más se rechacen son candidatas a entrar en la lista de intentos válidos
      if (lastRejected.current !== word) track('palabra_rechazada', { letras: game.length, palabra: word.toLowerCase() })
      lastRejected.current = word
      return fail('No está en la lista')
    }

    const target = normalize(game.solution)
    const guesses = [...game.guesses, word]
    const won = word === target
    const lost = !won && guesses.length >= game.maxAttempts
    const status = won ? 'won' : lost ? 'lost' : 'playing'
    const row = guesses.length - 1

    setGame({ ...game, guesses, status })
    changeInput(emptyInput(game.length))
    setRevealRow(row)
    changeBusy(true)

    const revealTime = (game.length - 1) * FLIP_STAGGER + FLIP_DURATION
    later(() => {
      changeBusy(false)
      setRevealRow(-1)
      if (status === 'playing') return
      const next = recordResult(stats, won, guesses.length)
      setStats(next)
      save(`stats:${game.length}`, next)
      trackGameEnd({
        length: game.length,
        maxAttempts: game.maxAttempts,
        won,
        attempts: guesses.length,
        solution: game.solution,
        editedTile: editedTile.current,
      })
      if (won) {
        setBounceRow(row)
        setLogoKey((k) => k + 1)
        toast(PRAISE[Math.min(row, PRAISE.length - 1)], 1400)
      } else {
        toast(game.solution.toUpperCase(), 2200)
      }
      later(() => {
        setBlockedNotice(shouldShowBlockedNotice())
        setPanel('end')
      }, won ? 1500 : 1800)
    }, revealTime)
  }

  const onKey = (key) => {
    if (!ready || busyRef.current) return
    if (game.status !== 'playing') {
      if (key === 'ENTER') nextWord()
      return
    }
    if (key === 'ENTER') return submit()
    changeInput((i) => editInput(i, key))
  }

  const selectTile = (cursor) => {
    if (busyRef.current) return
    editedTile.current = true
    changeInput((i) => ({ ...i, cursor }))
  }

  // Teclado físico (acepta letras con tilde y las normaliza)
  const onKeyRef = useRef(onKey)
  useEffect(() => {
    onKeyRef.current = onKey
  })
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || panel) return
      if (e.key === 'Enter') {
        e.preventDefault()
        onKeyRef.current('ENTER')
      } else if (e.key === 'Backspace') onKeyRef.current('BACKSPACE')
      else if (e.key === 'ArrowLeft') onKeyRef.current('LEFT')
      else if (e.key === 'ArrowRight') onKeyRef.current('RIGHT')
      else if (e.key.length === 1) {
        const k = normalize(e.key)
        if (/^[A-ZÑ]$/.test(k)) onKeyRef.current(k)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [panel])

  const share = async () => {
    const result = game.status === 'won' ? game.guesses.length : 'X'
    const grid = evaluations.map((row) => row.map((s) => EMOJI[s]).join('')).join('\n')
    const text = `INFINIDLE ${game.length} letras · ${result}/${game.maxAttempts}\n\n${grid}\n\n${location.origin}`
    try {
      const native = navigator.share && matchMedia('(pointer: coarse)').matches
      if (native) await navigator.share({ text })
      else {
        await navigator.clipboard.writeText(text)
        toast('Copiado al portapapeles')
      }
      track('compartir', {
        metodo: native ? 'nativo' : 'portapapeles',
        letras: game.length,
        resultado: game.status === 'won' ? 'ganada' : 'perdida',
      })
    } catch {
      // Compartir cancelado por el usuario
    }
  }

  const closePanel = useCallback(() => {
    setPanel((p) => {
      if (p === 'help') save('seenHelp', true)
      return null
    })
  }, [])

  const answerConsent = (granted) => {
    setConsent(granted)
    setConsentState(granted)
    setPanel(helpOrNothing())
  }

  const changeConsent = (granted) => {
    if (granted === consent) return
    setConsent(granted)
    setConsentState(granted)
  }

  const changeAttempts = (delta) => {
    const clamp = (n) => Math.min(MAX_ATTEMPTS, Math.max(MIN_ATTEMPTS, n + delta))
    setSettings((s) => ({ ...s, attempts: clamp(s.attempts) }))
    // Si aún no has jugado ningún intento, se aplica ya a la partida actual
    setGame((g) => (g && g.status === 'playing' && g.guesses.length === 0 ? { ...g, maxAttempts: clamp(g.maxAttempts) } : g))
  }

  const over = game && game.status !== 'playing'

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-side">
          <button type="button" className="icon-button" onClick={() => setPanel('help')} aria-label="Cómo jugar">
            <HelpIcon />
          </button>
          <button type="button" className="icon-button" onClick={() => setPanel('stats')} aria-label="Estadísticas">
            <StatsIcon />
          </button>
        </div>
        <Wordmark playKey={logoKey} />
        <div className="topbar-side right">
          <button
            type="button"
            className="mode-chip"
            onClick={() => setPanel('settings')}
            aria-label={`Ajustes: ${length} letras, ${settings.attempts} intentos`}
          >
            <SettingsIcon />
            <span>{length}</span>
          </button>
        </div>
      </header>

      <main className="play">
        <div className="toasts" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="toast">
              {t.text}
            </div>
          ))}
        </div>

        {error ? (
          <p className="status">
            {error}. <button onClick={() => location.reload()}>Reintentar</button>
          </p>
        ) : !ready ? (
          <Loading length={length} />
        ) : (
          <Board
            length={game.length}
            maxAttempts={game.maxAttempts}
            guesses={game.guesses}
            evaluations={evaluations}
            current={input.letters}
            cursor={input.cursor}
            onSelect={selectTile}
            revealRow={revealRow}
            bounceRow={bounceRow}
            shake={shake}
            playing={game.status === 'playing'}
          />
        )}

        {ready && over && !busy && panel !== 'end' && (
          <button type="button" className="button primary next" onClick={nextWord}>
            Siguiente palabra
          </button>
        )}
      </main>

      <Keyboard states={keyboardStates} onKey={onKey} />

      {panel === 'consent' && <ConsentPanel onAnswer={answerConsent} />}
      {panel === 'help' && <HelpPanel onClose={closePanel} maxAttempts={settings.attempts} />}
      {panel === 'stats' && (
        <StatsPanel onClose={closePanel} stats={stats} length={length} maxAttempts={settings.attempts} />
      )}
      {panel === 'settings' && (
        <SettingsPanel
          onClose={closePanel}
          length={length}
          onLength={(n) => {
            if (n !== length) track('cambio_letras', { de: length, a: n })
            setSettings((s) => ({ ...s, length: n }))
          }}
          attempts={settings.attempts}
          onAttempts={changeAttempts}
          canChangeNow={game?.status === 'playing' && game.guesses.length === 0}
          consent={consent}
          onConsent={changeConsent}
        />
      )}
      {panel === 'end' && game && over && (
        <EndPanel
          onClose={closePanel}
          won={game.status === 'won'}
          solution={game.solution}
          attempts={game.guesses.length}
          maxAttempts={game.maxAttempts}
          stats={stats}
          blockedNotice={blockedNotice}
          onNext={nextWord}
          onShare={share}
        />
      )}
    </div>
  )
}
