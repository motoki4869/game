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
  const withinX = Math.abs(targetPos.x - playerPos.x) < halfWidth + 0.5 && Math.floor(targetPos.x) === Math.floor(playerPos.x)
  const withinZ = Math.floor(targetPos.z) === Math.floor(playerPos.z)
  const withinY = targetPos.y >= Math.floor(playerPos.y) && targetPos.y <= Math.floor(playerPos.y + PLAYER_HEIGHT)
  const allowed = !(withinX && withinZ && withinY)
  return { allowed }
}
