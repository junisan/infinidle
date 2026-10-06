import { useEffect } from 'react'
import { CloseIcon } from './Icons.jsx'

/** Sin onClose no se puede cerrar (ni con Escape ni tocando fuera): hay que usar sus botones. */
export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    if (!onClose) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{title}</h2>
          {onClose && (
            <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar">
              <CloseIcon />
            </button>
          )}
        </header>
        {children}
      </div>
    </div>
  )
}
