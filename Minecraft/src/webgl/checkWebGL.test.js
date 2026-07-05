import { describe, it, expect } from 'vitest'
import { isWebGLAvailable } from './checkWebGL.js'

function fakeDocument(contextResult) {
  return {
    createElement: () => ({
      getContext: () => contextResult,
    }),
  }
}

function throwingDocument() {
  return {
    createElement: () => {
      throw new Error('no canvas support')
    },
  }
}

describe('isWebGLAvailable', () => {
  it('returns true when a context is returned', () => {
    expect(isWebGLAvailable(fakeDocument({}))).toBe(true)
  })

  it('returns false when no context is returned', () => {
    expect(isWebGLAvailable(fakeDocument(null))).toBe(false)
  })

  it('returns false when canvas creation throws', () => {
    expect(isWebGLAvailable(throwingDocument())).toBe(false)
  })
})
