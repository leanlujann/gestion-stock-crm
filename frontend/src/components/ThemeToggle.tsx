import { useTheme } from '../theme'

const ICONS = {
  light: '🌙',
  dark: '☀️',
} as const

const LABELS = {
  light: 'Tema claro (tocar para oscuro)',
  dark: 'Tema oscuro (tocar para claro)',
} as const

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme()

  return (
    <button
      onClick={cycleTheme}
      aria-label={LABELS[theme]}
      title={LABELS[theme]}
      className="flex h-9 w-9 items-center justify-center rounded-full text-lg surface-muted"
    >
      {ICONS[theme]}
    </button>
  )
}
