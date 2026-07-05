import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { advanceTime, lightIntensityFor } from './dayNight.js'
import { applyHungerTick, applyStarvationDamage, applyRegeneration } from './health.js'
import { usePlayerStore } from '../player/playerStore.js'

export function useSurvivalTick() {
  const timeRef = useRef(0)

  useFrame((_, delta) => {
    timeRef.current = advanceTime(timeRef.current, delta)

    const store = usePlayerStore.getState()
    if (store.isDead) return

    const newHunger = applyHungerTick(store.hunger, delta)
    let newHealth = applyStarvationDamage(store.health, newHunger, delta)
    newHealth = applyRegeneration(newHealth, newHunger, delta)

    store.setHunger(newHunger)
    if (newHealth < store.health) {
      store.damage(store.health - newHealth)
    } else if (newHealth > store.health) {
      store.heal(newHealth - store.health)
    }
  })

  return {
    getTime: () => timeRef.current,
    getLightIntensity: () => lightIntensityFor(timeRef.current),
  }
}
