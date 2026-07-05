export const SAVE_KEY = 'minecraft-clone-save-v1'
export const SAVE_VERSION = 1

export function serializeSave(payload) {
  return JSON.stringify({ version: SAVE_VERSION, ...payload })
}

export function deserializeSave(json) {
  try {
    const parsed = JSON.parse(json)
    if (parsed.version !== SAVE_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

export function saveToLocalStorage(payload, storage = localStorage) {
  try {
    const json = serializeSave(payload)
    storage.setItem(SAVE_KEY, json)
    return true
  } catch {
    return false
  }
}

export function loadFromLocalStorage(storage = localStorage) {
  const json = storage.getItem(SAVE_KEY)
  if (json === null || json === undefined) return null
  return deserializeSave(json)
}
