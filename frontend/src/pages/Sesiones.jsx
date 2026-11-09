
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '')

function fechaHoraLocal() {
  const fecha = new Date()
  const offset = fecha.getTimezoneOffset() * 60000

  return new Date(fecha.getTime() - offset)
    .toISOString()
    .slice(0, 16)
}

function formularioInicial() {
  return {
    paciente_id: '',
    plan_id: '',
    fecha_sesion: fechaHoraLocal(),
    estado: 'programada',
    observaciones: ''
  }
}

function mostrarFecha(valor) {
  if (!valor) return 'Sin fecha'

  const fecha = new Date(valor)

  if (Number.isNaN(fecha.getTime())) {
    return 'Fecha inválida'
  }

  return fecha.toLocaleString('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

export default function Sesiones() {
  const [form, setForm] = useState(formularioInicial)
  const [pacientes, setPacientes] = useState([])
  const [tratamientos, setTratamientos] = useState([])
  const [sesiones, setSesiones] = useState([])

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [filtroPaciente, setFiltroPaciente] = useState('')

  const solicitar = useCallback(async (ruta, opciones = {}) => {
    const { data, error: errorSesion } =
      await supabase.auth.getSession()

    if (errorSesion) {
      throw new Error(errorSesion.message)
    }

    const token = data.session?.access_token

    if (!token) {
      throw new Error(
        'Tu sesión ha terminado. Inicia sesión nuevamente.'
      )
    }

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
      let detalle = contenido.detail

      if (Array.isArray(detalle)) {
        detalle = detalle.map((item) => item.msg).join('; ')
      }

      throw new Error(
        typeof detalle === 'string'
          ? detalle
          : `Error HTTP ${respuesta.status} en ${ruta}`
      )
    }

    return contenido
  }, [])

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError('')

    try {
      const [
        listaPacientes,
        listaTratamientos,
        listaSesiones
      ] = await Promise.all([
        solicitar('/api/v1/pacientes'),
        solicitar('/api/v1/tratamientos'),
        solicitar('/api/v1/sesiones')
      ])

      if (
        !Array.isArray(listaPacientes) ||
        !Array.isArray(listaTratamientos) ||
        !Array.isArray(listaSesiones)
      ) {
        throw new Error(
          'La API devolvió un formato de datos inesperado.'
        )
      }

      setPacientes(listaPacientes)
      setTratamientos(listaTratamientos)
      setSesiones(listaSesiones)

      return true
    } catch (err) {
      setError(
        err.message || 'No se pudieron cargar los datos.'
      )
      return false
    } finally {
      setCargando(false)
    }
  }, [solicitar])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  function actualizar(evento) {
    const { name, value } = evento.target

    setForm((anterior) => ({
      ...anterior,
      [name]: value,
      ...(name === 'paciente_id'
        ? { plan_id: '' }
        : {})
    }))
  }

  const planesDelPaciente = tratamientos.filter(
    (tratamiento) =>
      form.paciente_id !== '' &&
      Number(tratamiento.paciente_id) ===
        Number(form.paciente_id) &&
      tratamiento.estado !== 'finalizado'
  )

  function nombrePaciente(id) {
    const paciente = pacientes.find(
      (item) => Number(item.id) === Number(id)
    )

    return paciente
      ? `${paciente.nombres} ${paciente.apellidos}`
      : `Paciente #${id}`
  }

  function encontrarPlan(id) {
    return tratamientos.find(
      (plan) => Number(plan.id) === Number(id)
    )
  }

  async function guardarSesion(evento) {
    evento.preventDefault()
    setError('')
    setMensaje('')

    if (
      !form.paciente_id ||
      !form.plan_id ||
      !form.fecha_sesion
    ) {
      setError(
        'Selecciona un paciente, tratamiento y fecha.'
      )
      return
    }

    const plan = encontrarPlan(form.plan_id)

    if (
      !plan ||
      Number(plan.paciente_id) !== Number(form.paciente_id)
    ) {
      setError(
        'El tratamiento no corresponde al paciente seleccionado.'
      )
      return
    }

    if (plan.estado === 'finalizado') {
      setError(
        'No puedes registrar sesiones en un tratamiento finalizado.'
      )
      return
    }

    const fecha = new Date(form.fecha_sesion)

    if (Number.isNaN(fecha.getTime())) {
      setError('La fecha y hora no son válidas.')
      return
    }

    if (
      form.estado === 'programada' &&
      fecha.getTime() < Date.now()
    ) {
      setError(
        'Una sesión programada debe tener fecha futura. ' +
        'Para registrar una atención pasada, selecciona "Realizada".'
      )
      return
    }

    setGuardando(true)

    try {
      await solicitar('/api/v1/sesiones', {
        method: 'POST',
        body: JSON.stringify({
          plan_id: Number(form.plan_id),
          fecha_sesion: fecha.toISOString(),
          observaciones:
            form.observaciones.trim() || null,
          estado: form.estado
        })
      })

      const pacienteGuardado = form.paciente_id

      setForm({
        ...formularioInicial(),
        paciente_id: pacienteGuardado
      })

      setFiltroPaciente(pacienteGuardado)

      const actualizado = await cargarDatos()

      if (actualizado) {
        setMensaje(
          '¡Sesión registrada correctamente en Supabase!'
        )
      } else {
        setMensaje(
          'La API confirmó el registro. ' +
          'No se pudo actualizar el historial; intenta actualizarlo.'
        )
      }
    } catch (err) {
      setError(
        err.message || 'No se pudo guardar la sesión.'
      )
    } finally {
      setGuardando(false)
    }
  }

  const sesionesFiltradas = sesiones.filter((sesion) => {
    if (!filtroPaciente) return true

    const plan = encontrarPlan(sesion.plan_id)

    return (
      plan &&
      Number(plan.paciente_id) === Number(filtroPaciente)
    )
  })

  const sesionesRealizadas = sesiones.filter(
    (sesion) => sesion.estado === 'realizada'
  ).length

  return (
    <div className="p-6 md:p-9 space-y-7">

      <header>
        <h1 className="text-3xl font-bold text-teal-900">
          Sesiones de Rehabilitación
        </h1>

        <p className="text-slate-500 mt-2">
          FISIOGLOW 2.0 — Seguimiento fisioterapéutico
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4"
        >
          {error}
        </div>
      )}

      {mensaje && (
        <div
          role="status"
          className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4"
        >
          {mensaje}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-slate-500">
            Pacientes disponibles
          </p>
          <h2 className="text-3xl font-bold text-teal-800 mt-2">
            {cargando ? '...' : pacientes.length}
          </h2>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-slate-500">
            Sesiones cargadas
          </p>
          <h2 className="text-3xl font-bold text-teal-800 mt-2">
            {cargando ? '...' : sesiones.length}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Hasta 100 registros
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-slate-500">
            Sesiones realizadas cargadas
          </p>
          <h2 className="text-3xl font-bold text-teal-800 mt-2">
            {cargando ? '...' : sesionesRealizadas}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <section className="xl:col-span-2 bg-white border rounded-xl shadow-sm p-6">

          <h2 className="text-xl font-bold mb-6">
            🏥 Registrar sesión
          </h2>

          <form
            onSubmit={guardarSesion}
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
                <option value="">Seleccionar paciente</option>
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
                htmlFor="plan_id"
                className="block font-medium mb-2"
              >
                Plan de tratamiento *
              </label>

              <select
                id="plan_id"
                name="plan_id"
                value={form.plan_id}
                onChange={actualizar}
                required
                disabled={
                  cargando ||
                  guardando ||
                  !form.paciente_id
                }
                className="w-full border rounded-lg p-3 bg-white"
              >
                <option value="">
                  Seleccionar tratamiento
                </option>

                {planesDelPaciente.map((plan) => (
                  <option
                    key={plan.id}
                    value={plan.id}
                  >
                    Plan #{plan.id} — {plan.estado} —{' '}
                    {plan.objetivo.slice(0, 65)}
                  </option>
                ))}
              </select>

              {form.paciente_id &&
                planesDelPaciente.length === 0 &&
                !cargando && (
                  <p className="text-amber-700 text-sm mt-2">
                    Este paciente no tiene planes disponibles.
                    Registra primero un tratamiento.
                  </p>
                )}
            </div>

            <div>
              <label
                htmlFor="fecha_sesion"
                className="block font-medium mb-2"
              >
                Fecha y hora de la sesión *
              </label>

              <input
                id="fecha_sesion"
                name="fecha_sesion"
                type="datetime-local"
                value={form.fecha_sesion}
                onChange={actualizar}
                required
                disabled={cargando || guardando}
                className="w-full border rounded-lg p-3"
              />
            </div>

            <div>
              <label
                htmlFor="estado"
                className="block font-medium mb-2"
              >
                Estado de la sesión
              </label>

              <select
                id="estado"
                name="estado"
                value={form.estado}
                onChange={actualizar}
                disabled={cargando || guardando}
                className="w-full border rounded-lg p-3 bg-white"
              >
                <option value="programada">
                  Programada
                </option>
                <option value="realizada">
                  Realizada
                </option>
                <option value="cancelada">
                  Cancelada
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="observaciones"
                className="block font-medium mb-2"
              >
                Actividades y observaciones
              </label>

              <textarea
                id="observaciones"
                name="observaciones"
                value={form.observaciones}
                onChange={actualizar}
                maxLength={5000}
                rows={6}
                disabled={cargando || guardando}
                placeholder="Ejemplo: ejercicios de movilidad lumbar, estiramientos y tolerancia a la actividad (datos ficticios)"
                className="w-full border rounded-lg p-3"
              />
            </div>

            <button
              type="submit"
              disabled={
                cargando ||
                guardando ||
                pacientes.length === 0 ||
                planesDelPaciente.length === 0
              }
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg p-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando
                ? 'Guardando sesión...'
                : 'Guardar sesión'}
            </button>

          </form>
        </section>

        <aside className="bg-white border rounded-xl shadow-sm p-6 h-fit">

          <div className="flex justify-between items-center gap-3 mb-5">
            <h2 className="text-xl font-bold">
              📁 Historial de sesiones
            </h2>

            <button
              type="button"
              onClick={cargarDatos}
              disabled={cargando || guardando}
              className="text-sm border border-teal-700 text-teal-700 px-3 py-2 rounded-lg disabled:opacity-50"
            >
              Actualizar
            </button>
          </div>

          <label
            htmlFor="filtroPaciente"
            className="block font-medium text-sm mb-2"
          >
            Filtrar por paciente
          </label>

          <select
            id="filtroPaciente"
            value={filtroPaciente}
            onChange={(evento) =>
              setFiltroPaciente(evento.target.value)
            }
            className="w-full border rounded-lg p-3 bg-white mb-5"
          >
            <option value="">Todos los pacientes</option>
            {pacientes.map((paciente) => (
              <option
                key={paciente.id}
                value={paciente.id}
              >
                {paciente.nombres} {paciente.apellidos}
              </option>
            ))}
          </select>

          {cargando ? (
            <p className="text-slate-500">
              Cargando sesiones...
            </p>
          ) : sesionesFiltradas.length === 0 ? (
            <p className="text-slate-500">
              No hay sesiones registradas en esta vista.
            </p>
          ) : (
            <div className="space-y-4">
              {sesionesFiltradas.map((sesion) => {
                const plan = encontrarPlan(sesion.plan_id)

                return (
                  <article
                    key={sesion.id}
                    className="bg-slate-50 border rounded-xl p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <h3 className="font-bold text-teal-900">
                        Sesión #{sesion.id}
                      </h3>

                      <span className="text-xs bg-teal-100 text-teal-900 px-3 py-1 rounded-full">
                        {sesion.estado}
                      </span>
                    </div>

                    <p className="text-sm mt-3">
                      <strong>Paciente:</strong>{' '}
                      {plan
                        ? nombrePaciente(plan.paciente_id)
                        : 'Paciente no disponible'}
                    </p>

                    <p className="text-sm mt-2">
                      <strong>Tratamiento:</strong>{' '}
                      #{sesion.plan_id}
                    </p>

                    <p className="text-sm mt-2">
                      <strong>Fecha:</strong>{' '}
                      {mostrarFecha(sesion.fecha_sesion)}
                    </p>

                    <div className="mt-3">
                      <strong className="text-sm">
                        Observaciones:
                      </strong>

                      <p className="text-sm text-slate-700 whitespace-pre-wrap break-words mt-1">
                        {sesion.observaciones ||
                          'Sin observaciones'}
                      </p>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

        </aside>
      </div>
    </div>
  )
}
