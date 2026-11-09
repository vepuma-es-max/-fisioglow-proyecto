
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '')

function fechaHoy() {
  const fecha = new Date()
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')

  return `${anio}-${mes}-${dia}`
}

function formularioInicial() {
  return {
    paciente_id: '',
    fisioterapeuta_id: '',
    fecha_evaluacion: fechaHoy(),
    motivo_consulta: '',
    antecedentes: '',
    dolor_eva: '0',
    movilidad_articular: '',
    fuerza_muscular: '',
    hallazgos: '',
    objetivos: '',
    observaciones: ''
  }
}

function formatearFecha(valor) {
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

function construirObservaciones(form) {
  return [
    'VALORACIÓN FISIOTERAPÉUTICA',
    '',
    `Antecedentes: ${form.antecedentes || 'No registrados'}`,
    `Dolor EVA: ${form.dolor_eva}/10`,
    `Movilidad articular: ${form.movilidad_articular || 'No registrada'}`,
    `Fuerza muscular: ${form.fuerza_muscular || 'No registrada'}`,
    `Hallazgos: ${form.hallazgos || 'No registrados'}`,
    `Objetivos: ${form.objetivos || 'No registrados'}`,
    `Observaciones adicionales: ${form.observaciones || 'Ninguna'}`
  ].join('\n')
}

export default function Evaluaciones() {
  const [form, setForm] = useState(formularioInicial)
  const [pacientes, setPacientes] = useState([])
  const [fisioterapeutas, setFisioterapeutas] = useState([])
  const [evaluaciones, setEvaluaciones] = useState([])

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
        'Tu sesión ha terminado. Inicia sesión nuevamente.'
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
        listaFisioterapeutas,
        listaEvaluaciones
      ] = await Promise.all([
        solicitar('/api/v1/pacientes'),
        solicitar('/api/v1/fisioterapeutas'),
        solicitar('/api/v1/evaluaciones')
      ])

      if (
        !Array.isArray(listaPacientes) ||
        !Array.isArray(listaFisioterapeutas) ||
        !Array.isArray(listaEvaluaciones)
      ) {
        throw new Error(
          'La API devolvió un formato de datos inesperado.'
        )
      }

      setPacientes(listaPacientes)
      setFisioterapeutas(listaFisioterapeutas)
      setEvaluaciones(listaEvaluaciones)
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

  async function guardarEvaluacion(evento) {
    evento.preventDefault()
    setError('')
    setMensaje('')

    if (
      !form.paciente_id ||
      !form.fisioterapeuta_id ||
      !form.fecha_evaluacion
    ) {
      setError(
        'Selecciona un paciente, fisioterapeuta y fecha.'
      )
      return
    }

    const fecha = new Date(
      `${form.fecha_evaluacion}T12:00:00`
    )

    if (Number.isNaN(fecha.getTime())) {
      setError('La fecha de evaluación no es válida.')
      return
    }

    const observacionesCompletas =
      construirObservaciones(form)

    if (observacionesCompletas.length > 5000) {
      setError(
        'Las observaciones superan los 5000 caracteres. ' +
        'Reduce el contenido antes de guardar.'
      )
      return
    }

    setGuardando(true)

    try {
      await solicitar('/api/v1/evaluaciones', {
        method: 'POST',
        body: JSON.stringify({
          paciente_id: Number(form.paciente_id),
          fisioterapeuta_id: Number(
            form.fisioterapeuta_id
          ),
          fecha_evaluacion: fecha.toISOString(),
          motivo_consulta:
            form.motivo_consulta.trim() || null,
          observaciones: observacionesCompletas
        })
      })

      const pacienteGuardado = form.paciente_id

      setForm({
        ...formularioInicial(),
        paciente_id: pacienteGuardado
      })

      setFiltroPaciente(pacienteGuardado)

      setMensaje(
        '¡Evaluación registrada correctamente en Supabase!'
      )

      await cargarDatos()
    } catch (err) {
      setError(
        err.message || 'No se pudo registrar la evaluación.'
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

  const evaluacionesFiltradas = evaluaciones.filter(
    (evaluacion) =>
      !filtroPaciente ||
      Number(evaluacion.paciente_id) ===
        Number(filtroPaciente)
  )

  function campoTexto(nombre, etiqueta, ejemplo) {
    return (
      <div>
        <label
          htmlFor={nombre}
          className="block font-medium text-slate-700 mb-2"
        >
          {etiqueta}
        </label>

        <textarea
          id={nombre}
          name={nombre}
          value={form[nombre]}
          onChange={actualizar}
          rows={3}
          maxLength={1800}
          disabled={guardando || cargando}
          placeholder={ejemplo}
          className="w-full border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-9 space-y-7">

      <header>
        <h1 className="text-3xl font-bold text-teal-900">
          Evaluaciones Fisioterapéuticas
        </h1>

        <p className="text-slate-500 mt-2">
          FISIOGLOW 2.0 — Valoración y seguimiento clínico
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
          <p className="text-3xl font-bold text-teal-800 mt-2">
            {cargando ? '...' : pacientes.length}
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-slate-500">
            Fisioterapeutas
          </p>
          <p className="text-3xl font-bold text-teal-800 mt-2">
            {cargando ? '...' : fisioterapeutas.length}
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-slate-500">
            Evaluaciones cargadas
          </p>
          <p className="text-3xl font-bold text-teal-800 mt-2">
            {cargando ? '...' : evaluaciones.length}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Hasta 100 registros
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <section className="xl:col-span-2 bg-white border rounded-xl shadow-sm p-6">

          <h2 className="text-xl font-bold mb-6">
            📋 Nueva evaluación
          </h2>

          <form
            onSubmit={guardarEvaluacion}
            className="space-y-6"
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
                htmlFor="fecha_evaluacion"
                className="block font-medium mb-2"
              >
                Fecha de evaluación *
              </label>

              <input
                id="fecha_evaluacion"
                name="fecha_evaluacion"
                type="date"
                value={form.fecha_evaluacion}
                onChange={actualizar}
                required
                disabled={cargando || guardando}
                className="w-full border rounded-lg p-3"
              />
            </div>

            {campoTexto(
              'motivo_consulta',
              'Motivo de consulta',
              'Ejemplo: dolor lumbar durante la marcha'
            )}

            {campoTexto(
              'antecedentes',
              'Antecedentes relevantes',
              'Antecedentes ficticios del paciente'
            )}

            <div className="border-t pt-6">
              <h3 className="text-lg font-bold mb-4">
                🩺 Exploración física
              </h3>

              <label
                htmlFor="dolor_eva"
                className="block font-medium mb-3"
              >
                Intensidad del dolor (EVA):
                <span className="text-teal-700 font-bold ml-2">
                  {form.dolor_eva}/10
                </span>
              </label>

              <input
                id="dolor_eva"
                name="dolor_eva"
                type="range"
                min="0"
                max="10"
                value={form.dolor_eva}
                onChange={actualizar}
                disabled={cargando || guardando}
                className="w-full accent-teal-700"
              />

              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>0 — Sin dolor</span>
                <span>10 — Máximo dolor</span>
              </div>
            </div>

            {campoTexto(
              'movilidad_articular',
              'Movilidad articular',
              'Describir los rangos de movimiento'
            )}

            {campoTexto(
              'fuerza_muscular',
              'Fuerza muscular',
              'Registrar grupos musculares y fuerza'
            )}

            {campoTexto(
              'hallazgos',
              'Hallazgos clínicos',
              'Describir los hallazgos de la valoración'
            )}

            {campoTexto(
              'objetivos',
              'Objetivos de rehabilitación',
              'Indicar los objetivos de recuperación'
            )}

            {campoTexto(
              'observaciones',
              'Observaciones adicionales',
              'Agregar información complementaria'
            )}

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
                ? 'Guardando evaluación...'
                : 'Guardar evaluación'}
            </button>

          </form>
        </section>

        <aside className="bg-white border rounded-xl shadow-sm p-6 h-fit">

          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-bold">
              📁 Historial de evaluaciones
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
              Cargando evaluaciones...
            </p>
          ) : evaluacionesFiltradas.length === 0 ? (
            <p className="text-slate-500">
              No hay evaluaciones registradas en esta vista.
            </p>
          ) : (
            <div className="space-y-4">
              {evaluacionesFiltradas.map((evaluacion) => (
                <article
                  key={evaluacion.id}
                  className="bg-slate-50 border rounded-xl p-4"
                >
                  <h3 className="font-bold text-teal-900">
                    Evaluación #{evaluacion.id}
                  </h3>

                  <p className="text-sm mt-3">
                    <strong>Paciente:</strong>{' '}
                    {nombrePaciente(evaluacion.paciente_id)}
                  </p>

                  <p className="text-sm mt-2">
                    <strong>Fisioterapeuta:</strong>{' '}
                    {nombreFisioterapeuta(
                      evaluacion.fisioterapeuta_id
                    )}
                  </p>

                  <p className="text-sm mt-2">
                    <strong>Fecha:</strong>{' '}
                    {formatearFecha(
                      evaluacion.fecha_evaluacion
                    )}
                  </p>

                  <p className="text-sm mt-2">
                    <strong>Motivo:</strong>{' '}
                    {evaluacion.motivo_consulta ||
                      'No registrado'}
                  </p>

                  <details className="mt-4">
                    <summary className="cursor-pointer text-teal-800 font-medium text-sm">
                      Ver valoración completa
                    </summary>

                    <p className="text-sm text-slate-700 whitespace-pre-wrap mt-3 break-words">
                      {evaluacion.observaciones ||
                        'Sin observaciones'}
                    </p>
                  </details>
                </article>
              ))}
            </div>
          )}

        </aside>

      </div>
    </div>
  )
}
