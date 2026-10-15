// Final de la intro del arranque en frío (#intro en index.html). La parte animada con CSS dura INTRO_MS
// desde que se pinta: al acabar, y con React ya montado, el logo [∞]DLE vuela hasta el de la cabecera
// mientras el fondo se desvanece. Si se salta (tocar o tecla), solo un fundido rápido.
const INTRO_MS = 1240
const REDUCED_HOLD_MS = 600
const FLY_MS = 420
const SKIP_MS = 180

export function endIntro() {
  const intro = window.__infinidleIntro
  const element = document.getElementById('intro')
  if (!intro || !element) return
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  let ended = false

  const finish = () => {
    element.remove()
    document.documentElement.classList.remove('intro')
    intro.done()
  }
  const fade = (duration) => {
    if (ended) return
    ended = true
    element.animate({ opacity: 0 }, { duration, easing: 'ease-out', fill: 'forwards' }).finished.then(finish)
  }
  const fly = (target) => {
    if (ended) return
    ended = true
    const logo = element.querySelector('.intro-logo')
    const tiles = element.querySelectorAll('.intro-row span')
    const first = tiles[0].getBoundingClientRect()
    const last = tiles[tiles.length - 1].getBoundingClientRect()
    const box = logo.getBoundingClientRect()
    const to = target.getBoundingClientRect()
    // Centro de las 4 fichas que quedan: el logo se encoge alrededor de él hasta caer sobre la cabecera
    const cx = (first.left + last.right) / 2
    const cy = (first.top + first.bottom) / 2
    const scale = to.width / (last.right - first.left)
    logo.style.transformOrigin = `${cx - box.left}px ${cy - box.top}px`
    element.querySelector('.intro-wait').style.visibility = 'hidden'
    const easing = 'cubic-bezier(0.6, 0, 0.2, 1)'
    logo.animate(
      { transform: [`none`, `translate(${to.left + to.width / 2 - cx}px, ${to.top + to.height / 2 - cy}px) scale(${scale})`] },
      { duration: FLY_MS, easing, fill: 'forwards' },
    )
    element
      .animate({ backgroundColor: 'transparent' }, { duration: FLY_MS, easing, fill: 'forwards' })
      .finished.then(finish)
  }

  intro.onskip = () => fade(SKIP_MS)
  // React monta en la siguiente tarea: se espera a que esté el logo de la cabecera
  const whenMounted = (callback) => {
    const target = document.querySelector('.wordmark')
    if (target) callback(target)
    else requestAnimationFrame(() => whenMounted(callback))
  }
  whenMounted((target) => {
    if (intro.skipped) return fade(SKIP_MS)
    const wait = (reduced ? REDUCED_HOLD_MS : INTRO_MS) - (performance.now() - intro.start)
    setTimeout(() => (reduced ? fade(300) : fly(target)), Math.max(0, wait))
  })
}
