import AccesosClinicos3D from '../components/AccesosClinicos3D'
import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Text } from '@react-three/drei'
import * as THREE from 'three'

const INFORMACION = {
  camilla: {
    titulo: 'Camilla fisioterapéutica',
    descripcion:
      'Zona de tratamiento para movilizaciones, terapia manual y evaluación física.',
  },
  paciente: {
    titulo: 'Paciente de demostración',
    descripcion:
      'Modelo ficticio recostado en una camilla para representar una atención fisioterapéutica.',
  },
  terapeuta: {
    titulo: 'Fisioterapeuta',
    descripcion:
      'Profesional que supervisa la rehabilitación y realiza evaluaciones y tratamientos.',
  },
  computadora: {
    titulo: 'Estación de trabajo',
    descripcion:
      'Área para consultar los registros clínicos, citas, evaluaciones y planes de rehabilitación.',
  },
  equipo: {
    titulo: 'Área de ejercicios',
    descripcion:
      'Espacio con pelota terapéutica, colchoneta y equipamiento para ejercicios de rehabilitación.',
  },
}


const CAMARAS = {
  general: [5.5, 3.6, 6.8],
  frontal: [0, 2.8, 8],
  lateral: [7.5, 2.8, 0],
  superior: [0.01, 9, 0.01],
}


function Material({ color, metalness = 0, roughness = 0.7 }) {
  return (
    <meshStandardMaterial
      color={color}
      metalness={metalness}
      roughness={roughness}
    />
  )
}

function Caja({
  position,
  args,
  color,
  rotation = [0, 0, 0],
  onClick,
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
      onClick={onClick}
    >
      <boxGeometry args={args} />
      <Material color={color} />
    </mesh>
  )
}

function Esfera({
  position,
  args,
  color,
  onClick,
}) {
  return (
    <mesh
      position={position}
      castShadow
      onClick={onClick}
    >
      <sphereGeometry args={args} />
      <Material color={color} />
    </mesh>
  )
}

function Cilindro({
  position,
  args,
  color,
  rotation = [0, 0, 0],
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={args} />
      <Material color={color} />
    </mesh>
  )
}

function Habitacion() {
  return (
    <group>
      {/* Piso */}
      <Caja
        position={[0, -0.12, 0]}
        args={[11, 0.24, 9]}
        color="#e2ebe9"
      />

      {/* Pared posterior */}
      <Caja
        position={[0, 2.05, -4.5]}
        args={[11, 4.35, 0.16]}
        color="#f7faf9"
      />

      {/* Pared lateral izquierda */}
      <Caja
        position={[-5.5, 2.05, 0]}
        args={[0.16, 4.35, 9]}
        color="#edf5f3"
      />

      {/* Zócalos */}
      <Caja
        position={[0, 0.12, -4.37]}
        args={[11, 0.24, 0.08]}
        color="#b6d1cc"
      />

      <Caja
        position={[-5.37, 0.12, 0]}
        args={[0.08, 0.24, 9]}
        color="#b6d1cc"
      />

      {/* Ventana */}
      <Caja
        position={[1.7, 2.7, -4.37]}
        args={[2.7, 1.6, 0.09]}
        color="#a8dbec"
      />

      <Caja
        position={[1.7, 2.7, -4.28]}
        args={[0.09, 1.6, 0.06]}
        color="#ffffff"
      />

      <Caja
        position={[1.7, 2.7, -4.26]}
        args={[2.7, 0.09, 0.06]}
        color="#ffffff"
      />

      {/* Cuadro decorativo */}
      <Caja
        position={[-3.05, 2.65, -4.37]}
        args={[1.55, 1.1, 0.1]}
        color="#087d79"
      />

      <Caja
        position={[-3.05, 2.65, -4.28]}
        args={[1.36, 0.91, 0.035]}
        color="#ffffff"
      />

      <Caja
        position={[-3.05, 2.65, -4.23]}
        args={[0.58, 0.13, 0.03]}
        color="#16a99e"
      />

      <Caja
        position={[-3.05, 2.65, -4.20]}
        args={[0.13, 0.58, 0.03]}
        color="#16a99e"
      />

      {/* Identificación del consultorio */}
      <Text
        position={[0.2, 3.65, -4.35]}
        fontSize={0.28}
        color="#0c716d"
        anchorX="center"
        anchorY="middle"
      >
        FISIOGLOW
      </Text>

      {/* Área de ejercicios */}
      <Caja
        position={[2.45, 0.018, 2.5]}
        args={[3, 0.035, 1.95]}
        color="#c3dcd8"
      />

      <Grid
        position={[0, 0.004, 0]}
        args={[11, 9]}
        cellSize={0.65}
        cellThickness={0.35}
        cellColor="#d4dfdc"
        sectionSize={2.6}
        sectionThickness={0.55}
        sectionColor="#b9cfca"
        fadeDistance={25}
        infiniteGrid={false}
      />
    </group>
  )
}

