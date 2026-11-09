
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '')

const modulos = [
  {
    nombre: 'Pacientes',
    icono: '👥',
    descripcion: 'Registro e historial de pacientes'
  },
  {
    nombre: 'Citas',
    icono: '📅',
    descripcion: 'Agenda de rehabilitación'
  },
  {
    nombre: 'Evaluaciones',
    icono: '📋',
    descripcion: 'Valoraciones fisioterapéuticas'
  },
  {
    nombre: 'Tratamientos',
    icono: '🩺',
    descripcion: 'Planes de rehabilitación'
  },
  {
    nombre: 'Sesiones',
    icono: '🏥',
    descripcion: 'Seguimiento de terapias'
  },
  {
    nombre: 'Consultorio 3D',
    icono: '🧊',
    descripcion: 'Exploración del entorno clínico'
  }
]

const inicial = {
  pacientes: null,
  citas: null,
  tratamientos: null,
  sesiones: null
}

export default function Dashboard({ onNavigate }) {
  const [indicadores, setIndicadores] = useState(inicial)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargarDashboard = useCallback(async (signal) => {
    setCargando(true)
    setError('')

    try {
      const { data, error: errorSesion } =
        await supabase.auth.getSession()

      if (errorSesion) {
        throw new Error(errorSesion.message)
      }

      const token = data.session?.access_token

      if (!token) {
        throw new Error('Debes iniciar sesión.')
      }

      async function consultar(ruta) {
        const respuesta = await fetch(
          `${API_URL}${ruta}`,
          {
            signal,
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        if (!respuesta.ok) {
          throw new Error(
            `Error HTTP ${respuesta.status} en ${ruta}`
          )
        }

        const datos = await respuesta.json()

        if (!Array.isArray(datos)) {
          throw new Error(
            `Formato inesperado en ${ruta}`
          )
        }

        return datos
      }

      const resultados = await Promise.allSettled([
        consultar('/api/v1/pacientes'),
        consultar('/api/v1/citas'),
        consultar('/api/v1/tratamientos'),
        consultar('/api/v1/sesiones')
      ])

      if (signal?.aborted) return

      const [
        resultadoPacientes,
        resultadoCitas,
        resultadoTratamientos,
        resultadoSesiones
      ] = resultados

      setIndicadores({
        pacientes:
          resultadoPacientes.status === 'fulfilled'
            ? resultadoPacientes.value.length
            : null,

        citas:
          resultadoCitas.status === 'fulfilled'
            ? resultadoCitas.value.filter(
                (cita) => cita.estado === 'programada'
              ).length
            : null,

        tratamientos:
          resultadoTratamientos.status === 'fulfilled'
            ? resultadoTratamientos.value.filter(
                (tratamiento) =>
                  tratamiento.estado === 'activo'
              ).length
            : null,

        sesiones:
          resultadoSesiones.status === 'fulfilled'
            ? resultadoSesiones.value.filter(
                (sesion) => sesion.estado === 'realizada'
              ).length
            : null
      })

      const fallos = resultados
        .map((resultado, indice) =>
          resultado.status === 'rejected'
            ? [
                'Pacientes',
                'Citas',
                'Tratamientos',
                'Sesiones'
              ][indice]
            : null
        )
        .filter(Boolean)

      if (fallos.length > 0) {
        setError(
          `No se pudieron cargar: ${fallos.join(', ')}. ` +
          'Comprueba FastAPI y los permisos de Supabase.'
        )
      }
    } catch (err) {
      if (signal?.aborted) return

      setIndicadores(inicial)
      setError(
        err.message ||
        'No se pudo actualizar el Dashboard.'
      )
    } finally {
      if (!signal?.aborted) {
        setCargando(false)
      }
    }
  }, [])

  useEffect(() => {
    const controlador = new AbortController()

    cargarDashboard(controlador.signal)

    return () => controlador.abort()
  }, [cargarDashboard])

  const tarjetas = [
    {
      titulo: 'Pacientes cargados',
      valor: indicadores.pacientes,
      detalle: 'Hasta 100 registros',
      modulo: 'Pacientes'
    },
    {
      titulo: 'Citas programadas',
      valor: indicadores.citas,
      detalle: 'Hasta 100 citas consultadas',
      modulo: 'Citas'
    },
    {
      titulo: 'Tratamientos activos',
      valor: indicadores.tratamientos,
      detalle: 'Hasta 100 tratamientos consultados',
      modulo: 'Tratamientos'
    },
    {
      titulo: 'Sesiones realizadas',
      valor: indicadores.sesiones,
      detalle: 'Hasta 100 sesiones consultadas',
      modulo: 'Sesiones'
    }
  ]

  return (
    <div className="p-6 md:p-9 space-y-8">

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-teal-900">
            Panel de Control
          </h1>

          <p className="text-slate-500 mt-2">
            FISIOGLOW 2.0 — Gestión de Rehabilitación
          </p>

          <p className="text-sm text-slate-400 mt-1">
            Fecha: {new Date().toLocaleDateString('es-BO')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => cargarDashboard()}
          disabled={cargando}
          className="rounded-lg border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-50"
        >
          {cargando ? 'Actualizando...' : 'Actualizar'}
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800"
        >
          {error}
        </div>
      )}

      <section
        aria-label="Indicadores del sistema"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
      >
        {tarjetas.map((tarjeta) => (
          <button
            key={tarjeta.titulo}
            type="button"
            onClick={() => onNavigate?.(tarjeta.modulo)}
            className="rounded-xl border border-slate-300 bg-white p-5 text-left shadow-sm transition hover:border-teal-500 hover:shadow-md"
          >
            <p className="text-sm text-slate-500">
              {tarjeta.titulo}
            </p>

            <h2 className="mt-4 text-3xl font-bold text-teal-800">
              {cargando
                ? '...'
                : tarjeta.valor ?? '—'}
            </h2>

            <p className="mt-3 text-xs text-slate-400">
              {tarjeta.detalle}
            </p>
          </button>
        ))}
      </section>

      <section>
        <h2 className="mb-5 text-xl font-bold text-slate-900">
          Módulos del sistema
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {modulos.map((modulo) => (
            <button
              key={modulo.nombre}
              type="button"
              onClick={() => onNavigate?.(modulo.nombre)}
              className="rounded-xl border border-slate-300 bg-white p-6 text-left transition hover:border-teal-500 hover:shadow-md"
            >
              <div className="mb-4 text-2xl">
                {modulo.icono}
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                {modulo.nombre}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {modulo.descripcion}
              </p>
            </button>
          ))}
        </div>
      </section>

    </div>
  )
}
