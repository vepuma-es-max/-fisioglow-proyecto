
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Login from '../pages/Login'
import RestablecerClave from '../pages/RestablecerClave'

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return

      if (error) {
        console.error('Error al verificar sesión:', error.message)
      }

      setSession(error ? null : data.session)
      setLoading(false)
    })

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, newSession) => {
        if (active) {
          setSession(newSession)
          setLoading(false)
        }
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function logout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert('No se pudo cerrar la sesión.')
    }
  }

  // Mostrar recuperación de contraseña independientemente
  // de si existe una sesión de usuario.
  if (window.location.pathname === '/restablecer-clave') {
    return <RestablecerClave />
  }

  if (loading) {
    return <p>Verificando sesión de FISIOGLOW...</p>
  }

  if (!session) {
    return <Login onLogin={setSession} />
  }

  return (
    <>
      <div className="bg-teal-700 text-white p-4 flex justify-between">
        <span>FISIOGLOW — Sesión activa</span>

        <button onClick={logout}>
          Cerrar sesión
        </button>
      </div>

      {children}
    </>
  )
}
