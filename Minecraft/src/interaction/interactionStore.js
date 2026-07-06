import { create } from 'zustand'

// Per-frame interaction state shared between the raycast hook and the
// visual feedback components (selection outline, break-progress cracks).
export const useInteractionStore = create((set) => ({
  target: null, // { hit: {x,y,z,blockId}, adjacent: {x,y,z} } | null
  breakProgress: 0, // 0..1 while holding left mouse on a breakable block

  setTarget(target) {
    set({ target })
  },

  setBreakProgress(breakProgress) {
    set({ breakProgress })
  },
}))
