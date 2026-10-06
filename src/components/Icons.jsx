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

// Logo de GitHub (Octicons mark-github): relleno, no trazo como los demás
export const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
  </svg>
)