function Camilla({ seleccionar }) {
  return (
    <group
      position={[-2.25, 0, 0.2]}
      onClick={(evento) => {
        evento.stopPropagation()
        seleccionar('camilla')
      }}
    >
      {/* Superficie */}
      <Caja
        position={[0, 0.86, 0]}
        args={[1.48, 0.17, 3]}
        color="#6c8589"
      />

      <Caja
        position={[0, 1.01, 0]}
        args={[1.44, 0.15, 2.93]}
        color="#139e98"
      />

      {/* Almohada */}
      <Caja
        position={[0, 1.13, -1.14]}
        args={[1.08, 0.13, 0.48]}
        color="#f4fcfb"
      />

      {/* Patas */}
      {[-0.58, 0.58].map((x) =>
        [-1.22, 1.22].map((z) => (
          <Caja
            key={`${x}-${z}`}
            position={[x, 0.42, z]}
            args={[0.12, 0.83, 0.12]}
            color="#7e9195"
          />
        ))
      )}

      {/* Refuerzo metálico inferior */}
      <Caja
        position={[0, 0.33, 0]}
        args={[1.06, 0.07, 2]}
        color="#9baeb1"
      />
    </group>
  )
}

function Paciente({ seleccionar }) {
  return (
    <group
      position={[-2.25, 1.23, 0.2]}
      onClick={(evento) => {
        evento.stopPropagation()
        seleccionar('paciente')
      }}
    >
      {/* Cabeza */}
      <Esfera
        position={[0, 0.015, -1.05]}
        args={[0.21, 20, 16]}
        color="#d7a080"
      />

      {/* Cabello */}
      <Esfera
        position={[0, 0.14, -1.13]}
        args={[0.205, 20, 16]}
        color="#382d31"
      />

      {/* Cuello */}
      <Caja
        position={[0, -0.03, -0.8]}
        args={[0.17, 0.17, 0.18]}
        color="#d7a080"
      />

      {/* Torso */}
      <Caja
        position={[0, -0.06, -0.31]}
        args={[0.72, 0.26, 0.88]}
        color="#e8f5f1"
      />

      {/* Cadera */}
      <Caja
        position={[0, -0.07, 0.28]}
        args={[0.66, 0.27, 0.4]}
        color="#446181"
      />

      {/* Piernas */}
      <Caja
        position={[-0.18, -0.075, 0.79]}
        args={[0.26, 0.22, 0.72]}
        color="#446181"
      />

      <Caja
        position={[0.18, -0.075, 0.79]}
        args={[0.26, 0.22, 0.72]}
        color="#446181"
      />

      {/* Pies */}
      <Caja
        position={[-0.18, -0.06, 1.2]}
        args={[0.28, 0.19, 0.25]}
        color="#64748b"
      />

      <Caja
        position={[0.18, -0.06, 1.2]}
        args={[0.28, 0.19, 0.25]}
        color="#64748b"
      />

      {/* Brazos */}
      <Caja
        position={[-0.49, -0.09, -0.24]}
        args={[0.17, 0.15, 0.9]}
        color="#d7a080"
      />

      <Caja
        position={[0.49, -0.09, -0.24]}
        args={[0.17, 0.15, 0.9]}
        color="#d7a080"
      />
    </group>
  )
}

