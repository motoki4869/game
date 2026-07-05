export function isWebGLAvailable(documentRef = document) {
  try {
    const canvas = documentRef.createElement('canvas')
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl')
    return Boolean(context)
  } catch {
    return false
  }
}
