import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../auth'
import { useTheme } from '../theme'
import { ThemeToggle } from '../components/ThemeToggle'

const SCENE_COLOR = { light: '#eaf7f0', dark: '#071f1a' }

type Modo = 'login' | 'registro-cliente'

export function LoginPage() {
  const { tieneUsuarios, login, register, registerCliente } = useAuth()
  const { theme } = useTheme()
  const [modo, setModo] = useState<Modo>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const bootstrapStaff = tieneUsuarios === false

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
      if (bootstrapStaff) {
        await register(username, password)
      } else if (modo === 'registro-cliente') {
        await registerCliente({ username, password, nombre, telefono: telefono || undefined, direccion: direccion || undefined })
      } else {
        await login(username, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const cambiarModo = (nuevo: Modo) => {
    setModo(nuevo)
    setError('')
  }

  const esRegistroCliente = !bootstrapStaff && modo === 'registro-cliente'

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
              {bootstrapStaff
                ? 'Creá la cuenta de acceso a la app.'
                : esRegistroCliente
                  ? 'Creá tu cuenta de cliente para hacer pedidos.'
                  : 'Iniciá sesión para continuar.'}
            </p>
          </div>

          <label className="mb-3 block text-sm font-medium text-label">
            Usuario
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={bootstrapStaff || esRegistroCliente ? 3 : 1}
              autoFocus
              autoCapitalize="off"
              autoCorrect="off"
              className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
            />
          </label>

          {esRegistroCliente && (
            <label className="mb-3 block text-sm font-medium text-label">
              Nombre y apellido
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              />
            </label>
          )}

          <label className="mb-3 block text-sm font-medium text-label">
            Contraseña
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={bootstrapStaff || esRegistroCliente ? 8 : 1}
              className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
            />
            {(bootstrapStaff || esRegistroCliente) && (
              <span className="mt-1 block text-xs text-muted">Mínimo 8 caracteres.</span>
            )}
          </label>

          {esRegistroCliente && (
            <>
              <label className="mb-3 block text-sm font-medium text-label">
                Teléfono (opcional)
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
                />
              </label>
              <label className="mb-3 block text-sm font-medium text-label">
                Dirección (opcional)
                <input
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Calle, número, ciudad..."
                  className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
                />
              </label>
            </>
          )}

          {error && <p className="mb-4 rounded-md p-3 text-sm error-banner">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mb-3 w-full rounded-md py-2.5 text-sm font-bold uppercase tracking-wide btn-primary disabled:opacity-50"
          >
            {loading ? 'Un momento...' : bootstrapStaff ? 'Crear cuenta' : esRegistroCliente ? 'Crear cuenta' : 'Entrar'}
          </button>

          {!bootstrapStaff && (
            <button
              type="button"
              onClick={() => cambiarModo(modo === 'login' ? 'registro-cliente' : 'login')}
              className="w-full text-center text-sm link-accent"
            >
              {modo === 'login' ? '¿Sos cliente? Creá tu cuenta' : 'Ya tengo cuenta, iniciar sesión'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
