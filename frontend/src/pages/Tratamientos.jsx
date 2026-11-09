
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '')

function fechaLocal() {
  const fecha = new Date()
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')

  return `${anio}-${mes}-${dia}`
}

function formularioInicial() {
  return {
    paciente_id: '',
    evaluacion_id: '',
    objetivo: '',
    fecha_inicio: fechaLocal(),
    estado: 'activo'
  }
}

function formatearFecha(valor) {
  if (!valor) return 'Sin fecha'

  const fecha = new Date(`${valor}T12:00:00`)

  if (Number.isNaN(fecha.getTime())) {
    return valor
  }

  return fecha.toLocaleDateString('es-BO')
}

export default function Tratamientos() {
  const [form, setForm] = useState(formularioInicial)
  const [pacientes, setPacientes] = useState([])
  const [evaluaciones, setEvaluaciones] = useState([])
  const [tratamientos, setTratamientos] = useState([])

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [filtroPaciente, setFiltroPaciente] = useState('')

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
      let detalle = contenido.detail

      if (Array.isArray(detalle)) {
        detalle = detalle
          .map((item) => item.msg)
          .join('; ')
      }

      throw new Error(
        typeof detalle === 'string'
          ? detalle
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
        listaEvaluaciones,
        listaTratamientos
      ] = await Promise.all([
        solicitar('/api/v1/pacientes'),
        solicitar('/api/v1/evaluaciones'),
        solicitar('/api/v1/tratamientos')
      ])

      if (
        !Array.isArray(listaPacientes) ||
        !Array.isArray(listaEvaluaciones) ||
        !Array.isArray(listaTratamientos)
      ) {
        throw new Error(
          'La API devolvió datos en un formato inesperado.'
        )
      }

      setPacientes(listaPacientes)
      setEvaluaciones(listaEvaluaciones)
      setTratamientos(listaTratamientos)

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
      [name]: value,
      ...(name === 'paciente_id'
        ? { evaluacion_id: '' }
        : {})
    }))
  }

  const evaluacionesPaciente = evaluaciones.filter(
    (e) =>
      form.paciente_id !== '' &&
      Number(e.paciente_id) === Number(form.paciente_id)
  )

  async function guardarTratamiento(evento) {
    evento.preventDefault()

    setError('')
    setMensaje('')

    if (
      !form.paciente_id ||
      !form.objetivo.trim() ||
      !form.fecha_inicio
    ) {
      setError(
        'Completa el paciente, objetivo y fecha de inicio.'
      )
      return
    }

    setGuardando(true)

    try {
      await solicitar('/api/v1/tratamientos', {
        method: 'POST',
        body: JSON.stringify({
          paciente_id: Number(form.paciente_id),
          evaluacion_id: form.evaluacion_id
            ? Number(form.evaluacion_id)
            : null,
          objetivo: form.objetivo.trim(),
          fecha_inicio: form.fecha_inicio,
          estado: form.estado
        })
      })

      const pacienteGuardado = form.paciente_id

      setForm({
        ...formularioInicial(),
        paciente_id: pacienteGuardado
      })

      setFiltroPaciente(pacienteGuardado)

      setMensaje(
        '¡Tratamiento registrado correctamente en Supabase!'
      )

      await cargarDatos()

    } catch (err) {
      setError(
        err.message || 'No se pudo guardar el tratamiento.'
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

  const tratamientosFiltrados = tratamientos.filter(
    (tratamiento) =>
      !filtroPaciente ||
      Number(tratamiento.paciente_id) ===
        Number(filtroPaciente)
  )

  const tratamientosActivos = tratamientos.filter(
    (tratamiento) => tratamiento.estado === 'activo'
  ).length

  return (
    <div className="p-6 md:p-9 space-y-7">

      <header>
        <h1 className="text-3xl font-bold text-teal-900">
          Gestión de Tratamientos
        </h1>

        <p className="text-slate-500 mt-2">
          FISIOGLOW 2.0 — Planes de rehabilitación
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
            Tratamientos cargados
          </p>

          <h2 className="text-3xl font-bold text-teal-800 mt-2">
            {cargando ? '...' : tratamientos.length}
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            Hasta 100 registros
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-slate-500">
            Tratamientos activos cargados
          </p>

          <h2 className="text-3xl font-bold text-teal-800 mt-2">
            {cargando ? '...' : tratamientosActivos}
          </h2>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <section className="xl:col-span-2 bg-white border rounded-xl p-6 shadow-sm">

          <h2 className="text-xl font-bold mb-6">
            🩺 Nuevo plan de rehabilitación
          </h2>

          <form
            onSubmit={guardarTratamiento}
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
                htmlFor="evaluacion_id"
                className="block font-medium mb-2"
              >
                Evaluación relacionada (opcional)
              </label>

              <select
                id="evaluacion_id"
                name="evaluacion_id"
                value={form.evaluacion_id}
                onChange={actualizar}
                disabled={
                  cargando ||
                  guardando ||
                  !form.paciente_id
                }
                className="w-full border rounded-lg p-3 bg-white"
              >
                <option value="">
                  Sin evaluación relacionada
                </option>

                {evaluacionesPaciente.map((evaluacion) => (
                  <option
                    key={evaluacion.id}
                    value={evaluacion.id}
                  >
                    Evaluación #{evaluacion.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="objetivo"
                className="block font-medium mb-2"
              >
                Objetivo terapéutico *
              </label>

              <textarea
                id="objetivo"
                name="objetivo"
                value={form.objetivo}
                onChange={actualizar}
                required
                minLength={3}
                maxLength={3000}
                disabled={cargando || guardando}
                rows={5}
                placeholder="Ejemplo: mejorar progresivamente la movilidad funcional"
                className="w-full border rounded-lg p-3"
              />
            </div>

            <div>
              <label
                htmlFor="fecha_inicio"
                className="block font-medium mb-2"
              >
                Fecha de inicio *
              </label>

              <input
                id="fecha_inicio"
                name="fecha_inicio"
                type="date"
                value={form.fecha_inicio}
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
                Estado del tratamiento
              </label>

              <select
                id="estado"
                name="estado"
                value={form.estado}
                onChange={actualizar}
                disabled={cargando || guardando}
                className="w-full border rounded-lg p-3 bg-white"
              >
                <option value="activo">Activo</option>
                <option value="pausado">Pausado</option>
                <option value="finalizado">Finalizado</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={
                cargando ||
                guardando ||
                pacientes.length === 0
              }
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg p-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando
                ? 'Guardando tratamiento...'
                : 'Guardar tratamiento'}
            </button>

          </form>

        </section>

        <aside className="bg-white border rounded-xl p-6 shadow-sm h-fit">

          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-bold">
              📁 Historial de tratamientos
            </h2>

            <button
              type="button"
              onClick={cargarDatos}
              disabled={cargando || guardando}
              className="text-sm border border-teal-700 text-teal-700 rounded-lg px-3 py-2 hover:bg-teal-50 disabled:opacity-50"
            >
              Actualizar
            </button>
          </div>

          <label
            htmlFor="filtroPaciente"
            className="block text-sm font-medium mb-2"
          >
            Filtrar por paciente
          </label>

          <select
            id="filtroPaciente"
            value={filtroPaciente}
            onChange={(e) =>
              setFiltroPaciente(e.target.value)
            }
            className="w-full border rounded-lg p-3 bg-white mb-5"
          >
            <option value="">
              Todos los pacientes
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

          {cargando ? (
            <p className="text-slate-500">
              Cargando tratamientos...
            </p>
          ) : tratamientosFiltrados.length === 0 ? (
            <p className="text-slate-500">
              Todavía no hay tratamientos en esta vista.
            </p>
          ) : (
            <div className="space-y-4">

              {tratamientosFiltrados.map((tratamiento) => (
                <article
                  key={tratamiento.id}
                  className="bg-slate-50 border rounded-xl p-4"
                >

                  <div className="flex justify-between items-center gap-2">
                    <h3 className="font-bold text-teal-900">
                      Tratamiento #{tratamiento.id}
                    </h3>

                    <span className="text-xs bg-teal-100 text-teal-900 rounded-full px-3 py-1">
                      {tratamiento.estado}
                    </span>
                  </div>

                  <p className="text-sm mt-3">
                    <strong>Paciente:</strong>{' '}
                    {nombrePaciente(tratamiento.paciente_id)}
                  </p>

                  <p className="text-sm mt-2">
                    <strong>Evaluación:</strong>{' '}
                    {tratamiento.evaluacion_id
                      ? `#${tratamiento.evaluacion_id}`
                      : 'No relacionada'}
                  </p>

                  <p className="text-sm mt-2">
                    <strong>Inicio:</strong>{' '}
                    {formatearFecha(tratamiento.fecha_inicio)}
                  </p>

                  <p className="text-sm mt-3 font-medium">
                    Objetivo terapéutico
                  </p>

                  <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap break-words">
                    {tratamiento.objetivo}
                  </p>

                </article>
              ))}

            </div>
          )}

        </aside>
      </div>
    </div>
  )
}
