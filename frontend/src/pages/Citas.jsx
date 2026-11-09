
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '')

const formularioInicial = {
  paciente_id: '',
  fisioterapeuta_id: '',
  fecha_hora: '',
  motivo: ''
}

function mostrarFecha(fecha) {
  if (!fecha) return 'Sin fecha'

  const valor = new Date(fecha)

  if (Number.isNaN(valor.getTime())) {
    return 'Fecha inválida'
  }

  return valor.toLocaleString('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

export default function Citas() {
  const [form, setForm] = useState(formularioInicial)
  const [pacientes, setPacientes] = useState([])
  const [fisioterapeutas, setFisioterapeutas] = useState([])
  const [citas, setCitas] = useState([])

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  async function obtenerToken() {
    const { data, error: errorSesion } =
      await supabase.auth.getSession()

    if (errorSesion) {
      throw new Error(errorSesion.message)
    }

    const token = data.session?.access_token

    if (!token) {
      throw new Error(
        'Tu sesión no está activa. Inicia sesión nuevamente.'
      )
    }

    return token
  }

  async function solicitar(ruta, opciones = {}) {
    const token = await obtenerToken()

    const respuesta = await fetch(
      `${API_URL}${ruta}`,
      {
        ...opciones,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(opciones.headers || {})
        }
      }
    )

    const contenido = await respuesta.json().catch(
      () => ({})
    )

    if (!respuesta.ok) {
      throw new Error(
        typeof contenido.detail === 'string'
          ? contenido.detail
          : `Error HTTP ${respuesta.status}`
      )
    }

    return contenido
  }

  async function cargarDatos() {
    setCargando(true)
    setError('')

    try {
      const [
        listaPacientes,
        listaFisioterapeutas,
        listaCitas
      ] = await Promise.all([
        solicitar('/api/v1/pacientes'),
        solicitar('/api/v1/fisioterapeutas'),
        solicitar('/api/v1/citas')
      ])

      setPacientes(listaPacientes)
      setFisioterapeutas(listaFisioterapeutas)
      setCitas(listaCitas)

    } catch (err) {
      setError(
        err.message || 'No se pudieron cargar los datos.'
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  function actualizar(evento) {
    const { name, value } = evento.target

    setForm((anterior) => ({
      ...anterior,
      [name]: value
    }))
  }

  async function guardarCita(evento) {
    evento.preventDefault()
    setMensaje('')
    setError('')

    if (
      !form.paciente_id ||
      !form.fisioterapeuta_id ||
      !form.fecha_hora
    ) {
      setError('Completa los campos obligatorios.')
      return
    }

    const fecha = new Date(form.fecha_hora)

    if (
      Number.isNaN(fecha.getTime()) ||
      fecha.getTime() <= Date.now()
    ) {
      setError(
        'Selecciona una fecha y hora futuras.'
      )
      return
    }

    setGuardando(true)

    try {
      await solicitar('/api/v1/citas', {
        method: 'POST',
        body: JSON.stringify({
          paciente_id: Number(form.paciente_id),
          fisioterapeuta_id: Number(
            form.fisioterapeuta_id
          ),
          fecha_hora: fecha.toISOString(),
          motivo: form.motivo.trim() || null
        })
      })

      setForm(formularioInicial)

      setMensaje(
        '¡Cita registrada correctamente en Supabase!'
      )

      await cargarDatos()

    } catch (err) {
      setError(
        err.message || 'No se pudo registrar la cita.'
      )
    } finally {
      setGuardando(false)
    }
  }

  function nombrePaciente(id) {
    const paciente = pacientes.find(
      (p) => Number(p.id) === Number(id)
    )

    return paciente
      ? `${paciente.nombres} ${paciente.apellidos}`
      : `Paciente #${id}`
  }

  function nombreFisioterapeuta(id) {
    const profesional = fisioterapeutas.find(
      (p) => Number(p.id) === Number(id)
    )

    return profesional
      ? `${profesional.nombres} ${profesional.apellidos}`
      : `Fisioterapeuta #${id}`
  }

  return (
    <div className="p-6 md:p-9 space-y-7">

      <header>
        <h1 className="text-3xl font-bold text-teal-900">
          Gestión de Citas
        </h1>

        <p className="text-slate-500 mt-2">
          FISIOGLOW 2.0 — Agenda de rehabilitación
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-slate-500">
            Citas cargadas
          </p>

          <h2 className="text-3xl font-bold text-teal-800 mt-2">
            {citas.length}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Hasta 100 registros
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-slate-500">
            Pacientes disponibles
          </p>

          <h2 className="text-3xl font-bold text-teal-800 mt-2">
            {pacientes.length}
          </h2>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-slate-500">
            Fisioterapeutas disponibles
          </p>

          <h2 className="text-3xl font-bold text-teal-800 mt-2">
            {fisioterapeutas.length}
          </h2>
        </div>

      </div>

      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg"
        >
          {error}
        </div>
      )}

      {mensaje && (
        <div
          role="status"
          className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg"
        >
          {mensaje}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <section className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-5">
            📅 Programar nueva cita
          </h2>

          <form
            onSubmit={guardarCita}
            className="space-y-5"
          >

            <div>
              <label
                htmlFor="paciente_id"
                className="block font-medium mb-2"
              >
                Paciente *
              </label>

              <select
                id="paciente_id"
                name="paciente_id"
                value={form.paciente_id}
                onChange={actualizar}
                required
                disabled={cargando || guardando}
                className="w-full border rounded-lg p-3 bg-white"
              >
                <option value="">
                  Seleccionar paciente
                </option>

                {pacientes.map((paciente) => (
                  <option
                    key={paciente.id}
                    value={paciente.id}
                  >
                    {paciente.nombres} {paciente.apellidos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="fisioterapeuta_id"
                className="block font-medium mb-2"
              >
                Fisioterapeuta *
              </label>

              <select
                id="fisioterapeuta_id"
                name="fisioterapeuta_id"
                value={form.fisioterapeuta_id}
                onChange={actualizar}
                required
                disabled={cargando || guardando}
                className="w-full border rounded-lg p-3 bg-white"
              >
                <option value="">
                  Seleccionar fisioterapeuta
                </option>

                {fisioterapeutas.map((profesional) => (
                  <option
                    key={profesional.id}
                    value={profesional.id}
                  >
                    {profesional.nombres} {profesional.apellidos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="fecha_hora"
                className="block font-medium mb-2"
              >
                Fecha y hora *
              </label>

              <input
                id="fecha_hora"
                name="fecha_hora"
                type="datetime-local"
                value={form.fecha_hora}
                onChange={actualizar}
                required
                disabled={cargando || guardando}
                className="w-full border rounded-lg p-3"
              />
            </div>

            <div>
              <label
                htmlFor="motivo"
                className="block font-medium mb-2"
              >
                Motivo de consulta
              </label>

              <textarea
                id="motivo"
                name="motivo"
                value={form.motivo}
                onChange={actualizar}
                maxLength={500}
                rows={4}
                disabled={cargando || guardando}
                placeholder="Ejemplo: Evaluación inicial de movilidad"
                className="w-full border rounded-lg p-3"
              />
            </div>

            <button
              type="submit"
              disabled={
                cargando ||
                guardando ||
                pacientes.length === 0 ||
                fisioterapeutas.length === 0
              }
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg p-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando
                ? 'Guardando cita...'
                : 'Guardar cita'}
            </button>

          </form>
        </section>

        <section className="bg-white border rounded-xl p-6 shadow-sm">

          <div className="flex justify-between items-center gap-3 mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              📋 Citas programadas
            </h2>

            <button
              type="button"
              onClick={cargarDatos}
              disabled={cargando || guardando}
              className="border border-teal-700 text-teal-700 px-3 py-2 rounded-lg text-sm hover:bg-teal-50 disabled:opacity-50"
            >
              Actualizar
            </button>
          </div>

          {cargando ? (
            <p className="text-slate-500">
              Cargando información...
            </p>
          ) : citas.length === 0 ? (
            <p className="text-slate-500">
              No hay citas cargadas.
            </p>
          ) : (
            <div className="space-y-3">

              {citas.map((cita) => (
                <article
                  key={cita.id}
                  className="border rounded-xl p-4 bg-slate-50"
                >
                  <div className="flex justify-between gap-2">
                    <h3 className="font-bold text-teal-900">
                      Cita #{cita.id}
                    </h3>

                    <span className="text-xs bg-teal-100 text-teal-900 px-3 py-1 rounded-full">
                      {cita.estado}
                    </span>
                  </div>

                  <p className="mt-3 text-sm">
                    <strong>Paciente:</strong>{' '}
                    {nombrePaciente(cita.paciente_id)}
                  </p>

                  <p className="mt-2 text-sm">
                    <strong>Fisioterapeuta:</strong>{' '}
                    {nombreFisioterapeuta(
                      cita.fisioterapeuta_id
                    )}
                  </p>

                  <p className="mt-2 text-sm">
                    <strong>Fecha:</strong>{' '}
                    {mostrarFecha(cita.fecha_hora)}
                  </p>

                  <p className="mt-2 text-sm">
                    <strong>Motivo:</strong>{' '}
                    {cita.motivo || 'No especificado'}
                  </p>
                </article>
              ))}

            </div>
          )}

        </section>

      </div>
    </div>
  )
}
