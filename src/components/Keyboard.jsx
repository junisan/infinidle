import { BackspaceIcon, EnterIcon } from './Icons.jsx'

const ROWS = [[...'QWERTYUIOP'], [...'ASDFGHJKLÑ'], ['ENTER', ...'ZXCVBNM', 'BACKSPACE']]

export default function Keyboard({ states, onKey }) {
  return (
    <div className="keyboard" role="group" aria-label="Teclado">
      {ROWS.map((row, r) => (
        <div key={r} className="keyboard-row">
          {row.map((key) => {
            const special = key === 'ENTER' || key === 'BACKSPACE'
            return (
              <button
                key={key}
                type="button"
                className={`key${special ? ' wide' : ''}${states[key] ? ` ${states[key]}` : ''}`}
                onClick={(e) => {
                  e.currentTarget.blur()
                  onKey(key)
                }}
                aria-label={key === 'ENTER' ? 'Enviar' : key === 'BACKSPACE' ? 'Borrar' : key}
              >
                {key === 'ENTER' ? <EnterIcon /> : key === 'BACKSPACE' ? <BackspaceIcon /> : key}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
