import { describe, it, expect } from 'vitest'
import {
  serializeSave,
  deserializeSave,
  saveToLocalStorage,
  loadFromLocalStorage,
  SAVE_KEY,
  SAVE_VERSION,
} from './saveGame.js'

const samplePayload = {
  seed: 5,
  overridesEntries: [['1,1,1', 3]],
  playerPosition: { x: 1, y: 2, z: 3 },
  playerYaw: 0.5,
  playerPitch: -0.1,
  health: 18,
  hunger: 15,
  hotbar: [null],
  inventory: [],
  selectedHotbarIndex: 0,
  time: 120,
}

function makeFakeStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  }
}

describe('serializeSave / deserializeSave', () => {
  it('round-trips a payload', () => {
    const json = serializeSave(samplePayload)
    const parsed = deserializeSave(json)
    expect(parsed).toMatchObject(samplePayload)
  })

  it('deserializeSave returns null for invalid JSON', () => {
    expect(deserializeSave('not json')).toBe(null)
  })

  it('deserializeSave returns null for a mismatched version', () => {
    const json = JSON.stringify({ version: SAVE_VERSION + 1, ...samplePayload })
    expect(deserializeSave(json)).toBe(null)
  })
})

describe('saveToLocalStorage / loadFromLocalStorage', () => {
  it('saves and loads a payload through a storage-like object', () => {
    const storage = makeFakeStorage()
    const success = saveToLocalStorage(samplePayload, storage)
    expect(success).toBe(true)
    const loaded = loadFromLocalStorage(storage)
    expect(loaded).toMatchObject(samplePayload)
  })

  it('returns null when nothing has been saved', () => {
    const storage = makeFakeStorage()
    expect(loadFromLocalStorage(storage)).toBe(null)
  })

  it('returns false from saveToLocalStorage when storage.setItem throws', () => {
    const storage = {
      getItem: () => null,
      setItem: () => { throw new Error('quota exceeded') },
    }
    expect(saveToLocalStorage(samplePayload, storage)).toBe(false)
  })

  it('returns null from loadFromLocalStorage when stored data is corrupted', () => {
    const storage = makeFakeStorage()
    storage.setItem(SAVE_KEY, '{corrupted')
    expect(loadFromLocalStorage(storage)).toBe(null)
  })
})
