
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '')

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    telefono: ''
  })

  async function solicitarAPI(ruta, opciones = {}) {
    const { data, error: errorSesion } =
      await supabase.auth.getSession()

    if (errorSesion || !data.session?.access_token) {
      throw new Error(
        'Tu sesión ha expirado. Inicia sesión nuevamente.'
      )
    }

    const respuesta = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          `Bearer ${data.session.access_token}`,
        ...opciones.headers
      }
    })

    const resultado = await respuesta.json().catch(
      () => null
    )

    if (!respuesta.ok) {
      if (respuesta.status === 401) {
        throw new Error(
          'Sesión inválida o expirada.'
        )
      }

      if (respuesta.status === 403) {
        throw new Error(
          'Tu cuenta no tiene permisos para esta operación.'
        )
      }

      if (respuesta.status === 422) {
        throw new Error(
          'Revisa los campos del formulario.'
        )
      }

      throw new Error(
        typeof resultado?.detail === 'string'
          ? resultado.detail
          : `Error de servidor (${respuesta.status})`
      )
    }

    return resultado
  }

  async function cargarPacientes(activo = () => true) {
    setCargando(true)
    setError('')

    try {
      const datos = await solicitarAPI(
        '/api/v1/pacientes'
      )

      if (activo()) {
        setPacientes(datos)
      }
    } catch (err) {
      if (activo()) {
        setError(err.message)
      }
    } finally {
      if (activo()) {
        setCargando(false)
      }
    }
  }

  useEffect(() => {
    let activo = true

    cargarPacientes(() => activo)

    return () => {
      activo = false
    }
  }, [])

  function actualizar(e) {
    setForm(anterior => ({
      ...anterior,
      [e.target.name]: e.target.value
    }))
  }

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    setMensaje('')

    try {
      const datos = {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        fecha_nacimiento:
          form.fecha_nacimiento || null,
        telefono: form.telefono.trim() || null
      }

      const nuevo = await solicitarAPI(
        '/api/v1/pacientes',
        {
          method: 'POST',
          body: JSON.stringify(datos)
        }
      )

      setPacientes(anterior => [
        nuevo,
        ...anterior
      ])

      setForm({
        nombres: '',
        apellidos: '',
        fecha_nacimiento: '',
        telefono: ''
      })

      setMensaje(
        'Paciente registrado correctamente en Supabase.'
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const filtrados = pacientes.filter(p =>
    `${p.nombres} ${p.apellidos}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  )

  return (
    <div className="p-6 md:p-10 space-y-7">
      <header>
        <h1 className="text-3xl font-bold text-teal-900">
          Gestión de Pacientes
        </h1>

        <p className="text-slate-500 mt-2">
          FISIOGLOW 2.0 — Módulo clínico
        </p>

        <p className="text-amber-700 text-sm mt-2">
          Entorno académico. Utiliza únicamente
          pacientes ficticios.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-xl font-bold mb-5">
            Registrar paciente
          </h2>

          <form onSubmit={guardar} className="space-y-4">
            <div>
              <label htmlFor="nombres" className="block mb-1">
                Nombres
              </label>
              <input
                id="nombres"
                name="nombres"
                required
                maxLength={100}
                value={form.nombres}
                onChange={actualizar}
                className="w-full border rounded-lg p-3"
                placeholder="Ejemplo: María"
              />
            </div>

            <div>
              <label htmlFor="apellidos" className="block mb-1">
                Apellidos
              </label>
              <input
                id="apellidos"
                name="apellidos"
                required
                maxLength={100}
                value={form.apellidos}
                onChange={actualizar}
                className="w-full border rounded-lg p-3"
                placeholder="Ejemplo: Pérez"
              />
            </div>

            <div>
              <label
                htmlFor="fecha_nacimiento"
                className="block mb-1"
              >
                Fecha de nacimiento
              </label>
              <input
                id="fecha_nacimiento"
                name="fecha_nacimiento"
                type="date"
                max={new Date().toLocaleDateString('en-CA')}
                value={form.fecha_nacimiento}
                onChange={actualizar}
                className="w-full border rounded-lg p-3"
              />
            </div>

            <div>
              <label htmlFor="telefono" className="block mb-1">
                Teléfono
              </label>
              <input
                id="telefono"
                name="telefono"
                maxLength={30}
                value={form.telefono}
                onChange={actualizar}
                className="w-full border rounded-lg p-3"
                placeholder="Número ficticio"
              />
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full bg-teal-700 text-white p-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {guardando
                ? 'Guardando...'
                : 'Guardar paciente'}
            </button>
          </form>

          {mensaje && (
            <p role="status" className="mt-4 text-teal-700">
              {mensaje}
            </p>
          )}

          {error && (
            <p role="alert" className="mt-4 text-red-600">
              {error}
            </p>
          )}
        </section>

        <section className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-xl font-bold mb-5">
            Pacientes registrados
          </h2>

          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre..."
            aria-label="Buscar pacientes"
            className="w-full border rounded-lg p-3 mb-4"
          />

          <p className="text-sm text-slate-500 mb-4">
            Registros cargados: {pacientes.length}
          </p>

          {cargando ? (
            <p>Cargando pacientes desde Supabase...</p>
          ) : filtrados.length === 0 ? (
            <p className="text-slate-500">
              No hay pacientes para mostrar.
            </p>
          ) : (
            <div className="space-y-3">
              {filtrados.map(p => (
                <article
                  key={p.id}
                  className="p-4 border rounded-lg"
                >
                  <h3 className="font-semibold">
                    {p.nombres} {p.apellidos}
                  </h3>

                  <p className="text-sm text-slate-500">
                    ID: {p.id}
                  </p>

                  <p className="text-sm text-slate-500">
                    Nacimiento: {p.fecha_nacimiento || 'No indicado'}
                  </p>

                  <p className="text-sm text-slate-500">
                    Teléfono: {p.telefono || 'No indicado'}
                  </p>
                </article>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => cargarPacientes()}
            disabled={cargando}
            className="mt-5 border border-teal-700 text-teal-800 px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Actualizar lista
          </button>
        </section>
      </div>
    </div>
  )
}
