export const MOB_SPEED = 1.5
export const MOB_AGGRO_RANGE = 8
export const MOB_ATTACK_RANGE = 1.2

function distance(a, b) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function computeMobStep(mob, playerPos, elapsedSeconds) {
  const dist = distance(mob.position, playerPos)

  if (dist > MOB_AGGRO_RANGE) {
    return { position: { ...mob.position }, isAttacking: false }
  }

  const maxStep = MOB_SPEED * elapsedSeconds
  const travel = Math.min(maxStep, dist)

  const dirX = dist === 0 ? 0 : (playerPos.x - mob.position.x) / dist
  const dirY = dist === 0 ? 0 : (playerPos.y - mob.position.y) / dist
  const dirZ = dist === 0 ? 0 : (playerPos.z - mob.position.z) / dist

  const position = {
    x: mob.position.x + dirX * travel,
    y: mob.position.y + dirY * travel,
    z: mob.position.z + dirZ * travel,
  }

  const newDist = distance(position, playerPos)
  return { position, isAttacking: newDist <= MOB_ATTACK_RANGE }
}
