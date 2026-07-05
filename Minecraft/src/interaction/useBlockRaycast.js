import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '../world/worldStore.js'
import { usePlayerStore } from '../player/playerStore.js'
import { useInventoryStore } from '../inventory/inventoryStore.js'
import { computeBreakResult, computePlaceResult, TOOL_TIERS } from './blockActions.js'
import { BLOCKS } from '../constants/blocks.js'

const MAX_DISTANCE = 6
const STEP = 0.05

const FACE_OFFSETS = {
  '+x': { x: 1, y: 0, z: 0 },
  '-x': { x: -1, y: 0, z: 0 },
  '+y': { x: 0, y: 1, z: 0 },
  '-y': { x: 0, y: -1, z: 0 },
  '+z': { x: 0, y: 0, z: 1 },
  '-z': { x: 0, y: 0, z: -1 },
}

function raycastBlocks(origin, direction, getBlock) {
  let x = origin.x, y = origin.y, z = origin.z
  let lastEmpty = { x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) }

  for (let t = 0; t < MAX_DISTANCE; t += STEP) {
    x = origin.x + direction.x * t
    y = origin.y + direction.y * t
    z = origin.z + direction.z * t
    const bx = Math.floor(x), by = Math.floor(y), bz = Math.floor(z)
    const block = getBlock(bx, by, bz)
    if (block !== BLOCKS.AIR) {
      return { hit: { x: bx, y: by, z: bz, blockId: block }, adjacent: lastEmpty }
    }
    lastEmpty = { x: bx, y: by, z: bz }
  }
  return { hit: null, adjacent: null }
}

export function useBlockRaycast() {
  const { camera } = useThree()
  const getBlock = useWorldStore((s) => s.getBlock)
  const targetRef = useRef(null)

  useFrame(() => {
    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)
    const result = raycastBlocks(camera.position, direction, getBlock)
    targetRef.current = result
  })

  useEffect(() => {
    function toolTierForSelectedItem() {
      const selected = useInventoryStore.getState().getSelectedItem()
      if (!selected) return 'none'
      if (selected.itemId === 'wood_pickaxe' || selected.itemId === 'wood_axe') return 'wood'
      if (selected.itemId === 'stone_pickaxe' || selected.itemId === 'stone_axe') return 'stone'
      return 'none'
    }

    function onMouseDown(event) {
      if (document.pointerLockElement === null) return
      const result = targetRef.current
      if (!result || !result.hit) return

      if (event.button === 0) {
        const { blockId, x, y, z } = result.hit
        const tier = toolTierForSelectedItem()
        const outcome = computeBreakResult(blockId, tier)
        if (outcome.success) {
          useWorldStore.getState().removeBlock(x, y, z)
          if (outcome.drop !== null) {
            useInventoryStore.getState().addItem(outcome.drop, 1)
          }
        }
      } else if (event.button === 2) {
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

    function onContextMenu(event) {
      event.preventDefault()
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('contextmenu', onContextMenu)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('contextmenu', onContextMenu)
    }
  }, [])
}
