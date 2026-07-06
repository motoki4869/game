import { useEffect, useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import WebGLGate from './webgl/WebGLGate.jsx'
import World from './world/Chunk.jsx'
import PlayerController from './player/PlayerController.jsx'
import { useBlockRaycast } from './interaction/useBlockRaycast.js'
import BlockHighlight from './interaction/BlockHighlight.jsx'
import Mobs from './entities/Mobs.jsx'
import Hotbar from './inventory/ui/Hotbar.jsx'
import HUD from './inventory/ui/HUD.jsx'
import InventoryPanel from './inventory/ui/InventoryPanel.jsx'
import { useSurvivalTick } from './survival/useSurvivalTick.js'
import { loadGameOnStartup, useAutoSave } from './persistence/useAutoSave.js'

const savedTime = loadGameOnStartup()

const DAY_SKY = new THREE.Color('#87ceeb')
const NIGHT_SKY = new THREE.Color('#0b1026')
const FOG_NEAR = 30
const FOG_FAR = 90

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

// Sky and fog colors lerp with the day/night light so nights actually feel
// dark and distant terrain fades into the horizon like vanilla.
function SkyAndFog({ getLightIntensity }) {
  const fogRef = useRef()
  const backgroundRef = useRef()
  const colorRef = useRef(new THREE.Color())

  useFrame(() => {
    // lightIntensityFor ranges [0.15, 1]; normalize to [0, 1] for the lerp
    const t = (getLightIntensity() - 0.15) / 0.85
    colorRef.current.copy(NIGHT_SKY).lerp(DAY_SKY, t)
    if (backgroundRef.current) backgroundRef.current.copy(colorRef.current)
    if (fogRef.current) fogRef.current.color.copy(colorRef.current)
  })

  return (
    <>
      <fog ref={fogRef} attach="fog" args={['#87ceeb', FOG_NEAR, FOG_FAR]} />
      <color ref={backgroundRef} attach="background" args={['#87ceeb']} />
    </>
  )
}

function Scene() {
  const { getTime, getLightIntensity } = useSurvivalTick(savedTime ?? 0)
  useAutoSave(getTime)
  return (
    <>
      <ambientLight intensity={0.45} />
      <DayNightLight getLightIntensity={getLightIntensity} />
      <SkyAndFog getLightIntensity={getLightIntensity} />
      <World />
      <PlayerController />
      <Interaction />
      <BlockHighlight />
      <Mobs getTime={getTime} />
    </>
  )
}

export default function App() {
  const [inventoryOpen, setInventoryOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e) {
      if (e.code === 'KeyE') {
        setInventoryOpen((open) => {
          // Release the mouse when opening so the crafting UI is clickable.
          if (!open && document.pointerLockElement) document.exitPointerLock()
          return !open
        })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <WebGLGate>
      <div className="w-screen h-screen bg-black relative">
        <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [32, 25, 32] }}>
          <Scene />
        </Canvas>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-1 h-1 bg-white rounded-full mix-blend-difference" />
        </div>
        <HUD />
        <Hotbar />
        {inventoryOpen && <InventoryPanel />}
      </div>
    </WebGLGate>
  )
}