function Fisioterapeuta({ seleccionar }) {
  return (
    <group
      position={[-0.68, 0, 0.18]}
      onClick={(evento) => {
        evento.stopPropagation()
        seleccionar('terapeuta')
      }}
    >
      {/* Pantalón */}
      <Caja
        position={[-0.18, 0.53, 0]}
        args={[0.27, 1.04, 0.33]}
        color="#284e65"
      />

      <Caja
        position={[0.18, 0.53, 0]}
        args={[0.27, 1.04, 0.33]}
        color="#284e65"
      />

      {/* Zapatos */}
      <Caja
        position={[-0.18, 0.07, 0.1]}
        args={[0.29, 0.14, 0.42]}
        color="#334155"
      />

      <Caja
        position={[0.18, 0.07, 0.1]}
        args={[0.29, 0.14, 0.42]}
        color="#334155"
      />

      {/* Uniforme */}
      <Caja
        position={[0, 1.53, 0]}
        args={[0.83, 1.03, 0.43]}
        color="#f2f9f7"
      />

      <Caja
        position={[0, 1.56, 0.23]}
        args={[0.16, 0.45, 0.035]}
        color="#18a49a"
      />

      {/* Brazos */}
      <Cilindro
        position={[-0.54, 1.46, 0]}
        args={[0.12, 0.12, 0.85, 14]}
        color="#e6f3ef"
        rotation={[0, 0, -0.25]}
      />

      <Cilindro
        position={[0.54, 1.46, 0]}
        args={[0.12, 0.12, 0.85, 14]}
        color="#e6f3ef"
        rotation={[0, 0, 0.25]}
      />

      {/* Manos */}
      <Esfera
        position={[-0.66, 1.05, 0]}
        args={[0.14, 16, 12]}
        color="#c18d6b"
      />

      <Esfera
        position={[0.66, 1.05, 0]}
        args={[0.14, 16, 12]}
        color="#c18d6b"
      />

      {/* Cuello */}
      <Cilindro
        position={[0, 2.1, 0]}
        args={[0.13, 0.13, 0.19, 14]}
        color="#c18d6b"
      />

      {/* Cabeza */}
      <Esfera
        position={[0, 2.39, 0]}
        args={[0.27, 20, 16]}
        color="#c18d6b"
      />

      {/* Cabello */}
      <Esfera
        position={[0, 2.56, -0.06]}
        args={[0.27, 20, 16]}
        color="#3a3030"
      />

      {/* Credencial */}
      <Caja
        position={[0.23, 1.77, 0.25]}
        args={[0.19, 0.13, 0.035]}
        color="#169f99"
      />
    </group>
  )
}

function Escritorio({ seleccionar }) {
  return (
    <group
      position={[2.42, 0, -1.65]}
      onClick={(evento) => {
        evento.stopPropagation()
        seleccionar('computadora')
      }}
    >
      {/* Mesa */}
      <Caja
        position={[0, 0.84, 0]}
        args={[2.15, 0.12, 1.05]}
        color="#b99579"
      />

      {[-0.86, 0.86].map((x) =>
        [-0.36, 0.36].map((z) => (
          <Caja
            key={`${x}-${z}`}
            position={[x, 0.4, z]}
            args={[0.1, 0.8, 0.1]}
            color="#728991"
          />
        ))
      )}

      {/* Monitor */}
      <Caja
        position={[0, 1.5, -0.22]}
        args={[1.12, 0.75, 0.1]}
        color="#283847"
      />

      <Caja
        position={[0, 1.5, -0.16]}
        args={[0.98, 0.61, 0.035]}
        color="#159e9a"
      />

      {/* Elementos de pantalla */}
      <Caja
        position={[0, 1.65, -0.13]}
        args={[0.68, 0.06, 0.01]}
        color="#e5ffff"
      />

      <Caja
        position={[0, 1.45, -0.13]}
        args={[0.68, 0.18, 0.01]}
        color="#a4e0dc"
      />

      {/* Soporte */}
      <Caja
        position={[0, 1.06, -0.21]}
        args={[0.09, 0.19, 0.1]}
        color="#5e7180"
      />

      <Caja
        position={[0, 0.96, -0.2]}
        args={[0.43, 0.05, 0.25]}
        color="#5e7180"
      />

      {/* Teclado */}
      <Caja
        position={[0, 0.92, 0.32]}
        args={[0.84, 0.045, 0.27]}
        color="#475569"
      />

      {/* Silla */}
      <Caja
        position={[0, 0.49, 1.15]}
        args={[0.72, 0.14, 0.66]}
        color="#475569"
      />

      <Caja
        position={[0, 1.02, 1.44]}
        args={[0.72, 1, 0.15]}
        color="#475569"
      />

      <Cilindro
        position={[0, 0.24, 1.15]}
        args={[0.09, 0.09, 0.45, 12]}
        color="#7a8e99"
      />
    </group>
  )
}

function Equipos({ seleccionar }) {
  return (
    <group
      position={[2.6, 0, 2.55]}
      onClick={(evento) => {
        evento.stopPropagation()
        seleccionar('equipo')
      }}
    >
      {/* Pelota de rehabilitación */}
      <Esfera
        position={[-0.68, 0.45, 0]}
        args={[0.45, 28, 22]}
        color="#1aa69f"
      />

      {/* Colchoneta */}
      <Caja
        position={[0.6, 0.08, 0]}
        args={[0.86, 0.14, 1.65]}
        color="#547c9c"
      />

      {/* Pesas pequeñas */}
      <Cilindro
        position={[0.53, 0.26, -0.36]}
        args={[0.12, 0.12, 0.64, 16]}
        color="#d39b63"
        rotation={[0, 0, Math.PI / 2]}
      />

      <Cilindro
        position={[0.53, 0.26, 0.28]}
        args={[0.12, 0.12, 0.64, 16]}
        color="#d39b63"
        rotation={[0, 0, Math.PI / 2]}
      />

      {/* Plataforma de equilibrio */}
      <Cilindro
        position={[1.5, 0.14, 0]}
        args={[0.48, 0.48, 0.15, 32]}
        color="#8ba9a4"
      />
    </group>
  )
}

