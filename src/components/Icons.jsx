const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const HelpIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.7c0 1.7-2.4 2.2-2.4 3.8" />
    <path d="M12 17h.01" />
  </svg>
)

export const StatsIcon = () => (
  <svg {...base}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </svg>
)

export const SettingsIcon = () => (
  <svg {...base}>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </svg>
)

export const CloseIcon = () => (
  <svg {...base}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const EnterIcon = () => (
  <svg {...base}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)

export const BackspaceIcon = () => (
  <svg {...base}>
    <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z" />
    <path d="M17 9l-6 6M11 9l6 6" />
  </svg>
)

export const InfinityIcon = () => (
  <svg {...base} viewBox="0 0 24 24">
    <path d="M12 12c-1.8-2.6-3.4-3.8-5.2-3.8a3.8 3.8 0 0 0 0 7.6c1.8 0 3.4-1.2 5.2-3.8s3.4-3.8 5.2-3.8a3.8 3.8 0 0 1 0 7.6c-1.8 0-3.4-1.2-5.2-3.8Z" />
  </svg>
)
