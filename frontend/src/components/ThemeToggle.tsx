import { useTheme } from '../theme'

const ICONS = {
  light: '🌙',
  warm: '🔥',
  dark: '☀️',
} as const

const LABELS = {
  light: 'Tema claro (tocar para cálido)',
  warm: 'Tema cálido (tocar para oscuro)',
  dark: 'Tema oscuro (tocar para claro)',
} as const

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme()

  return (
    <button
      onClick={cycleTheme}
      aria-label={LABELS[theme]}
      title={LABELS[theme]}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg warm:bg-amber-100 dark:bg-slate-800"
    >
      {ICONS[theme]}
    </button>
  )
}
