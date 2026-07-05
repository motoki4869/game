import { isSolid } from '../constants/blocks.js'

const DIRECTIONS = [
  { direction: '+x', dx: 1, dy: 0, dz: 0 },
  { direction: '-x', dx: -1, dy: 0, dz: 0 },
  { direction: '+y', dx: 0, dy: 1, dz: 0 },
  { direction: '-y', dx: 0, dy: -1, dz: 0 },
  { direction: '+z', dx: 0, dy: 0, dz: 1 },
  { direction: '-z', dx: 0, dy: 0, dz: -1 },
]

export function computeVisibleFaces(bounds, getBlock) {
  const { minX, maxX, minY, maxY, minZ, maxZ } = bounds
  const faces = []

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        const blockId = getBlock(x, y, z)
        if (!isSolid(blockId)) continue

        for (const { direction, dx, dy, dz } of DIRECTIONS) {
          const neighbor = getBlock(x + dx, y + dy, z + dz)
          if (!isSolid(neighbor)) {
            faces.push({ x, y, z, blockId, direction })
          }
        }
      }
    }
  }

  return faces
}
