import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { computeVisibleFaces } from './chunkMesh.js'
import { useWorldStore } from './worldStore.js'
import { BLOCK_DATA } from '../constants/blocks.js'
import { WORLD_SIZE, WORLD_HEIGHT } from './terrainGenerator.js'

export default function Chunk() {
  const overrides = useWorldStore((s) => s.overrides)
  const getBlock = useWorldStore((s) => s.getBlock)

  // Recomputes visible faces over the full world on every block edit (~131k cells).
  // Acceptable at this world size (64x64x32); would need chunked incremental
  // re-meshing to scale further.
  const blocksByColor = useMemo(() => {
    const bounds = { minX: 0, maxX: WORLD_SIZE - 1, minY: 0, maxY: WORLD_HEIGHT - 1, minZ: 0, maxZ: WORLD_SIZE - 1 }
    const faces = computeVisibleFaces(bounds, getBlock)

    const seen = new Map() // "x,y,z" -> blockId, dedupes faces into one cube per position
    for (const face of faces) {
      seen.set(`${face.x},${face.y},${face.z}`, face.blockId)
    }

    const byColor = new Map() // color -> [{x,y,z}]
    for (const [key, blockId] of seen.entries()) {
      const color = BLOCK_DATA[blockId].color
      const [x, y, z] = key.split(',').map(Number)
      if (!byColor.has(color)) byColor.set(color, [])
      byColor.get(color).push({ x, y, z })
    }

    return byColor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrides, getBlock])

  return (
    <group>
      {Array.from(blocksByColor.entries()).map(([color, positions]) => (
        <ColorInstances key={color} color={color} positions={positions} />
      ))}
    </group>
  )
}

function ColorInstances({ color, positions }) {
  const meshRef = useRef()

  useEffect(() => {
    if (!meshRef.current) return
    const dummy = new THREE.Object3D()
    positions.forEach((pos, i) => {
      dummy.position.set(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [positions])

  return (
    <instancedMesh ref={meshRef} args={[null, null, positions.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </instancedMesh>
  )
}
