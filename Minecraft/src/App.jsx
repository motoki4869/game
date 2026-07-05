import { useEffect, useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import WebGLGate from './webgl/WebGLGate.jsx'
import Chunk from './world/Chunk.jsx'
import PlayerController from './player/PlayerController.jsx'
import { useBlockRaycast } from './interaction/useBlockRaycast.js'
import Mobs from './entities/Mobs.jsx'
import Hotbar from './inventory/ui/Hotbar.jsx'
import HUD from './inventory/ui/HUD.jsx'
import InventoryPanel from './inventory/ui/InventoryPanel.jsx'
import { useSurvivalTick } from './survival/useSurvivalTick.js'
import { loadGameOnStartup, useAutoSave } from './persistence/useAutoSave.js'

const savedTime = loadGameOnStartup()

function Interaction() {
  useBlockRaycast()
  return null
}

function DayNightLight({ getLightIntensity }) {
  const lightRef = useRef()
  useFrame(() => {
    if (lightRef.current) lightRef.current.intensity = getLightIntensity()
  })
  return <directionalLight ref={lightRef} position={[10, 20, 10]} intensity={1} />
}

function Scene() {
  const { getTime, getLightIntensity } = useSurvivalTick(savedTime ?? 0)
  useAutoSave(getTime)
  return (
    <>
      <ambientLight intensity={0.3} />
      <DayNightLight getLightIntensity={getLightIntensity} />
      <Chunk />
      <PlayerController />
      <Interaction />
      <Mobs getTime={getTime} />
    </>
  )
}

export default function App() {
  const [inventoryOpen, setInventoryOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e) {
      if (e.code === 'KeyE') setInventoryOpen((open) => !open)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <WebGLGate>
      <div className="w-screen h-screen bg-sky-400 relative">
        <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [32, 25, 32] }}>
          <Scene />
        </Canvas>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-1 h-1 bg-white rounded-full" />
        </div>
        <HUD />
        <Hotbar />
        {inventoryOpen && <InventoryPanel />}
      </div>
    </WebGLGate>
  )
}
