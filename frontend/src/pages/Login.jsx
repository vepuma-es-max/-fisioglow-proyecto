
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password
        })

      if (error) throw error

      if (data.session) {
        onLogin?.(data.session)
      }
    } catch (error) {
      setMessage(
        'No se pudo iniciar sesión. Comprueba el correo y la contraseña.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-5"
      >
        <header>
          <h1 className="text-3xl font-bold text-teal-800">
            FISIOGLOW
          </h1>
          <p className="text-slate-500 mt-2">
            Sistema de Gestión de Rehabilitación
          </p>
        </header>

        <div>
          <label
            htmlFor="email"
            className="block font-medium mb-2"
          >
            Correo electrónico
          </label>

          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded-lg p-3"
            placeholder="usuario@correo.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block font-medium mb-2"
          >
            Contraseña
          </label>

          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded-lg p-3"
            placeholder="Ingresa tu contraseña"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
        <a
  href="/restablecer-clave"
  className="block text-center text-teal-700 underline"
>
  ¿Olvidaste tu contraseña?
</a>

        {message && (
          <p className="text-red-600 text-sm" role="alert">
            {message}
          </p>
        )}
      </form>
    </div>
  )
}
