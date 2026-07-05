export const VOID_Y_THRESHOLD = -5

export function isBelowVoid(y, threshold = VOID_Y_THRESHOLD) {
  return y < threshold
}
