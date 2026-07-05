import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useMobStore } from './mobStore.js'
import { usePlayerStore } from '../player/playerStore.js'
import { useWorldStore } from '../world/worldStore.js'
import { computeMobStep } from './mobAI.js'
import { isNight } from '../survival/dayNight.js'
import { WORLD_SIZE, WORLD_HEIGHT } from '../world/terrainGenerator.js'

const MAX_MOBS = 5
const SPAWN_INTERVAL = 15
const ATTACK_DAMAGE_PER_SECOND = 2

function surfaceHeightAt(x, z, getBlock) {
  for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
    if (getBlock(x, y, z) !== 0) return y + 1
  }
  return 0
}

export default function Mobs({ getTime }) {
  const spawnTimer = useRef(0)
  const getBlock = useWorldStore((s) => s.getBlock)

  useFrame((_, delta) => {
    const time = getTime()
    const night = isNight(time)
    const playerPos = usePlayerStore.getState().position
    const mobState = useMobStore.getState()

    if (!night && mobState.mobs.length > 0) {
      useMobStore.getState().setMobs([])
    }

    if (night) {
      spawnTimer.current += delta
      if (spawnTimer.current >= SPAWN_INTERVAL && mobState.mobs.length < MAX_MOBS) {
        spawnTimer.current = 0
        const angle = Math.random() * Math.PI * 2
        const dist = 10 + Math.random() * 5
        const x = Math.max(0, Math.min(WORLD_SIZE - 1, Math.round(playerPos.x + Math.cos(angle) * dist)))
        const z = Math.max(0, Math.min(WORLD_SIZE - 1, Math.round(playerPos.z + Math.sin(angle) * dist)))
        const y = surfaceHeightAt(x, z, getBlock)
        useMobStore.getState().spawnMob({ x, y, z })
      }
    }

    for (const mob of mobState.mobs) {
      const step = computeMobStep(mob, playerPos, delta)
      useMobStore.getState().updateMobPosition(mob.id, step.position)
      if (step.isAttacking) {
        usePlayerStore.getState().damage(ATTACK_DAMAGE_PER_SECOND * delta)
      }
    }
  })

  const mobs = useMobStore((s) => s.mobs)

  return (
    <>
      {mobs.map((mob) => (
        <mesh key={mob.id} position={[mob.position.x, mob.position.y + 0.9, mob.position.z]}>
          <boxGeometry args={[0.6, 1.8, 0.6]} />
          <meshStandardMaterial color="#b71c1c" />
        </mesh>
      ))}
    </>
  )
}
