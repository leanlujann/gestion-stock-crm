import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../auth'
import { useTheme } from '../theme'
import { ThemeToggle } from '../components/ThemeToggle'

const SCENE_COLOR = { light: '#eaf7f0', dark: '#071f1a' }

export function LoginPage() {
  const { tieneUsuarios, login, register } = useAuth()
  const { theme } = useTheme()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const esRegistro = tieneUsuarios === false

  useEffect(() => {
    document.documentElement.setAttribute('data-scene', 'stock')
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', SCENE_COLOR[theme])
  }, [theme])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (esRegistro) {
        await register(username, password)
      } else {
        await login(username, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-dvh flex-col app-bg">
      <div className="bg-scene bg-scene-stock" aria-hidden="true" />

      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center p-4 pb-20">
        <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg p-6 surface">
          <div className="mb-5 flex flex-col items-center text-center">
            <span className="mb-2 text-3xl" aria-hidden="true">📦</span>
            <h1 className="heading-display text-lg">Gestión de Stock</h1>
            <p className="mt-1 text-sm text-secondary">
              {esRegistro ? 'Creá la cuenta de acceso a la app.' : 'Iniciá sesión para continuar.'}
            </p>
          </div>

          <label className="mb-3 block text-sm font-medium text-label">
            Usuario
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={esRegistro ? 3 : 1}
              autoFocus
              autoCapitalize="off"
              autoCorrect="off"
              className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
            />
          </label>

          <label className="mb-4 block text-sm font-medium text-label">
            Contraseña
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={esRegistro ? 8 : 1}
              className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
            />
            {esRegistro && <span className="mt-1 block text-xs text-muted">Mínimo 8 caracteres.</span>}
          </label>

          {error && <p className="mb-4 rounded-md p-3 text-sm error-banner">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md py-2.5 text-sm font-bold uppercase tracking-wide btn-primary disabled:opacity-50"
          >
            {loading ? 'Un momento...' : esRegistro ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
