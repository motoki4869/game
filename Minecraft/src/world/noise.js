// Deterministic value-noise (not true Perlin, but same smooth-terrain purpose)
// implemented with no external dependency: a seeded pseudo-random gradient
// per integer lattice point, bilinearly interpolated with smoothstep easing.

function hash(x, y, seed) {
  let h = seed * 374761393 + x * 668265263 + y * 2147483647
  h = (h ^ (h >>> 13)) * 1274126177
  h = h ^ (h >>> 16)
  return ((h % 2147483647) + 2147483647) % 2147483647 / 2147483647
}

function smoothstep(t) {
  return t * t * (3 - 2 * t)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

export function createNoise2D(seed = 0) {
  return function noise2D(x, y) {
    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const x1 = x0 + 1
    const y1 = y0 + 1

    const sx = smoothstep(x - x0)
    const sy = smoothstep(y - y0)

    const n00 = hash(x0, y0, seed) * 2 - 1
    const n10 = hash(x1, y0, seed) * 2 - 1
    const n01 = hash(x0, y1, seed) * 2 - 1
    const n11 = hash(x1, y1, seed) * 2 - 1

    const ix0 = lerp(n00, n10, sx)
    const ix1 = lerp(n01, n11, sx)

    return lerp(ix0, ix1, sy)
  }
}
