import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function ProductBox() {
  return (
    <mesh rotation={[0.2, 0.5, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#478b87" />
    </mesh>
  )
}

export default function Product3DViewer() {
  return (
    <div className="h-72 w-full overflow-hidden rounded-xl bg-slate-900">
      <Canvas camera={{ position: [4, 3, 5] }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 5]} />
        <ProductBox />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  )
}