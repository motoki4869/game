import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { computeVisibleFaces } from './chunkMesh.js'
import { useWorldStore, CHUNK_SIZE } from './worldStore.js'
import { BLOCKS } from '../constants/blocks.js'
import { WORLD_SIZE, WORLD_HEIGHT } from './terrainGenerator.js'
import { getBlockMaterials } from './textures.js'

const CHUNKS_PER_AXIS = WORLD_SIZE / CHUNK_SIZE
const boxGeometry = new THREE.BoxGeometry(1, 1, 1)

export default function World() {
  const chunks = []
  for (let cx = 0; cx < CHUNKS_PER_AXIS; cx++) {
    for (let cz = 0; cz < CHUNKS_PER_AXIS; cz++) {
      chunks.push(<SubChunk key={`${cx},${cz}`} cx={cx} cz={cz} />)
    }
  }
  return <group>{chunks}</group>
}

// Each 16x16 column re-meshes independently: editing a block only bumps its
// own chunk's version (plus a border neighbor), so a click no longer
// recomputes the whole 64x64x32 world.
function SubChunk({ cx, cz }) {
  const version = useWorldStore((s) => s.chunkVersions.get(`${cx},${cz}`) ?? 0)
  const getBlock = useWorldStore((s) => s.getBlock)

  const { byBlockId, waterPositions } = useMemo(() => {
    const bounds = {
      minX: cx * CHUNK_SIZE,
      maxX: cx * CHUNK_SIZE + CHUNK_SIZE - 1,
      minY: 0,
      maxY: WORLD_HEIGHT - 1,
      minZ: cz * CHUNK_SIZE,
      maxZ: cz * CHUNK_SIZE + CHUNK_SIZE - 1,
    }
    const faces = computeVisibleFaces(bounds, getBlock)

    const seen = new Map()
    for (const face of faces) {
      seen.set(`${face.x},${face.y},${face.z}`, face.blockId)
    }

    const byBlockId = new Map()
    for (const [key, blockId] of seen.entries()) {
      const [x, y, z] = key.split(',').map(Number)
      if (!byBlockId.has(blockId)) byBlockId.set(blockId, [])
      byBlockId.get(blockId).push({ x, y, z })
    }

    const waterPositions = []
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      for (let y = bounds.minY; y <= bounds.maxY; y++) {
        for (let z = bounds.minZ; z <= bounds.maxZ; z++) {
          if (getBlock(x, y, z) !== BLOCKS.WATER) continue
          const exposed =
            getBlock(x + 1, y, z) === BLOCKS.AIR ||
            getBlock(x - 1, y, z) === BLOCKS.AIR ||
            getBlock(x, y + 1, z) === BLOCKS.AIR ||
            getBlock(x, y - 1, z) === BLOCKS.AIR ||
            getBlock(x, y, z + 1) === BLOCKS.AIR ||
            getBlock(x, y, z - 1) === BLOCKS.AIR
          if (exposed) waterPositions.push({ x, y, z })
        }
      }
    }

    return { byBlockId, waterPositions }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, cx, cz, getBlock])

  const materials = getBlockMaterials()

  return (
    <group>
      {Array.from(byBlockId.entries()).map(([blockId, positions]) => (
        <BlockInstances key={blockId} materials={materials[blockId]} positions={positions} />
      ))}
      {waterPositions.length > 0 && (
        <WaterInstances material={materials.water} positions={waterPositions} />
      )}
    </group>
  )
}

function BlockInstances({ materials, positions }) {
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

  return <instancedMesh ref={meshRef} args={[boxGeometry, materials, positions.length]} />
}

function WaterInstances({ material, positions }) {
  const meshRef = useRef()

  useEffect(() => {
    if (!meshRef.current) return
    const dummy = new THREE.Object3D()
    positions.forEach((pos, i) => {
      // Water sits slightly below the block top, like vanilla's surface dip.
      dummy.position.set(pos.x + 0.5, pos.y + 0.45, pos.z + 0.5)
      dummy.scale.set(1, 0.9, 1)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [positions])

  return <instancedMesh ref={meshRef} args={[boxGeometry, material, positions.length]} />
}
