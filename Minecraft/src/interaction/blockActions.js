import { BLOCKS, BLOCK_DATA, getDrop } from '../constants/blocks.js'
import { PLAYER_WIDTH, PLAYER_HEIGHT } from '../player/collision.js'

export const TOOL_TIERS = { none: 0, wood: 1, stone: 2, iron: 3 }

export function canBreak(blockId, toolTier) {
  const data = BLOCK_DATA[blockId]
  if (!data || !data.minTier) return true
  return TOOL_TIERS[toolTier] >= TOOL_TIERS[data.minTier]
}

export function computeBreakResult(blockId, toolTier) {
  if (!canBreak(blockId, toolTier)) {
    return { success: false, drop: null }
  }
  return { success: true, drop: getDrop(blockId) }
}

export function computePlaceResult(targetPos, playerPos) {
  const halfWidth = PLAYER_WIDTH / 2

  const playerMinX = playerPos.x - halfWidth
  const playerMaxX = playerPos.x + halfWidth
  const playerMinY = playerPos.y
  const playerMaxY = playerPos.y + PLAYER_HEIGHT
  const playerMinZ = playerPos.z - halfWidth
  const playerMaxZ = playerPos.z + halfWidth

  const blockMinX = targetPos.x
  const blockMaxX = targetPos.x + 1
  const blockMinY = targetPos.y
  const blockMaxY = targetPos.y + 1
  const blockMinZ = targetPos.z
  const blockMaxZ = targetPos.z + 1

  const overlapsX = playerMinX < blockMaxX && playerMaxX > blockMinX
  const overlapsY = playerMinY < blockMaxY && playerMaxY > blockMinY
  const overlapsZ = playerMinZ < blockMaxZ && playerMaxZ > blockMinZ

  const allowed = !(overlapsX && overlapsY && overlapsZ)
  return { allowed }
}
