import { useState } from 'react'
import { InfinityIcon } from './Icons.jsx'

// INFINI se condensa en una sola ficha con ∞ para ahorrar espacio en la cabecera
const TILES = [<InfinityIcon key="inf" />, 'D', 'L', 'E']

/**
 * Logo alargado: las fichas [∞]DLE se voltean una a una (pasando por gris y ámbar hasta quedar
 * en verde azulado), como el guiño de Google al buscar WORDLE.
 * Se vuelve a animar al pulsarlo o cuando cambia `playKey`.
 */
export default function Wordmark({ playKey = 0 }) {
  const [clicks, setClicks] = useState(0)
  return (
    <button
      type="button"
      className="wordmark"
      aria-label="INFINIDLE"
      onClick={() => setClicks((c) => c + 1)}
      key={`${playKey}-${clicks}`}
    >
      {TILES.map((t, i) => (
        <span
          key={i}
          className={`wordmark-tile${i === 0 ? ' infinity' : ''}`}
          style={{ animationDelay: `${i * 140}ms` }}
          aria-hidden="true"
        >
          {t}
        </span>
      ))}
    </button>
  )
}
