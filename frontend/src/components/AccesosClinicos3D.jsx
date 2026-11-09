
const accesos = [
  {
    nombre: 'Pacientes',
    icono: '👥',
    descripcion: 'Consultar registros de pacientes'
  },
  {
    nombre: 'Citas',
    icono: '📅',
    descripcion: 'Consultar la agenda fisioterapéutica'
  },
  {
    nombre: 'Evaluaciones',
    icono: '📋',
    descripcion: 'Revisar valoraciones clínicas'
  },
  {
    nombre: 'Tratamientos',
    icono: '🩺',
    descripcion: 'Consultar planes de rehabilitación'
  },
  {
    nombre: 'Sesiones',
    icono: '🏥',
    descripcion: 'Revisar el seguimiento terapéutico'
  }
]

export default function AccesosClinicos3D({
  onNavigate
}) {
  return (
    <section className="rounded-xl border border-teal-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-teal-900">
        💻 Computadora clínica
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        Accede a los módulos de FISIOGLOW 2.0
        desde el consultorio virtual.
      </p>

      <div className="mt-5 space-y-3">
        {accesos.map((acceso) => (
          <button
            key={acceso.nombre}
            type="button"
            onClick={() =>
              onNavigate?.(acceso.nombre)
            }
            disabled={!onNavigate}
            className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition hover:border-teal-500 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-2xl">
              {acceso.icono}
            </span>

            <span>
              <span className="block font-semibold text-slate-900">
                {acceso.nombre}
              </span>

              <span className="block text-xs text-slate-500 mt-1">
                {acceso.descripcion}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
