
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function RestablecerClave() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [recoveryReady, setRecoveryReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event) => {
        if (!active) return

        if (event === 'PASSWORD_RECOVERY') {
          setRecoveryReady(true)
          setChecking(false)
          setMessage('')
        }
      })

    async function verificarEnlace() {
      const params = new URLSearchParams(
        window.location.search
      )

      const tokenHash = params.get('token_hash')
      const type = params.get('type')

      if (tokenHash && type === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery'
        })

        if (!active) return

        setRecoveryReady(!error)

        if (error) {
          setMessage('El enlace es inválido o expiró.')
        } else {
          window.history.replaceState(
            {},
            '',
            '/restablecer-clave'
          )
        }
      }

      if (active) setChecking(false)
    }

    verificarEnlace()

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function enviarCorreo(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:
          `${window.location.origin}/restablecer-clave`
      })

    setMessage(
      error
        ? `Error: ${error.message}`
        : 'Si el correo está registrado, recibirás un enlace para recuperar tu contraseña.'
    )

    setLoading(false)
  }

  async function guardarClave(e) {
    e.preventDefault()

    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({
      password
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      await supabase.auth.signOut()
      setRecoveryReady(false)
      setMessage(
        'Contraseña actualizada. Ya puedes iniciar sesión.'
      )
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <form
        onSubmit={recoveryReady ? guardarClave : enviarCorreo}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-5"
      >
        <h1 className="text-3xl font-bold text-teal-800">
          FISIOGLOW
        </h1>

        <h2 className="text-xl font-semibold">
          Recuperar contraseña
        </h2>

        {checking ? (
          <p>Verificando enlace...</p>
        ) : recoveryReady ? (
          <>
            <p>Introduce tu nueva contraseña.</p>

            <input
              type="password"
              required
              minLength={8}
              placeholder="Nueva contraseña"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border rounded-lg p-3"
            />

            <input
              type="password"
              required
              minLength={8}
              placeholder="Confirmar contraseña"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full border rounded-lg p-3"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-700 text-white rounded-lg p-3 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </>
        ) : (
          <>
            <p className="text-slate-600">
              Introduce el correo registrado en Supabase.
            </p>

            <input
              type="email"
              required
              placeholder="Correo electrónico"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border rounded-lg p-3"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-700 text-white rounded-lg p-3 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </>
        )}

        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}

        <a
          href="/"
          className="block text-center text-teal-700 underline"
        >
          Volver al inicio de sesión
        </a>
      </form>
    </main>
  )
}
