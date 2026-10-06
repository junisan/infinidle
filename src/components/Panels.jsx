import Modal from './Modal.jsx'
import { LENGTHS, MAX_ATTEMPTS, MIN_ATTEMPTS } from '../lib/config.js'

function Example({ word, marks }) {
  return (
    <div className="example">
      {[...word].map((l, i) => (
        <div key={i} className={`tile filled small ${marks[i] ?? ''}`}>
          {l}
        </div>
      ))}
    </div>
  )
}

export function HelpPanel({ onClose, maxAttempts }) {
  return (
    <Modal title="Cómo jugar" onClose={onClose}>
      <p>
        Adivina la palabra en {maxAttempts} intentos. Cuando aciertes (o falles), pasas a la siguiente:{' '}
        <strong>las palabras no se acaban</strong>.
      </p>
      <p>Cada intento debe ser una palabra válida. Las tildes no cuentan: escribe ARBOL para «árbol».</p>
      <p>Pulsa una casilla de la fila actual para llevar allí el cursor y cambiar esa letra.</p>
      <Example word="HABER" marks={{ 0: 'correct' }} />
      <p>
        La <strong>H</strong> está en la palabra y en su sitio.
      </p>
      <Example word="AMBAR" marks={{ 2: 'present' }} />
      <p>
        La <strong>B</strong> está en la palabra pero en otra posición.
      </p>
      <Example word="AEREO" marks={{ 4: 'absent' }} />
      <p>
        La <strong>O</strong> no está en la palabra.
      </p>
      <p className="muted">Puedes jugar con 5, 6 o 7 letras y cambiar el número de intentos en Ajustes.</p>
      <p className="muted">
        Se recogen estadísticas de uso anónimas, sin cookies, para mejorar el juego y sus listas de palabras.
      </p>
    </Modal>
  )
}

export function StatsPanel({ onClose, stats, length, maxAttempts }) {
  const pct = stats.played ? Math.round((stats.won / stats.played) * 100) : 0
  const maxBar = Math.max(1, ...Object.values(stats.distribution))
  return (
    <Modal title={`Estadísticas · ${length} letras`} onClose={onClose}>
      <div className="stats">
        <div>
          <strong>{stats.played}</strong>
          <span>Jugadas</span>
        </div>
        <div>
          <strong>{pct}</strong>
          <span>% Victorias</span>
        </div>
        <div>
          <strong>{stats.streak}</strong>
          <span>Racha actual</span>
        </div>
        <div>
          <strong>{stats.maxStreak}</strong>
          <span>Mejor racha</span>
        </div>
      </div>
      <h3>Intentos para acertar</h3>
      <div className="distribution">
        {Array.from({ length: Math.max(maxAttempts, ...Object.keys(stats.distribution).map(Number)) }, (_, i) => {
          const n = stats.distribution[i + 1] ?? 0
          return (
            <div key={i} className="bar-row">
              <span>{i + 1}</span>
              <div className="bar" style={{ width: `${Math.max(7, (n / maxBar) * 100)}%` }}>
                {n}
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

export function SettingsPanel({ onClose, length, onLength, attempts, onAttempts, canChangeNow }) {
  return (
    <Modal title="Ajustes" onClose={onClose}>
      <div className="setting">
        <div>
          <strong>Letras</strong>
          <span className="muted">Cada modo guarda su partida y sus estadísticas.</span>
        </div>
        <div className="segmented">
          {LENGTHS.map((n) => (
            <button key={n} type="button" className={n === length ? 'selected' : ''} onClick={() => onLength(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="setting">
        <div>
          <strong>Intentos</strong>
          <span className="muted">
            {canChangeNow ? 'Se aplica a la partida actual.' : 'Se aplicará desde la siguiente palabra.'}
          </span>
        </div>
        <div className="stepper">
          <button type="button" onClick={() => onAttempts(-1)} disabled={attempts <= MIN_ATTEMPTS} aria-label="Menos intentos">
            −
          </button>
          <span>{attempts}</span>
          <button type="button" onClick={() => onAttempts(1)} disabled={attempts >= MAX_ATTEMPTS} aria-label="Más intentos">
            +
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function EndPanel({ onClose, won, solution, attempts, maxAttempts, stats, blockedNotice, onNext, onShare }) {
  return (
    <Modal title={won ? '¡Acertaste!' : 'Otra vez será'} onClose={onClose}>
      <p className="center muted">La palabra era</p>
      <p className="solution">{solution.toUpperCase()}</p>
      <p className="center muted">
        {won ? `En ${attempts} de ${maxAttempts} intentos · racha de ${stats.streak}` : `Racha a cero · mejor racha ${stats.maxStreak}`}
      </p>
      <a
        className="center link"
        href={`https://dle.rae.es/${encodeURIComponent(solution)}`}
        target="_blank"
        rel="noreferrer"
        data-umami-event="rae"
        data-umami-event-letras={solution.length}
      >
        Ver «{solution}» en el diccionario de la RAE
      </a>
      {blockedNotice && (
        <p className="center muted notice">
          Parece que algo en tu navegador bloquea las estadísticas anónimas del juego. Si te gusta INFINIDLE,
          permitirlas me ayuda a saber qué palabras sobran o faltan. Sin cookies y sin saber quién eres.
        </p>
      )}
      <div className="actions">
        <button type="button" className="button secondary" onClick={onShare}>
          Compartir
        </button>
        <button type="button" className="button primary" onClick={onNext} autoFocus>
          Siguiente palabra
        </button>
      </div>
    </Modal>
  )
}
