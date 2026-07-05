import { create } from 'zustand'

export const HOTBAR_SIZE = 9
export const INVENTORY_SIZE = 27

function addToSlots(slots, itemId, count) {
  const next = [...slots]
  let remaining = count

  for (let i = 0; i < next.length && remaining > 0; i++) {
    if (next[i] && String(next[i].itemId) === String(itemId)) {
      next[i] = { itemId, count: next[i].count + remaining }
      remaining = 0
    }
  }

  for (let i = 0; i < next.length && remaining > 0; i++) {
    if (!next[i]) {
      next[i] = { itemId, count: remaining }
      remaining = 0
    }
  }

  return { slots: next, remaining }
}

function removeFromSlots(slots, itemId, count) {
  const next = [...slots]
  let remaining = count

  for (let i = 0; i < next.length && remaining > 0; i++) {
    if (next[i] && String(next[i].itemId) === String(itemId)) {
      const take = Math.min(next[i].count, remaining)
      remaining -= take
      const newCount = next[i].count - take
      next[i] = newCount > 0 ? { itemId, count: newCount } : null
    }
  }

  return { slots: next, removed: count - remaining }
}

function countOf(hotbar, inventory, itemId) {
  const all = [...hotbar, ...inventory]
  return all.reduce((sum, slot) => sum + (slot && String(slot.itemId) === String(itemId) ? slot.count : 0), 0)
}

export const useInventoryStore = create((set, get) => ({
  hotbar: new Array(HOTBAR_SIZE).fill(null),
  inventory: new Array(INVENTORY_SIZE).fill(null),
  selectedHotbarIndex: 0,

  addItem(itemId, count = 1) {
    const { hotbar } = get()
    const hotbarResult = addToSlots(hotbar, itemId, count)
    if (hotbarResult.remaining === 0) {
      set({ hotbar: hotbarResult.slots })
      return true
    }

    const { inventory } = get()
    const invResult = addToSlots(inventory, itemId, hotbarResult.remaining)
    set({ hotbar: hotbarResult.slots, inventory: invResult.slots })
    return invResult.remaining === 0
  },

  removeItem(itemId, count = 1) {
    const { hotbar, inventory } = get()
    const hotbarResult = removeFromSlots(hotbar, itemId, count)
    const stillNeeded = count - hotbarResult.removed
    const invResult = stillNeeded > 0
      ? removeFromSlots(inventory, itemId, stillNeeded)
      : { slots: inventory, removed: 0 }

    set({ hotbar: hotbarResult.slots, inventory: invResult.slots })
    return hotbarResult.removed + invResult.removed
  },

  hasItems(requirements) {
    const { hotbar, inventory } = get()
    return Object.entries(requirements).every(
      ([itemId, needed]) => countOf(hotbar, inventory, itemId) >= needed
    )
  },

  consumeItems(requirements) {
    const { removeItem } = get()
    for (const [itemId, needed] of Object.entries(requirements)) {
      removeItem(itemId, needed)
    }
    return true
  },

  selectHotbarIndex(index) {
    set({ selectedHotbarIndex: index })
  },

  getSelectedItem() {
    const { hotbar, selectedHotbarIndex } = get()
    return hotbar[selectedHotbarIndex] ?? null
  },

  loadInventoryState({ hotbar, inventory, selectedHotbarIndex }) {
    set({ hotbar, inventory, selectedHotbarIndex })
  },
}))
