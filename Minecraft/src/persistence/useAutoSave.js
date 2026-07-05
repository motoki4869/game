import { useEffect } from 'react'
import { saveToLocalStorage, loadFromLocalStorage } from './saveGame.js'
import { useWorldStore } from '../world/worldStore.js'
import { usePlayerStore } from '../player/playerStore.js'
import { useInventoryStore } from '../inventory/inventoryStore.js'

function buildSavePayload(time) {
  const world = useWorldStore.getState()
  const player = usePlayerStore.getState()
  const inventory = useInventoryStore.getState()

  return {
    seed: world.seed,
    overridesEntries: world.getOverridesEntries(),
    playerPosition: player.position,
    playerYaw: player.yaw,
    playerPitch: player.pitch,
    health: player.health,
    hunger: player.hunger,
    hotbar: inventory.hotbar,
    inventory: inventory.inventory,
    selectedHotbarIndex: inventory.selectedHotbarIndex,
    time,
  }
}

export function loadGameOnStartup() {
  const saved = loadFromLocalStorage()
  if (!saved) return null

  useWorldStore.getState().resetWorld(saved.seed)
  useWorldStore.getState().loadOverrides(saved.overridesEntries)
  usePlayerStore.getState().setPosition(saved.playerPosition)
  usePlayerStore.getState().setLook(saved.playerYaw, saved.playerPitch)
  usePlayerStore.getState().setHunger(saved.hunger)
  if (saved.health > usePlayerStore.getState().health) {
    usePlayerStore.getState().heal(saved.health - usePlayerStore.getState().health)
  } else if (saved.health < usePlayerStore.getState().health) {
    usePlayerStore.getState().damage(usePlayerStore.getState().health - saved.health)
  }
  useInventoryStore.getState().loadInventoryState({
    hotbar: saved.hotbar,
    inventory: saved.inventory,
    selectedHotbarIndex: saved.selectedHotbarIndex,
  })

  return saved.time
}

export function useAutoSave(getTime) {
  useEffect(() => {
    function save() {
      saveToLocalStorage(buildSavePayload(getTime()))
    }

    const intervalId = setInterval(save, 5000)
    window.addEventListener('beforeunload', save)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('beforeunload', save)
    }
  }, [getTime])
}
