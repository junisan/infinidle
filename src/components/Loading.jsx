import { InfinityIcon } from './Icons.jsx'

/**
 * Pantalla de carga estilo Wordle: CARGANDO en fichas que se voltean en ola.
 * En móvil se dobla en un cuadrado CAR / GAN / DO∞ (la ficha ∞ solo se ve ahí).
 */
export default function Loading({ length }) {
  return (
    <div className="loading" role="status" aria-label={`Cargando palabras de ${length} letras`}>
      <div className="loading-grid">
        {[...'CARGANDO'].map((l, i) => (
          <div key={i} className="tile loading-tile" style={{ animationDelay: `${i * 110}ms` }}>
            {l}
          </div>
        ))}
        <div className="tile loading-inf" aria-hidden="true">
          <InfinityIcon />
        </div>
      </div>
      <p className="muted">Palabras de {length} letras</p>
    </div>
  )
}