function AjustarCamara({ vista, controles }) {
  const { camera } = useThree()

  useEffect(() => {
    const destino = CAMARAS[vista] || CAMARAS.general

    camera.position.set(...destino)
    camera.lookAt(0, 1, 0)
    camera.updateProjectionMatrix()

    if (controles.current) {
      controles.current.target.set(0, 1, 0)
      controles.current.update()
    }
  }, [vista, camera, controles])

  return null
}

function Escena3D({ vista, seleccionar }) {
  const controles = useRef(null)

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{
        position: CAMARAS.general,
        fov: 42,
        near: 0.1,
        far: 100,
      }}
      onPointerMissed={() => seleccionar(null)}
      style={{
        width: '100%',
        height: '100%',
        background: '#daeae6',
      }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#daeae6']} />

      <ambientLight intensity={1.45} />

      <directionalLight
        position={[4, 9, 7]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0002}
      />

      <Suspense fallback={null}>
        <Habitacion />
        <Camilla seleccionar={seleccionar} />
        <Paciente seleccionar={seleccionar} />
        <Fisioterapeuta seleccionar={seleccionar} />
        <Escritorio seleccionar={seleccionar} />
        <Equipos seleccionar={seleccionar} />
      </Suspense>

      <OrbitControls
        ref={controles}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={19}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 1, 0]}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />

      <AjustarCamara
        vista={vista}
        controles={controles}
      />
    </Canvas>
  )
}

export default function Consultorio3D({ onNavigate }) {
  const [vista, setVista] = useState('general')
  const [seleccionado, setSeleccionado] = useState(null)

  const informacion = seleccionado
    ? INFORMACION[seleccionado]
    : null

  const vistas = [
    ['general', 'Vista general'],
    ['frontal', 'Vista frontal'],
    ['lateral', 'Vista lateral'],
    ['superior', 'Vista superior'],
  ]

  return (
    <div className="p-5 md:p-9 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-teal-900">
          Consultorio 3D Interactivo
        </h1>

        <p className="mt-2 text-slate-500">
          FISIOGLOW 2.0 — Simulación clínica tridimensional
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {vistas.map(([clave, nombre]) => (
          <button
            key={clave}
            type="button"
            onClick={() => setVista(clave)}
            className={
              'rounded-lg border px-4 py-2 text-sm font-semibold transition ' +
              (
                vista === clave
                  ? 'border-teal-700 bg-teal-700 text-white'
                  : 'border-slate-300 bg-white text-teal-900 hover:bg-teal-50'
              )
            }
          >
            {nombre}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm xl:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
            <h2 className="font-bold text-teal-900">
              🏥 Sala de rehabilitación
            </h2>

            <span className="text-xs text-slate-500">
              Escena 3D interactiva
            </span>
          </div>

          <div
            style={{
              height: 'min(66vh, 640px)',
              minHeight: 390,
            }}
          >
            <Escena3D
              vista={vista}
              seleccionar={setSeleccionado}
            />
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Información del consultorio
            </h2>

            {informacion ? (
              <div className="mt-4 space-y-3">
                <h3 className="font-semibold text-teal-800">
                  {informacion.titulo}
                </h3>

                <p className="text-sm leading-6 text-slate-600">
                  {informacion.descripcion}
                </p>

                <button
                  type="button"
                  onClick={() => setSeleccionado(null)}
                  className="text-sm font-medium text-teal-700 hover:underline"
                >
                  Quitar selección
                </button>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Selecciona la camilla, el paciente,
                el fisioterapeuta, la computadora
                o los equipos para ver sus funciones.
              </p>
            )}
          </section>
          
{seleccionado === 'computadora' && (
  <AccesosClinicos3D onNavigate={onNavigate} />
)}


          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              🎮 Controles de navegación
            </h2>

            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              <li>
                <strong>Girar:</strong> arrastra con el
                botón izquierdo del mouse.
              </li>

              <li>
                <strong>Zoom:</strong> utiliza la rueda
                del mouse.
              </li>

              <li>
                <strong>Desplazar:</strong> arrastra
                con el botón derecho.
              </li>

              <li>
                <strong>Cambiar vista:</strong> utiliza
                los botones superiores.
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-teal-200 bg-teal-50 p-5">
            <p className="text-sm leading-6 text-teal-900">
              Consultorio virtual de demostración.
              Los personajes y escenarios son ficticios
              y no representan pacientes reales.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
