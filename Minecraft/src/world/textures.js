import * as THREE from 'three'
import { BLOCKS } from '../constants/blocks.js'

// Procedurally drawn 16x16 pixel-art textures (NearestFilter) so the world
// reads as "Minecraft-like" without shipping image assets. Deterministic
// per-texture via a tiny seeded PRNG so reloads look identical.

const SIZE = 16

function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeCanvas(draw, seed) {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  draw(ctx, mulberry32(seed))
  return canvas
}

function fillSpeckled(ctx, rand, base, speckles) {
  ctx.fillStyle = base
  ctx.fillRect(0, 0, SIZE, SIZE)
  for (const { color, count } of speckles) {
    ctx.fillStyle = color
    for (let i = 0; i < count; i++) {
      ctx.fillRect(Math.floor(rand() * SIZE), Math.floor(rand() * SIZE), 1, 1)
    }
  }
}

function drawGrassTop(ctx, rand) {
  fillSpeckled(ctx, rand, '#5d9c3f', [
    { color: '#6fb04a', count: 60 },
    { color: '#4f8a33', count: 60 },
    { color: '#468029', count: 30 },
  ])
}

function drawDirt(ctx, rand) {
  fillSpeckled(ctx, rand, '#8a5f3c', [
    { color: '#9c6d46', count: 50 },
    { color: '#7a5233', count: 50 },
    { color: '#6b472b', count: 25 },
  ])
}

function drawGrassSide(ctx, rand) {
  drawDirt(ctx, rand)
  ctx.fillStyle = '#5d9c3f'
  ctx.fillRect(0, 0, SIZE, 3)
  ctx.fillStyle = '#4f8a33'
  for (let x = 0; x < SIZE; x++) {
    if (rand() > 0.5) ctx.fillRect(x, 3, 1, 1)
    if (rand() > 0.8) ctx.fillRect(x, 4, 1, 1)
  }
}

function drawStone(ctx, rand) {
  fillSpeckled(ctx, rand, '#8b8b8b', [
    { color: '#9a9a9a', count: 60 },
    { color: '#7b7b7b', count: 60 },
    { color: '#6f6f6f', count: 25 },
  ])
}

function drawSand(ctx, rand) {
  fillSpeckled(ctx, rand, '#dbd19c', [
    { color: '#e8dfae', count: 55 },
    { color: '#c9bd85', count: 55 },
  ])
}

function drawWater(ctx, rand) {
  fillSpeckled(ctx, rand, '#3f76e4', [
    { color: '#4d84f0', count: 45 },
    { color: '#3568cf', count: 45 },
  ])
}

function drawLogSide(ctx, rand) {
  ctx.fillStyle = '#6b4a2b'
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.fillStyle = '#59391f'
  for (let x = 0; x < SIZE; x += 4) {
    ctx.fillRect(x, 0, 1, SIZE)
  }
  ctx.fillStyle = '#7a5836'
  for (let i = 0; i < 30; i++) {
    ctx.fillRect(Math.floor(rand() * SIZE), Math.floor(rand() * SIZE), 1, 1)
  }
}

function drawLogTop(ctx) {
  ctx.fillStyle = '#6b4a2b'
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.fillStyle = '#b08d5e'
  ctx.fillRect(2, 2, 12, 12)
  ctx.fillStyle = '#8a6b42'
  ctx.fillRect(4, 4, 8, 8)
  ctx.fillStyle = '#b08d5e'
  ctx.fillRect(6, 6, 4, 4)
}

function drawLeaves(ctx, rand) {
  fillSpeckled(ctx, rand, '#3e7a24', [
    { color: '#4c8f2e', count: 70 },
    { color: '#2f611a', count: 70 },
    { color: '#255014', count: 30 },
  ])
}

function drawPlanks(ctx, rand) {
  ctx.fillStyle = '#a9835a'
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.fillStyle = '#8f6c47'
  for (let y = 3; y < SIZE; y += 4) {
    ctx.fillRect(0, y, SIZE, 1)
  }
  ctx.fillStyle = '#b8926a'
  for (let i = 0; i < 35; i++) {
    ctx.fillRect(Math.floor(rand() * SIZE), Math.floor(rand() * SIZE), 1, 1)
  }
}

function drawOre(oreColor) {
  return (ctx, rand) => {
    drawStone(ctx, rand)
    ctx.fillStyle = oreColor
    for (let i = 0; i < 7; i++) {
      const x = 1 + Math.floor(rand() * (SIZE - 3))
      const y = 1 + Math.floor(rand() * (SIZE - 3))
      ctx.fillRect(x, y, 2, 2)
    }
  }
}

let cache = null

function toTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function opaque(map) {
  return new THREE.MeshLambertMaterial({ map })
}

// Box face order: +x, -x, +y (top), -y (bottom), +z, -z
function buildMaterials() {
  const t = {
    grassTop: toTexture(makeCanvas(drawGrassTop, 11)),
    grassSide: toTexture(makeCanvas(drawGrassSide, 12)),
    dirt: toTexture(makeCanvas(drawDirt, 13)),
    stone: toTexture(makeCanvas(drawStone, 14)),
    sand: toTexture(makeCanvas(drawSand, 15)),
    water: toTexture(makeCanvas(drawWater, 16)),
    logSide: toTexture(makeCanvas(drawLogSide, 17)),
    logTop: toTexture(makeCanvas(drawLogTop, 18)),
    leaves: toTexture(makeCanvas(drawLeaves, 19)),
    planks: toTexture(makeCanvas(drawPlanks, 20)),
    coalOre: toTexture(makeCanvas(drawOre('#2b2b2b'), 21)),
    ironOre: toTexture(makeCanvas(drawOre('#d8af93'), 22)),
  }

  const grassSide = opaque(t.grassSide)
  const logSide = opaque(t.logSide)
  const logTop = opaque(t.logTop)

  const same = (map) => {
    const m = opaque(map)
    return [m, m, m, m, m, m]
  }

  return {
    [BLOCKS.GRASS]: [grassSide, grassSide, opaque(t.grassTop), opaque(t.dirt), grassSide, grassSide],
    [BLOCKS.DIRT]: same(t.dirt),
    [BLOCKS.STONE]: same(t.stone),
    [BLOCKS.SAND]: same(t.sand),
    [BLOCKS.WOOD]: [logSide, logSide, logTop, logTop, logSide, logSide],
    [BLOCKS.LEAVES]: same(t.leaves),
    [BLOCKS.PLANKS]: same(t.planks),
    [BLOCKS.COAL_ORE]: same(t.coalOre),
    [BLOCKS.IRON_ORE]: same(t.ironOre),
    water: new THREE.MeshLambertMaterial({
      map: t.water,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    }),
  }
}

export function getBlockMaterials() {
  if (!cache) cache = buildMaterials()
  return cache
}
