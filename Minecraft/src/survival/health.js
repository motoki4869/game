function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function applyHungerTick(hunger, elapsedSeconds) {
  const decay = elapsedSeconds / 30
  return clamp(hunger - decay, 0, 20)
}

export function applyStarvationDamage(health, hunger, elapsedSeconds) {
  if (hunger > 0) return health
  const damage = elapsedSeconds / 10
  return clamp(health - damage, 0, 20)
}

export function applyRegeneration(health, hunger, elapsedSeconds) {
  if (hunger < 18) return health
  const heal = elapsedSeconds / 8
  return clamp(health + heal, 0, 20)
}
