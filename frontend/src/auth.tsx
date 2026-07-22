import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, authStorage, setUnauthorizedHandler } from './api/client'

interface AuthContextValue {
  autenticado: boolean
  username: string | null
  cargando: boolean
  tieneUsuarios: boolean | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [tieneUsuarios, setTieneUsuarios] = useState<boolean | null>(null)

  const cerrarSesion = () => {
    authStorage.clear()
    setUsername(null)
  }

  useEffect(() => {
    setUnauthorizedHandler(cerrarSesion)
    const token = authStorage.getToken()
    if (!token) {
      api
        .get<{ tieneUsuarios: boolean }>('/auth/estado')
        .then((r) => setTieneUsuarios(r.tieneUsuarios))
        .catch(() => setTieneUsuarios(true))
        .finally(() => setCargando(false))
      return
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUsername(payload.username ?? null)
    } catch {
      authStorage.clear()
    }
    setCargando(false)
  }, [])

  const login = async (usernameInput: string, password: string) => {
    const r = await api.post<{ token: string; username: string }>('/auth/login', {
      username: usernameInput,
      password,
    })
    authStorage.setToken(r.token)
    setUsername(r.username)
    setTieneUsuarios(true)
  }

  const register = async (usernameInput: string, password: string) => {
    const r = await api.post<{ token: string; username: string }>('/auth/register', {
      username: usernameInput,
      password,
    })
    authStorage.setToken(r.token)
    setUsername(r.username)
    setTieneUsuarios(true)
  }

  return (
    <AuthContext.Provider
      value={{ autenticado: !!username, username, cargando, tieneUsuarios, login, register, logout: cerrarSesion }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
