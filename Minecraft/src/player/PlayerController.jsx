import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import { useWorldStore } from '../world/worldStore.js'
import { usePlayerStore } from './playerStore.js'
import { resolveAxisMovement, PLAYER_HEIGHT } from './collision.js'

const MOVE_SPEED = 5
const GRAVITY = -20
const TERMINAL_VELOCITY = -30
const JUMP_VELOCITY = 8
const EYE_OFFSET = PLAYER_HEIGHT - 0.2

export default function PlayerController() {
  const { camera } = useThree()
  const keys = useRef({})
  const controlsRef = useRef()
  const getBlock = useWorldStore((s) => s.getBlock)

  useEffect(() => {
    const onKeyDown = (e) => { keys.current[e.code] = true }
    const onKeyUp = (e) => { keys.current[e.code] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useFrame((_, delta) => {
    const store = usePlayerStore.getState()
    if (store.isDead) return

    const forward = (keys.current['KeyW'] ? 1 : 0) - (keys.current['KeyS'] ? 1 : 0)
    const strafe = (keys.current['KeyD'] ? 1 : 0) - (keys.current['KeyA'] ? 1 : 0)

    const yaw = camera.rotation.y
    const sin = Math.sin(yaw)
    const cos = Math.cos(yaw)

    const moveX = (forward * -sin + strafe * cos) * MOVE_SPEED * delta
    const moveZ = (forward * -cos - strafe * sin) * MOVE_SPEED * delta

    let velocityY = store.velocityY + GRAVITY * delta
    velocityY = Math.max(velocityY, TERMINAL_VELOCITY)

    const groundCheckPos = { x: store.position.x, y: store.position.y - 0.05, z: store.position.z }
    const isGrounded = resolveAxisMovement(store.position, { x: 0, y: -0.05, z: 0 }, getBlock).y >= groundCheckPos.y

    if (isGrounded && keys.current['Space']) {
      velocityY = JUMP_VELOCITY
    }

    const delta3 = { x: moveX, y: velocityY * delta, z: moveZ }
    const nextPos = resolveAxisMovement(store.position, delta3, getBlock)

    const landed = delta3.y < 0 && nextPos.y === store.position.y
    if (landed) velocityY = 0

    store.setPosition(nextPos)
    store.setVelocityY(velocityY)
    store.setLook(camera.rotation.y, camera.rotation.x)

    camera.position.set(nextPos.x, nextPos.y + EYE_OFFSET, nextPos.z)
  })

  return <PointerLockControls ref={controlsRef} />
}
