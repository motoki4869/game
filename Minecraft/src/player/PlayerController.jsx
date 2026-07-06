import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '../world/worldStore.js'
import { usePlayerStore, DEFAULT_SPAWN_POSITION } from './playerStore.js'
import { resolveAxisMovement, PLAYER_HEIGHT } from './collision.js'
import { isBelowVoid } from './void.js'

const MOVE_SPEED = 4.3
const SPRINT_MULTIPLIER = 1.6
const GRAVITY = -20
const TERMINAL_VELOCITY = -30
const JUMP_VELOCITY = 8
const EYE_OFFSET = PLAYER_HEIGHT - 0.2
const LOOK_SENSITIVITY = 0.0022
const PITCH_LIMIT = Math.PI / 2 - 0.01
// Pointer lock implementations (Chrome after locking, embedded browsers
// like VSCode's) sometimes report huge spurious deltas. Clamp every event
// to a plausible hand motion so a bad event nudges the view instead of
// flinging it into the sky.
const MAX_DELTA_PER_EVENT = 60

export default function PlayerController() {
  const { camera, gl } = useThree()
  const keys = useRef({})
  // Own yaw/pitch state applied as a YXZ euler. Reading yaw back from
  // camera.rotation (XYZ order) breaks down at steep pitches and reversed
  // the movement direction — so the look state lives here, not on the camera.
  const look = useRef({ yaw: 0, pitch: 0 })
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const getBlock = useWorldStore((s) => s.getBlock)

  useEffect(() => {
    const canvas = gl.domElement
    let skipNextMove = false

    const onKeyDown = (e) => { keys.current[e.code] = true }
    const onKeyUp = (e) => { keys.current[e.code] = false }
    const onClick = () => {
      if (document.pointerLockElement !== canvas) canvas.requestPointerLock()
    }
    const onPointerLockChange = () => {
      // Browsers often report one bogus jumbo delta right after locking
      // (the cursor recentering counts as movement) — drop that event.
      skipNextMove = document.pointerLockElement === canvas
    }
    const clampDelta = (v) => Math.max(-MAX_DELTA_PER_EVENT, Math.min(MAX_DELTA_PER_EVENT, v))
    const onMouseMove = (e) => {
      if (document.pointerLockElement !== canvas) return
      if (skipNextMove) {
        skipNextMove = false
        return
      }
      const dx = clampDelta(e.movementX)
      const dy = clampDelta(e.movementY)
      look.current.yaw -= dx * LOOK_SENSITIVITY
      look.current.pitch -= dy * LOOK_SENSITIVITY
      look.current.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, look.current.pitch))
      euler.current.set(look.current.pitch, look.current.yaw, 0)
      camera.quaternion.setFromEuler(euler.current)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    canvas.addEventListener('click', onClick)
    document.addEventListener('pointerlockchange', onPointerLockChange)
    document.addEventListener('mousemove', onMouseMove)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('click', onClick)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
      document.removeEventListener('mousemove', onMouseMove)
    }
  }, [camera, gl])

  useFrame((_, delta) => {
    const store = usePlayerStore.getState()
    if (store.isDead) return

    const forward = (keys.current['KeyW'] ? 1 : 0) - (keys.current['KeyS'] ? 1 : 0)
    const strafe = (keys.current['KeyD'] ? 1 : 0) - (keys.current['KeyA'] ? 1 : 0)

    const yaw = look.current.yaw
    const sin = Math.sin(yaw)
    const cos = Math.cos(yaw)

    const sprinting = keys.current['ControlLeft'] && forward > 0
    const speed = MOVE_SPEED * (sprinting ? SPRINT_MULTIPLIER : 1)
    const moveX = (forward * -sin + strafe * cos) * speed * delta
    const moveZ = (forward * -cos - strafe * sin) * speed * delta

    let velocityY = store.velocityY + GRAVITY * delta
    velocityY = Math.max(velocityY, TERMINAL_VELOCITY)

    const isGrounded = resolveAxisMovement(store.position, { x: 0, y: -0.05, z: 0 }, getBlock).y >= store.position.y

    if (isGrounded && keys.current['Space']) {
      velocityY = JUMP_VELOCITY
    }

    const delta3 = { x: moveX, y: velocityY * delta, z: moveZ }
    const nextPos = resolveAxisMovement(store.position, delta3, getBlock)

    if (isBelowVoid(nextPos.y)) {
      store.respawn(DEFAULT_SPAWN_POSITION)
      camera.position.set(DEFAULT_SPAWN_POSITION.x, DEFAULT_SPAWN_POSITION.y + EYE_OFFSET, DEFAULT_SPAWN_POSITION.z)
      return
    }

    const landed = delta3.y < 0 && nextPos.y === store.position.y
    if (landed) velocityY = 0

    store.setPosition(nextPos)
    store.setVelocityY(velocityY)
    store.setLook(look.current.yaw, look.current.pitch)

    camera.position.set(nextPos.x, nextPos.y + EYE_OFFSET, nextPos.z)
  })

  return null
}
