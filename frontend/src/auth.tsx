import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, authStorage, setUnauthorizedHandler } from './api/client'

export type Rol = 'STAFF' | 'CLIENTE'

interface DatosRegistroCliente {
  username: string
  password: string
  nombre: string
  telefono?: string
  direccion?: string
}

interface AuthContextValue {
  autenticado: boolean
  username: string | null
  role: Rol | null
  clienteId: string | null
  cargando: boolean
  tieneUsuarios: boolean | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  registerCliente: (datos: DatosRegistroCliente) => Promise<void>
  logout: () => void
}

interface RespuestaAuth {
  token: string
  username: string
  role: Rol
  clienteId: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

function decodificarToken(token: string) {
  const payload = JSON.parse(atob(token.split('.')[1]))
  return {
    username: payload.username as string,
    role: payload.role as Rol,
    clienteId: (payload.clienteId as string | null) ?? null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null)
  const [role, setRole] = useState<Rol | null>(null)
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [tieneUsuarios, setTieneUsuarios] = useState<boolean | null>(null)

  const cerrarSesion = () => {
    authStorage.clear()
    setUsername(null)
    setRole(null)
    setClienteId(null)
  }

  const aplicarSesion = (r: RespuestaAuth) => {
    authStorage.setToken(r.token)
    setUsername(r.username)
    setRole(r.role)
    setClienteId(r.clienteId)
    setTieneUsuarios(true)
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
      const datos = decodificarToken(token)
      setUsername(datos.username)
      setRole(datos.role)
      setClienteId(datos.clienteId)
    } catch {
      authStorage.clear()
    }
    setCargando(false)
  }, [])

  const login = async (usernameInput: string, password: string) => {
    const r = await api.post<RespuestaAuth>('/auth/login', { username: usernameInput, password })
    aplicarSesion(r)
  }

  const register = async (usernameInput: string, password: string) => {
    const r = await api.post<RespuestaAuth>('/auth/register', { username: usernameInput, password })
    aplicarSesion(r)
  }

  const registerCliente = async (datos: DatosRegistroCliente) => {
    const r = await api.post<RespuestaAuth>('/auth/register', datos)
    aplicarSesion(r)
  }

  return (
    <AuthContext.Provider
      value={{
        autenticado: !!username,
        username,
        role,
        clienteId,
        cargando,
        tieneUsuarios,
        login,
        register,
        registerCliente,
        logout: cerrarSesion,
      }}
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
