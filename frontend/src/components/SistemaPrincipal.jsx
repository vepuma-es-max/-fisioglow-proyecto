
import { useState } from 'react'

import Dashboard from '../pages/Dashboard'
import Pacientes from '../pages/Pacientes'
import Citas from '../pages/Citas'
import Evaluaciones from '../pages/Evaluaciones'
import Tratamientos from '../pages/Tratamientos'
import Sesiones from '../pages/Sesiones'
import Consultorio3D from '../pages/Consultorio3D'
import App from '../App'

const opciones = [
  { nombre: 'Dashboard', icono: '📊' },
  { nombre: 'Pacientes', icono: '👥' },
  { nombre: 'Citas', icono: '📅' },
  { nombre: 'Evaluaciones', icono: '📋' },
  { nombre: 'Tratamientos', icono: '🩺' },
  { nombre: 'Sesiones', icono: '🏥' },
  { nombre: 'Consultorio 3D', icono: '🧊' },
  { nombre: 'Catálogo', icono: '📦' }
]

export default function SistemaPrincipal() {
  const [pagina, setPagina] = useState('Dashboard')

  function navegar(destino) {
    const existe = opciones.some(
      (opcion) => opcion.nombre === destino
    )

    if (!existe) {
      return
    }

    setPagina(destino)

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  function mostrarContenido() {
    switch (pagina) {
      case 'Dashboard':
        return (
          <Dashboard onNavigate={navegar} />
        )

      case 'Pacientes':
        return <Pacientes />

      case 'Citas':
        return <Citas />

      case 'Evaluaciones':
        return <Evaluaciones />

      case 'Tratamientos':
        return <Tratamientos />

      case 'Sesiones':
        return <Sesiones />

      case 'Consultorio 3D':
        return (
          <Consultorio3D onNavigate={navegar} />
        )

      case 'Catálogo':
        return <App />

      default:
        return (
          <Dashboard onNavigate={navegar} />
        )
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 md:flex">

      {/* MENÚ LATERAL */}
      <aside className="w-full shrink-0 bg-slate-900 p-5 text-white md:min-h-screen md:w-64">

        {/* IDENTIDAD DEL SISTEMA */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-teal-400">
            FISIOGLOW
          </h1>

          <p className="mt-2 text-xs text-slate-400">
            Sistema de Gestión de Rehabilitación
          </p>
        </div>

        {/* NAVEGACIÓN PRINCIPAL */}
        <nav
          aria-label="Menú principal"
          className="space-y-2"
        >
          {opciones.map((opcion) => (
            <button
              key={opcion.nombre}
              type="button"
              onClick={() => navegar(opcion.nombre)}
              aria-current={
                pagina === opcion.nombre
                  ? 'page'
                  : undefined
              }
              className={
                'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ' +
                (
                  pagina === opcion.nombre
                    ? 'bg-teal-700 font-semibold text-white'
                    : 'text-slate-200 hover:bg-slate-800'
                )
              }
            >
              <span
                aria-hidden="true"
                className="text-lg"
              >
                {opcion.icono}
              </span>

              <span>
                {opcion.nombre}
              </span>
            </button>
          ))}
        </nav>

        {/* PIE DEL MENÚ */}
        <div className="mt-10 border-t border-slate-700 pt-5">
          <p className="text-xs text-slate-400">
            FISIOGLOW 2.0
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Proyecto académico de fisioterapia
          </p>
        </div>

      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main
        id="contenido-principal"
        className="min-w-0 flex-1"
      >
        {mostrarContenido()}
      </main>

    </div>
  )
}
