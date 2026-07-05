import { Canvas } from '@react-three/fiber'
import WebGLGate from './webgl/WebGLGate.jsx'

export default function App() {
  return (
    <WebGLGate>
      <div className="w-screen h-screen bg-sky-400">
        <Canvas camera={{ fov: 75, near: 0.1, far: 1000 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 20, 10]} intensity={0.8} />
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="orange" />
          </mesh>
        </Canvas>
      </div>
    </WebGLGate>
  )
}
