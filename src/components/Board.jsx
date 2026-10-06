export const FLIP_STAGGER = 280
export const FLIP_DURATION = 500

function Tile({ letter, state, reveal, index, bounce, active, onSelect }) {
  const classes = ['tile']
  if (letter) classes.push('filled')
  if (state) classes.push(state)
  if (reveal) classes.push('reveal')
  if (bounce) classes.push('bounce')
  if (active) classes.push('active')
  if (onSelect) classes.push('selectable')
  const style = reveal
    ? { animationDelay: `${index * FLIP_STAGGER}ms` }
    : bounce
      ? { animationDelay: `${index * 90}ms` }
      : undefined
  return (
    <div className={classes.join(' ')} style={style} onClick={onSelect && (() => onSelect(index))}>
      {letter}
    </div>
  )
}

/**
 * `current` es un array con una letra (o '') por casilla de la fila en juego y `cursor` la casilla activa:
 * pulsar una casilla de esa fila mueve ahí el cursor para sobrescribirla.
 */
export default function Board({
  length,
  maxAttempts,
  guesses,
  evaluations,
  current,
  cursor,
  onSelect,
  revealRow,
  shake,
  bounceRow,
  playing,
}) {
  const rows = []
  for (let r = 0; r < maxAttempts; r++) {
    const guess = guesses[r]
    const isCurrent = playing && r === guesses.length
    const letters = guess ?? (isCurrent ? current : [])
    rows.push(
      <div key={r} className={`row${isCurrent && shake ? ' shake' : ''}`}>
        {Array.from({ length }, (_, i) => (
          <Tile
            key={i}
            index={i}
            letter={letters[i] ?? ''}
            state={guess ? evaluations[r][i] : null}
            reveal={guess && r === revealRow}
            bounce={r === bounceRow}
            active={isCurrent && i === cursor}
            onSelect={isCurrent ? onSelect : undefined}
          />
        ))}
      </div>,
    )
  }
  return (
    <div className="board" style={{ '--len': length, '--rows': maxAttempts }} role="grid" aria-label="Tablero">
      {rows}
    </div>
  )
}
