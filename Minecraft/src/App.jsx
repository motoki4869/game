import { Canvas } from '@react-three/fiber'
import WebGLGate from './webgl/WebGLGate.jsx'
import Chunk from './world/Chunk.jsx'
import PlayerController from './player/PlayerController.jsx'
import { useBlockRaycast } from './interaction/useBlockRaycast.js'
import Mobs from './entities/Mobs.jsx'

function Interaction() {
  useBlockRaycast()
  return null
}

export default function App() {
  return (
    <WebGLGate>
      <div className="w-screen h-screen bg-sky-400 relative">
        <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [32, 25, 32] }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 20, 10]} intensity={0.8} />
          <Chunk />
          <PlayerController />
          <Interaction />
          <Mobs getTime={() => 400} />
        </Canvas>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-1 h-1 bg-white rounded-full" />
        </div>
      </div>
    </WebGLGate>
  )
}
