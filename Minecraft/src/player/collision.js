import { isSolid } from '../constants/blocks.js'

export const PLAYER_WIDTH = 0.6
export const PLAYER_HEIGHT = 1.8
const HALF_WIDTH = PLAYER_WIDTH / 2

function collidesAt(pos, getBlock) {
  const minX = Math.floor(pos.x - HALF_WIDTH)
  const maxX = Math.floor(pos.x + HALF_WIDTH)
  const minY = Math.floor(pos.y)
  const maxY = Math.floor(pos.y + PLAYER_HEIGHT)
  const minZ = Math.floor(pos.z - HALF_WIDTH)
  const maxZ = Math.floor(pos.z + HALF_WIDTH)

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        if (isSolid(getBlock(x, y, z))) return true
      }
    }
  }
  return false
}

export function resolveAxisMovement(position, delta, getBlock) {
  let { x, y, z } = position

  const tryX = { x: x + delta.x, y, z }
  if (!collidesAt(tryX, getBlock)) x = tryX.x

  const tryY = { x, y: y + delta.y, z }
  if (!collidesAt(tryY, getBlock)) y = tryY.y

  const tryZ = { x, y, z: z + delta.z }
  if (!collidesAt(tryZ, getBlock)) z = tryZ.z

  return { x, y, z }
}
