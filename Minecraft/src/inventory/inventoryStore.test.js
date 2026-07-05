import { describe, it, expect, beforeEach } from 'vitest'
import { useInventoryStore, HOTBAR_SIZE, INVENTORY_SIZE } from './inventoryStore.js'

describe('inventoryStore', () => {
  beforeEach(() => {
    useInventoryStore.getState().loadInventoryState({
      hotbar: new Array(HOTBAR_SIZE).fill(null),
      inventory: new Array(INVENTORY_SIZE).fill(null),
      selectedHotbarIndex: 0,
    })
  })

  it('addItem places a new item into the first empty hotbar slot', () => {
    useInventoryStore.getState().addItem('coal', 3)
    expect(useInventoryStore.getState().hotbar[0]).toEqual({ itemId: 'coal', count: 3 })
  })

  it('addItem stacks onto an existing matching slot instead of using a new one', () => {
    useInventoryStore.getState().addItem('coal', 3)
    useInventoryStore.getState().addItem('coal', 2)
    const state = useInventoryStore.getState()
    expect(state.hotbar[0]).toEqual({ itemId: 'coal', count: 5 })
    expect(state.hotbar[1]).toBe(null)
  })

  it('addItem overflows into inventory once hotbar is full of different items', () => {
    const store = useInventoryStore.getState()
    for (let i = 0; i < HOTBAR_SIZE; i++) store.addItem(`item${i}`, 1)
    store.addItem('overflow', 1)
    expect(useInventoryStore.getState().inventory[0]).toEqual({ itemId: 'overflow', count: 1 })
  })

  it('removeItem removes the given count and clears an emptied slot', () => {
    const store = useInventoryStore.getState()
    store.addItem('coal', 5)
    const removed = store.removeItem('coal', 5)
    expect(removed).toBe(5)
    expect(useInventoryStore.getState().hotbar[0]).toBe(null)
  })

  it('removeItem removes partial count when fewer are available', () => {
    const store = useInventoryStore.getState()
    store.addItem('coal', 2)
    const removed = store.removeItem('coal', 5)
    expect(removed).toBe(2)
  })

  it('hasItems reports whether the required counts are available', () => {
    const store = useInventoryStore.getState()
    store.addItem('coal', 3)
    expect(store.hasItems({ coal: 3 })).toBe(true)
    expect(store.hasItems({ coal: 4 })).toBe(false)
  })

  it('consumeItems removes exactly the required amounts', () => {
    const store = useInventoryStore.getState()
    store.addItem('coal', 3)
    store.addItem('stick', 2)
    store.consumeItems({ coal: 3, stick: 2 })
    const state = useInventoryStore.getState()
    expect(state.hasItems({ coal: 1 })).toBe(false)
    expect(state.hasItems({ stick: 1 })).toBe(false)
  })

  it('selectHotbarIndex and getSelectedItem work together', () => {
    const store = useInventoryStore.getState()
    store.addItem('coal', 1)
    store.selectHotbarIndex(0)
    expect(useInventoryStore.getState().getSelectedItem()).toEqual({ itemId: 'coal', count: 1 })
  })
})
