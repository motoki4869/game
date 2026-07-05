import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '../world/worldStore.js'
import { usePlayerStore } from '../player/playerStore.js'
import { useInventoryStore } from '../inventory/inventoryStore.js'
import { useInteractionStore } from './interactionStore.js'
import { computeBreakResult, computePlaceResult, breakDurationSeconds } from './blockActions.js'
import { BLOCKS } from '../constants/blocks.js'

const MAX_DISTANCE = 6
const STEP = 0.05

function raycastBlocks(origin, direction, getBlock) {
  let x = origin.x, y = origin.y, z = origin.z
  let lastEmpty = { x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) }

  for (let t = 0; t < MAX_DISTANCE; t += STEP) {
    x = origin.x + direction.x * t
    y = origin.y + direction.y * t
    z = origin.z + direction.z * t
    const bx = Math.floor(x), by = Math.floor(y), bz = Math.floor(z)
    const block = getBlock(bx, by, bz)
    if (block !== BLOCKS.AIR && block !== BLOCKS.WATER) {
      return { hit: { x: bx, y: by, z: bz, blockId: block }, adjacent: lastEmpty }
    }
    lastEmpty = { x: bx, y: by, z: bz }
  }
  return { hit: null, adjacent: null }
}

function toolTierForSelectedItem() {
  const selected = useInventoryStore.getState().getSelectedItem()
  if (!selected) return 'none'
  if (selected.itemId === 'wood_pickaxe' || selected.itemId === 'wood_axe') return 'wood'
  if (selected.itemId === 'stone_pickaxe' || selected.itemId === 'stone_axe') return 'stone'
  return 'none'
}

export function useBlockRaycast() {
  const { camera } = useThree()
  const getBlock = useWorldStore((s) => s.getBlock)
  const targetRef = useRef(null)
  const leftHeld = useRef(false)
  const progressRef = useRef(0)
  const breakingKeyRef = useRef(null)
  const direction = useRef(new THREE.Vector3())

  // Hold-to-break, vanilla style: progress accumulates while the left
  // button is held on the same block, scaled by hardness and tool tier.
  useFrame((_, delta) => {
    camera.getWorldDirection(direction.current)
    const result = raycastBlocks(camera.position, direction.current, getBlock)
    targetRef.current = result
    useInteractionStore.getState().setTarget(result)

    const hit = result.hit
    const hitKey = hit ? `${hit.x},${hit.y},${hit.z}` : null

    if (!leftHeld.current || !hit) {
      if (progressRef.current !== 0) {
        progressRef.current = 0
        useInteractionStore.getState().setBreakProgress(0)
      }
      breakingKeyRef.current = hitKey
      return
    }

    if (breakingKeyRef.current !== hitKey) {
      breakingKeyRef.current = hitKey
      progressRef.current = 0
    }

    const duration = breakDurationSeconds(hit.blockId, toolTierForSelectedItem())
    if (duration === null) {
      progressRef.current = 0
      useInteractionStore.getState().setBreakProgress(0)
      return
    }

    progressRef.current += delta / duration
    if (progressRef.current >= 1) {
      const outcome = computeBreakResult(hit.blockId, toolTierForSelectedItem())
      if (outcome.success) {
        useWorldStore.getState().removeBlock(hit.x, hit.y, hit.z)
        if (outcome.drop !== null) {
          useInventoryStore.getState().addItem(outcome.drop, 1)
        }
      }
      progressRef.current = 0
      breakingKeyRef.current = null
    }
    useInteractionStore.getState().setBreakProgress(progressRef.current)
  })

  useEffect(() => {
    function onMouseDown(event) {
      if (document.pointerLockElement === null) return

      if (event.button === 0) {
        leftHeld.current = true
        progressRef.current = 0
      } else if (event.button === 2) {
        const result = targetRef.current
        if (!result || !result.hit) return
        const selected = useInventoryStore.getState().getSelectedItem()
        if (!selected || typeof selected.itemId !== 'number') return
        const { adjacent } = result
        if (!adjacent) return
        const playerPos = usePlayerStore.getState().position
        const placeCheck = computePlaceResult(adjacent, playerPos)
        if (!placeCheck.allowed) return
        useWorldStore.getState().setBlock(adjacent.x, adjacent.y, adjacent.z, selected.itemId)
        useInventoryStore.getState().removeItem(selected.itemId, 1)
      }
    }

    function onMouseUp(event) {
      if (event.button === 0) {
        leftHeld.current = false
        progressRef.current = 0
        useInteractionStore.getState().setBreakProgress(0)
      }
    }

    function onContextMenu(event) {
      event.preventDefault()
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('contextmenu', onContextMenu)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('contextmenu', onContextMenu)
    }
  }, [])
}
