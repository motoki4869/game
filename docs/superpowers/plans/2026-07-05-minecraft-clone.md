# マイクラ風サバイバルゲーム Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `game/Minecraft` に、React + Vite + Tailwind + Three.js (react-three-fiber) を使ったブラウザ動作のボクセル型サバイバルゲームを実装する。

**Architecture:** 純粋ロジック（地形生成・衝突判定・クラフト判定・体力/空腹度・昼夜サイクル・Mob AI・セーブ/ロード）はテスト可能な単一責任のモジュールとして先に実装し、その後にThree.js/react-three-fiberでそれらを描画・操作に配線するReactコンポーネントを積み上げる。状態管理はZustandの3ストア(`worldStore`, `playerStore`, `inventoryStore`)に分離する。

**Tech Stack:** React 19, Vite 7, Tailwind CSS 4, Three.js, @react-three/fiber, @react-three/drei, Zustand, Vitest

## Global Constraints

- プロジェクトルート: `game/Minecraft/`（既存の`game/Tetris`と同じconfig構成に合わせる）
- ワールドサイズ: 64×64ブロック固定（高さは0〜32）
- ブロック種類: GRASS, DIRT, STONE, SAND, WATER, WOOD, LEAVES, PLANKS, COAL_ORE, IRON_ORE の10種（AIR含め11 ID）
- 操作: WASD移動 + マウス視点(Pointer Lock API) + 左クリック破壊 / 右クリック設置（本家PC版と同じ）
- 保存先: `localStorage`、キーは`minecraft-clone-save-v1`
- 純粋ロジックのみVitestでユニットテスト対象。描画・入力系は手動確認（このplan内では各タスクの最後に手動確認手順を明記）

---

### Task 1: プロジェクトscaffold

**Files:**
- Create: `game/Minecraft/package.json`
- Create: `game/Minecraft/vite.config.js`
- Create: `game/Minecraft/tailwind.config.js`
- Create: `game/Minecraft/postcss.config.js`
- Create: `game/Minecraft/index.html`
- Create: `game/Minecraft/eslint.config.js`
- Create: `game/Minecraft/.gitignore`
- Create: `game/Minecraft/src/main.jsx`
- Create: `game/Minecraft/src/index.css`
- Create: `game/Minecraft/src/App.jsx`

**Interfaces:**
- Produces: `App` default export (React component) that later tasks will extend. `npm run dev`, `npm run build`, `npm run test` scripts.

- [ ] **Step 1: Create directory and config files**

`game/Minecraft/.gitignore`:
```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```

`game/Minecraft/package.json`:
```json
{
  "name": "minecraft",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "@react-three/drei": "^9.114.0",
    "@react-three/fiber": "^9.0.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "three": "^0.180.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@tailwindcss/postcss": "^4.1.18",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "autoprefixer": "^10.4.23",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.18",
    "vite": "^7.2.4",
    "vitest": "^3.0.5"
  }
}
```

`game/Minecraft/vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: false,
  },
})
```

`game/Minecraft/tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

`game/Minecraft/postcss.config.js`:
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

`game/Minecraft/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>minecraft-clone</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

`game/Minecraft/eslint.config.js`:
```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
```

`game/Minecraft/src/index.css`:
```css
@import "tailwindcss";

html, body, #root {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
```

`game/Minecraft/src/main.jsx`:
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`game/Minecraft/src/App.jsx`:
```jsx
export default function App() {
  return (
    <div className="w-screen h-screen bg-black text-white flex items-center justify-center">
      <p>Minecraft clone scaffold OK</p>
    </div>
  )
}
```

- [ ] **Step 2: Install dependencies**

Run: `cd game/Minecraft && npm install`
Expected: exits 0, `node_modules` created.

- [ ] **Step 3: Verify dev server starts**

Run: `cd game/Minecraft && npm run build`
Expected: exits 0, `dist/` produced with no errors.

- [ ] **Step 4: Add a trivial vitest sanity test**

Create `game/Minecraft/src/sanity.test.js`:
```js
import { describe, it, expect } from 'vitest'

describe('sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

Run: `cd game/Minecraft && npm run test`
Expected: PASS (1 test)

Delete `game/Minecraft/src/sanity.test.js` after confirming (it was only to prove the test runner works).

- [ ] **Step 5: Commit**

```bash
cd game/Minecraft && git add -A && git commit -m "feat(minecraft): scaffold Vite+React+Tailwind+Three.js project"
```

---

### Task 2: ブロック定義

**Files:**
- Create: `game/Minecraft/src/constants/blocks.js`
- Test: `game/Minecraft/src/constants/blocks.test.js`

**Interfaces:**
- Produces: `BLOCKS` (object mapping name→numeric id, includes `AIR: 0`), `BLOCK_DATA` (object keyed by id → `{ name, color, hardness, drops, solid, minTier }`), `isSolid(blockId)`, `getDrop(blockId)`.

- [ ] **Step 1: Write failing tests**

`game/Minecraft/src/constants/blocks.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { BLOCKS, BLOCK_DATA, isSolid, getDrop } from './blocks.js'

describe('blocks', () => {
  it('AIR is 0 and not solid', () => {
    expect(BLOCKS.AIR).toBe(0)
    expect(isSolid(BLOCKS.AIR)).toBe(false)
  })

  it('GRASS is solid and drops DIRT', () => {
    expect(isSolid(BLOCKS.GRASS)).toBe(true)
    expect(getDrop(BLOCKS.GRASS)).toBe(BLOCKS.DIRT)
  })

  it('WATER is not solid and drops nothing', () => {
    expect(isSolid(BLOCKS.WATER)).toBe(false)
    expect(getDrop(BLOCKS.WATER)).toBe(null)
  })

  it('LEAVES is solid but drops nothing', () => {
    expect(isSolid(BLOCKS.LEAVES)).toBe(true)
    expect(getDrop(BLOCKS.LEAVES)).toBe(null)
  })

  it('COAL_ORE drops "coal" item, IRON_ORE drops "iron_ore" item', () => {
    expect(getDrop(BLOCKS.COAL_ORE)).toBe('coal')
    expect(getDrop(BLOCKS.IRON_ORE)).toBe('iron_ore')
  })

  it('every non-AIR block has a BLOCK_DATA entry with a color and hardness', () => {
    for (const [name, id] of Object.entries(BLOCKS)) {
      if (name === 'AIR') continue
      expect(BLOCK_DATA[id]).toBeDefined()
      expect(typeof BLOCK_DATA[id].color).toBe('string')
      expect(typeof BLOCK_DATA[id].hardness).toBe('number')
    }
  })
})
```

- [ ] **Step 2: Run tests, confirm failure**

Run: `cd game/Minecraft && npm run test -- blocks`
Expected: FAIL with "Cannot find module './blocks.js'" or similar.

- [ ] **Step 3: Implement**

`game/Minecraft/src/constants/blocks.js`:
```js
export const BLOCKS = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  WATER: 5,
  WOOD: 6,
  LEAVES: 7,
  PLANKS: 8,
  COAL_ORE: 9,
  IRON_ORE: 10,
}

export const BLOCK_DATA = {
  [BLOCKS.GRASS]: { name: 'grass', color: '#4caf50', hardness: 1, drops: BLOCKS.DIRT, solid: true, minTier: null },
  [BLOCKS.DIRT]: { name: 'dirt', color: '#8d6e63', hardness: 1, drops: BLOCKS.DIRT, solid: true, minTier: null },
  [BLOCKS.STONE]: { name: 'stone', color: '#9e9e9e', hardness: 3, drops: BLOCKS.STONE, solid: true, minTier: 'wood' },
  [BLOCKS.SAND]: { name: 'sand', color: '#e0c68c', hardness: 1, drops: BLOCKS.SAND, solid: true, minTier: null },
  [BLOCKS.WATER]: { name: 'water', color: '#2196f3', hardness: 0, drops: null, solid: false, minTier: null },
  [BLOCKS.WOOD]: { name: 'wood', color: '#6d4c31', hardness: 2, drops: BLOCKS.WOOD, solid: true, minTier: null },
  [BLOCKS.LEAVES]: { name: 'leaves', color: '#388e3c', hardness: 0.5, drops: null, solid: true, minTier: null },
  [BLOCKS.PLANKS]: { name: 'planks', color: '#a1887f', hardness: 2, drops: BLOCKS.PLANKS, solid: true, minTier: null },
  [BLOCKS.COAL_ORE]: { name: 'coal_ore', color: '#37474f', hardness: 3, drops: 'coal', solid: true, minTier: 'wood' },
  [BLOCKS.IRON_ORE]: { name: 'iron_ore', color: '#d7ccc8', hardness: 4, drops: 'iron_ore', solid: true, minTier: 'stone' },
}

export function isSolid(blockId) {
  if (blockId === BLOCKS.AIR) return false
  return BLOCK_DATA[blockId]?.solid ?? false
}

export function getDrop(blockId) {
  if (blockId === BLOCKS.AIR) return null
  return BLOCK_DATA[blockId]?.drops ?? null
}
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd game/Minecraft && npm run test -- blocks`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
cd game/Minecraft && git add src/constants/blocks.js src/constants/blocks.test.js && git commit -m "feat(minecraft): add block type definitions"
```

---

### Task 3: 2D value noise（地形生成の基礎）

**Files:**
- Create: `game/Minecraft/src/world/noise.js`
- Test: `game/Minecraft/src/world/noise.test.js`

**Interfaces:**
- Produces: `createNoise2D(seed)` → returns function `(x, y) => number` where output is deterministic for a given seed and in range `[-1, 1]`.

- [ ] **Step 1: Write failing tests**

`game/Minecraft/src/world/noise.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { createNoise2D } from './noise.js'

describe('createNoise2D', () => {
  it('returns a function', () => {
    const noise = createNoise2D(1)
    expect(typeof noise).toBe('function')
  })

  it('is deterministic for the same seed and coordinates', () => {
    const a = createNoise2D(42)
    const b = createNoise2D(42)
    expect(a(3.5, 7.2)).toBeCloseTo(b(3.5, 7.2), 10)
  })

  it('differs for different seeds', () => {
    const a = createNoise2D(1)(3.5, 7.2)
    const b = createNoise2D(2)(3.5, 7.2)
    expect(a).not.toBeCloseTo(b, 5)
  })

  it('stays within [-1, 1] across a sample grid', () => {
    const noise = createNoise2D(7)
    for (let x = 0; x < 20; x += 0.37) {
      for (let y = 0; y < 20; y += 0.53) {
        const v = noise(x, y)
        expect(v).toBeGreaterThanOrEqual(-1)
        expect(v).toBeLessThanOrEqual(1)
      }
    }
  })
})
```

- [ ] **Step 2: Run tests, confirm failure**

Run: `cd game/Minecraft && npm run test -- noise`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`game/Minecraft/src/world/noise.js`:
```js
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
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd game/Minecraft && npm run test -- noise`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd game/Minecraft && git add src/world/noise.js src/world/noise.test.js && git commit -m "feat(minecraft): add deterministic 2D value noise"
```

---

### Task 4: 地形生成

**Files:**
- Create: `game/Minecraft/src/world/terrainGenerator.js`
- Test: `game/Minecraft/src/world/terrainGenerator.test.js`

**Interfaces:**
- Consumes: `createNoise2D(seed)` from `./noise.js`; `BLOCKS` from `../constants/blocks.js`.
- Produces: `WORLD_SIZE = 64`, `WORLD_HEIGHT = 32`, `generateTerrain(seed)` → returns `Map<string, number>` keyed by `"x,y,z"` (only non-AIR blocks are stored; AIR is implicit), `keyFor(x, y, z)` → `"x,y,z"` string helper.

- [ ] **Step 1: Write failing tests**

`game/Minecraft/src/world/terrainGenerator.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { generateTerrain, keyFor, WORLD_SIZE, WORLD_HEIGHT } from './terrainGenerator.js'
import { BLOCKS, isSolid } from '../constants/blocks.js'

describe('keyFor', () => {
  it('formats coordinates as "x,y,z"', () => {
    expect(keyFor(1, 2, 3)).toBe('1,2,3')
  })
})

describe('generateTerrain', () => {
  it('is deterministic for the same seed', () => {
    const a = generateTerrain(5)
    const b = generateTerrain(5)
    expect(a.size).toBe(b.size)
    expect(a.get(keyFor(10, 5, 10))).toBe(b.get(keyFor(10, 5, 10)))
  })

  it('every column has a solid surface block topped with grass or sand', () => {
    const world = generateTerrain(5)
    for (let x = 0; x < WORLD_SIZE; x += 8) {
      for (let z = 0; z < WORLD_SIZE; z += 8) {
        let topY = -1
        for (let y = 0; y < WORLD_HEIGHT; y++) {
          if (world.has(keyFor(x, y, z))) topY = y
        }
        expect(topY).toBeGreaterThanOrEqual(0)
        const topBlock = world.get(keyFor(x, topY, z))
        expect([BLOCKS.GRASS, BLOCKS.SAND, BLOCKS.WATER]).toContain(topBlock)
      }
    }
  })

  it('only stores non-AIR blocks', () => {
    const world = generateTerrain(5)
    for (const value of world.values()) {
      expect(value).not.toBe(BLOCKS.AIR)
    }
  })

  it('below the surface, at least some blocks are STONE', () => {
    const world = generateTerrain(5)
    let stoneCount = 0
    for (const value of world.values()) {
      if (value === BLOCKS.STONE) stoneCount++
    }
    expect(stoneCount).toBeGreaterThan(0)
  })

  it('produces columns that are all solid (isSolid true, ignoring WATER) up to the surface', () => {
    const world = generateTerrain(5)
    const x = 32, z = 32
    let topY = -1
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      if (world.has(keyFor(x, y, z))) topY = y
    }
    for (let y = 0; y <= topY; y++) {
      const block = world.get(keyFor(x, y, z))
      expect(block).toBeDefined()
    }
  })
})
```

- [ ] **Step 2: Run tests, confirm failure**

Run: `cd game/Minecraft && npm run test -- terrainGenerator`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`game/Minecraft/src/world/terrainGenerator.js`:
```js
import { createNoise2D } from './noise.js'
import { BLOCKS } from '../constants/blocks.js'

export const WORLD_SIZE = 64
export const WORLD_HEIGHT = 32
const SEA_LEVEL = 10
const BASE_HEIGHT = 12
const HEIGHT_VARIANCE = 6

export function keyFor(x, y, z) {
  return `${x},${y},${z}`
}

export function generateTerrain(seed = 0) {
  const noise = createNoise2D(seed)
  const oreNoise = createNoise2D(seed + 1000)
  const world = new Map()

  for (let x = 0; x < WORLD_SIZE; x++) {
    for (let z = 0; z < WORLD_SIZE; z++) {
      const n = noise(x / 16, z / 16)
      const height = Math.round(BASE_HEIGHT + n * HEIGHT_VARIANCE)

      for (let y = 0; y <= height; y++) {
        let block
        if (y === height) {
          block = height <= SEA_LEVEL ? BLOCKS.SAND : BLOCKS.GRASS
        } else if (y >= height - 3) {
          block = BLOCKS.DIRT
        } else {
          const oreVal = oreNoise(x / 4, (y * 3 + z) / 4)
          if (oreVal > 0.7) block = BLOCKS.IRON_ORE
          else if (oreVal > 0.45) block = BLOCKS.COAL_ORE
          else block = BLOCKS.STONE
        }
        world.set(keyFor(x, y, z), block)
      }

      if (height < SEA_LEVEL) {
        for (let y = height + 1; y <= SEA_LEVEL; y++) {
          world.set(keyFor(x, y, z), BLOCKS.WATER)
        }
      }
    }
  }

  return world
}
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd game/Minecraft && npm run test -- terrainGenerator`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
cd game/Minecraft && git add src/world/terrainGenerator.js src/world/terrainGenerator.test.js && git commit -m "feat(minecraft): add terrain generator"
```

---

### Task 5: worldStore（Zustand）

**Files:**
- Create: `game/Minecraft/src/world/worldStore.js`
- Test: `game/Minecraft/src/world/worldStore.test.js`

**Interfaces:**
- Consumes: `generateTerrain`, `keyFor`, `WORLD_SIZE`, `WORLD_HEIGHT` from `./terrainGenerator.js`; `BLOCKS` from `../constants/blocks.js`.
- Produces: `useWorldStore` Zustand hook with state `{ baseTerrain: Map, overrides: Map<string, number|null>, seed: number }` and actions `getBlock(x,y,z): number`, `setBlock(x,y,z,blockId)`, `removeBlock(x,y,z)` (sets override to `BLOCKS.AIR`), `resetWorld(seed)`, `loadOverrides(overridesEntries: [string, number|null][])`, `getOverridesEntries(): [string, number|null][]`.

- [ ] **Step 1: Write failing tests**

`game/Minecraft/src/world/worldStore.test.js`:
```js
import { describe, it, expect, beforeEach } from 'vitest'
import { useWorldStore } from './worldStore.js'
import { BLOCKS } from '../constants/blocks.js'

describe('worldStore', () => {
  beforeEach(() => {
    useWorldStore.getState().resetWorld(1)
  })

  it('getBlock returns AIR above the generated terrain', () => {
    const { getBlock } = useWorldStore.getState()
    expect(getBlock(0, 31, 0)).toBe(BLOCKS.AIR)
  })

  it('getBlock returns a defined block within generated terrain range', () => {
    const { getBlock } = useWorldStore.getState()
    expect(getBlock(32, 0, 32)).not.toBe(BLOCKS.AIR)
  })

  it('setBlock overrides a coordinate and getBlock reflects it', () => {
    const { setBlock, getBlock } = useWorldStore.getState()
    setBlock(5, 20, 5, BLOCKS.PLANKS)
    expect(getBlock(5, 20, 5)).toBe(BLOCKS.PLANKS)
  })

  it('removeBlock sets a coordinate to AIR even if terrain had a block there', () => {
    const { removeBlock, getBlock } = useWorldStore.getState()
    const before = getBlock(32, 0, 32)
    expect(before).not.toBe(BLOCKS.AIR)
    removeBlock(32, 0, 32)
    expect(getBlock(32, 0, 32)).toBe(BLOCKS.AIR)
  })

  it('getOverridesEntries only contains coordinates that were changed', () => {
    const { setBlock, removeBlock, getOverridesEntries } = useWorldStore.getState()
    setBlock(1, 1, 1, BLOCKS.PLANKS)
    removeBlock(2, 2, 2)
    const entries = getOverridesEntries()
    expect(entries).toContainEqual(['1,1,1', BLOCKS.PLANKS])
    expect(entries).toContainEqual(['2,2,2', BLOCKS.AIR])
    expect(entries.length).toBe(2)
  })

  it('loadOverrides restores a previously saved diff', () => {
    const { loadOverrides, getBlock } = useWorldStore.getState()
    loadOverrides([['3,3,3', BLOCKS.STONE]])
    expect(getBlock(3, 3, 3)).toBe(BLOCKS.STONE)
  })
})
```

- [ ] **Step 2: Run tests, confirm failure**

Run: `cd game/Minecraft && npm run test -- worldStore`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`game/Minecraft/src/world/worldStore.js`:
```js
import { create } from 'zustand'
import { generateTerrain, keyFor } from './terrainGenerator.js'
import { BLOCKS } from '../constants/blocks.js'

export const useWorldStore = create((set, get) => ({
  seed: 1,
  baseTerrain: generateTerrain(1),
  overrides: new Map(),

  getBlock(x, y, z) {
    const key = keyFor(x, y, z)
    const { overrides, baseTerrain } = get()
    if (overrides.has(key)) return overrides.get(key)
    return baseTerrain.get(key) ?? BLOCKS.AIR
  },

  setBlock(x, y, z, blockId) {
    const key = keyFor(x, y, z)
    set((state) => {
      const next = new Map(state.overrides)
      next.set(key, blockId)
      return { overrides: next }
    })
  },

  removeBlock(x, y, z) {
    get().setBlock(x, y, z, BLOCKS.AIR)
  },

  resetWorld(seed) {
    set({ seed, baseTerrain: generateTerrain(seed), overrides: new Map() })
  },

  loadOverrides(entries) {
    set({ overrides: new Map(entries) })
  },

  getOverridesEntries() {
    return Array.from(get().overrides.entries())
  },
}))
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd game/Minecraft && npm run test -- worldStore`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
cd game/Minecraft && git add src/world/worldStore.js src/world/worldStore.test.js && git commit -m "feat(minecraft): add worldStore with terrain+override lookup"
```

---

### Task 6: 衝突判定（AABB vs ボクセル）

**Files:**
- Create: `game/Minecraft/src/player/collision.js`
- Test: `game/Minecraft/src/player/collision.test.js`

**Interfaces:**
- Consumes: `isSolid(blockId)` from `../constants/blocks.js`.
- Produces: `PLAYER_WIDTH = 0.6`, `PLAYER_HEIGHT = 1.8`, `resolveAxisMovement(position: {x,y,z}, delta: {x,y,z}, getBlock: (x,y,z)=>number)` → returns new `{x,y,z}` position, moving axis-by-axis (X then Y then Z) and clamping any axis that would intersect a solid block.

- [ ] **Step 1: Write failing tests**

`game/Minecraft/src/player/collision.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { resolveAxisMovement, PLAYER_WIDTH, PLAYER_HEIGHT } from './collision.js'
import { BLOCKS } from '../constants/blocks.js'

function makeGetBlock(solidCoords) {
  const set = new Set(solidCoords.map(([x, y, z]) => `${x},${y},${z}`))
  return (x, y, z) => (set.has(`${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`) ? BLOCKS.STONE : BLOCKS.AIR)
}

describe('resolveAxisMovement', () => {
  it('moves freely through empty space', () => {
    const getBlock = makeGetBlock([])
    const result = resolveAxisMovement({ x: 0, y: 10, z: 0 }, { x: 1, y: 0, z: 1 }, getBlock)
    expect(result).toEqual({ x: 1, y: 10, z: 1 })
  })

  it('stops X movement when a solid block blocks the path', () => {
    const getBlock = makeGetBlock([[2, 10, 0]])
    const result = resolveAxisMovement({ x: 0.9, y: 10, z: 0 }, { x: 1, y: 0, z: 0 }, getBlock)
    expect(result.x).toBeLessThan(1.9)
  })

  it('stops downward Y movement on solid ground (gravity resolution)', () => {
    const getBlock = makeGetBlock([[0, 5, 0]])
    const result = resolveAxisMovement({ x: 0, y: 6.05, z: 0 }, { x: 0, y: -1, z: 0 }, getBlock)
    expect(result.y).toBeGreaterThanOrEqual(6)
  })

  it('does not move Z when a solid block blocks that axis, but still allows X', () => {
    const getBlock = makeGetBlock([[0, 10, 2]])
    const result = resolveAxisMovement({ x: 0, y: 10, z: 0.9 }, { x: 1, y: 0, z: 1 }, getBlock)
    expect(result.x).toBe(1)
    expect(result.z).toBeLessThan(1.9)
  })
})
```

- [ ] **Step 2: Run tests, confirm failure**

Run: `cd game/Minecraft && npm run test -- collision`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`game/Minecraft/src/player/collision.js`:
```js
import { isSolid } from '../constants/blocks.js'

export const PLAYER_WIDTH = 0.6
export const PLAYER_HEIGHT = 1.8
const HALF_WIDTH = PLAYER_WIDTH / 2

function collidesAt(pos, getBlock) {
  const minX = Math.floor(pos.x - HALF_WIDTH)
  const maxX = Math.floor(pos.x + HALF_WIDTH)
  const minY = Math.floor(pos.y)
  const maxY = Math.floor(pos.y + PLAYER_HEIGHT)
  const minZ = Math.floor(pos.z - HALF_WIDTH)
  const maxZ = Math.floor(pos.z + HALF_WIDTH)

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        if (isSolid(getBlock(x, y, z))) return true
      }
    }
  }
  return false
}

export function resolveAxisMovement(position, delta, getBlock) {
  let { x, y, z } = position

  const tryX = { x: x + delta.x, y, z }
  if (!collidesAt(tryX, getBlock)) x = tryX.x

  const tryY = { x, y: y + delta.y, z }
  if (!collidesAt(tryY, getBlock)) y = tryY.y

  const tryZ = { x, y, z: z + delta.z }
  if (!collidesAt(tryZ, getBlock)) z = tryZ.z

  return { x, y, z }
}
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd game/Minecraft && npm run test -- collision`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd game/Minecraft && git add src/player/collision.js src/player/collision.test.js && git commit -m "feat(minecraft): add axis-resolved AABB collision"
```

---

### Task 7: playerStore（Zustand）

**Files:**
- Create: `game/Minecraft/src/player/playerStore.js`
- Test: `game/Minecraft/src/player/playerStore.test.js`

**Interfaces:**
- Produces: `usePlayerStore` with state `{ position: {x,y,z}, yaw: number, pitch: number, velocityY: number, health: number, hunger: number, isDead: boolean }` and actions `setPosition({x,y,z})`, `setLook(yaw, pitch)`, `setVelocityY(v)`, `damage(amount)`, `heal(amount)`, `setHunger(value)`, `respawn(spawnPos)`.

- [ ] **Step 1: Write failing tests**

`game/Minecraft/src/player/playerStore.test.js`:
```js
import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayerStore } from './playerStore.js'

describe('playerStore', () => {
  beforeEach(() => {
    usePlayerStore.getState().respawn({ x: 32, y: 20, z: 32 })
  })

  it('starts with full health and hunger after respawn', () => {
    const state = usePlayerStore.getState()
    expect(state.health).toBe(20)
    expect(state.hunger).toBe(20)
    expect(state.isDead).toBe(false)
  })

  it('setPosition updates position', () => {
    usePlayerStore.getState().setPosition({ x: 1, y: 2, z: 3 })
    expect(usePlayerStore.getState().position).toEqual({ x: 1, y: 2, z: 3 })
  })

  it('damage reduces health and clamps at 0, setting isDead', () => {
    usePlayerStore.getState().damage(25)
    const state = usePlayerStore.getState()
    expect(state.health).toBe(0)
    expect(state.isDead).toBe(true)
  })

  it('heal increases health but clamps at 20', () => {
    usePlayerStore.getState().damage(15)
    usePlayerStore.getState().heal(100)
    expect(usePlayerStore.getState().health).toBe(20)
  })

  it('setHunger clamps between 0 and 20', () => {
    usePlayerStore.getState().setHunger(-5)
    expect(usePlayerStore.getState().hunger).toBe(0)
    usePlayerStore.getState().setHunger(50)
    expect(usePlayerStore.getState().hunger).toBe(20)
  })

  it('respawn resets health, hunger, isDead and position', () => {
    usePlayerStore.getState().damage(20)
    expect(usePlayerStore.getState().isDead).toBe(true)
    usePlayerStore.getState().respawn({ x: 0, y: 15, z: 0 })
    const state = usePlayerStore.getState()
    expect(state.isDead).toBe(false)
    expect(state.health).toBe(20)
    expect(state.hunger).toBe(20)
    expect(state.position).toEqual({ x: 0, y: 15, z: 0 })
  })
})
```

- [ ] **Step 2: Run tests, confirm failure**

Run: `cd game/Minecraft && npm run test -- playerStore`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`game/Minecraft/src/player/playerStore.js`:
```js
import { create } from 'zustand'

const MAX_HEALTH = 20
const MAX_HUNGER = 20

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export const usePlayerStore = create((set, get) => ({
  position: { x: 32, y: 20, z: 32 },
  yaw: 0,
  pitch: 0,
  velocityY: 0,
  health: MAX_HEALTH,
  hunger: MAX_HUNGER,
  isDead: false,

  setPosition(position) {
    set({ position })
  },

  setLook(yaw, pitch) {
    set({ yaw, pitch })
  },

  setVelocityY(v) {
    set({ velocityY: v })
  },

  damage(amount) {
    const health = clamp(get().health - amount, 0, MAX_HEALTH)
    set({ health, isDead: health <= 0 })
  },

  heal(amount) {
    set({ health: clamp(get().health + amount, 0, MAX_HEALTH) })
  },

  setHunger(value) {
    set({ hunger: clamp(value, 0, MAX_HUNGER) })
  },

  respawn(spawnPos) {
    set({
      position: spawnPos,
      velocityY: 0,
      health: MAX_HEALTH,
      hunger: MAX_HUNGER,
      isDead: false,
    })
  },
}))
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd game/Minecraft && npm run test -- playerStore`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
cd game/Minecraft && git add src/player/playerStore.js src/player/playerStore.test.js && git commit -m "feat(minecraft): add playerStore"
```

---

### Task 8: ブロック破壊/設置の純粋ロジック

**Files:**
- Create: `game/Minecraft/src/interaction/blockActions.js`
- Test: `game/Minecraft/src/interaction/blockActions.test.js`

**Interfaces:**
- Consumes: `BLOCKS`, `BLOCK_DATA`, `getDrop`, `isSolid` from `../constants/blocks.js`.
- Produces: `TOOL_TIERS = { none: 0, wood: 1, stone: 2, iron: 3 }`, `canBreak(blockId, toolTier: string)` → boolean (true if block has no `minTier` requirement, or `TOOL_TIERS[toolTier] >= TOOL_TIERS[minTier]`), `computeBreakResult(blockId, toolTier)` → `{ success: boolean, drop: number|string|null }`, `computePlaceResult(targetPos: {x,y,z}, playerPos: {x,y,z})` → `{ allowed: boolean }` (disallow placing inside the player's own bounding box).

- [ ] **Step 1: Write failing tests**

`game/Minecraft/src/interaction/blockActions.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { canBreak, computeBreakResult, computePlaceResult, TOOL_TIERS } from './blockActions.js'
import { BLOCKS } from '../constants/blocks.js'

describe('canBreak', () => {
  it('allows breaking blocks with no tier requirement with bare hands', () => {
    expect(canBreak(BLOCKS.DIRT, 'none')).toBe(true)
  })

  it('disallows breaking STONE (minTier wood) with bare hands', () => {
    expect(canBreak(BLOCKS.STONE, 'none')).toBe(false)
  })

  it('allows breaking STONE with a wood tool', () => {
    expect(canBreak(BLOCKS.STONE, 'wood')).toBe(true)
  })

  it('disallows breaking IRON_ORE (minTier stone) with a wood tool', () => {
    expect(canBreak(BLOCKS.IRON_ORE, 'wood')).toBe(false)
  })

  it('allows breaking IRON_ORE with a stone tool', () => {
    expect(canBreak(BLOCKS.IRON_ORE, 'stone')).toBe(true)
  })
})

describe('computeBreakResult', () => {
  it('succeeds and returns the drop when the tool tier is sufficient', () => {
    const result = computeBreakResult(BLOCKS.GRASS, 'none')
    expect(result).toEqual({ success: true, drop: BLOCKS.DIRT })
  })

  it('fails and returns no drop when the tool tier is insufficient', () => {
    const result = computeBreakResult(BLOCKS.STONE, 'none')
    expect(result).toEqual({ success: false, drop: null })
  })

  it('succeeds with null drop for blocks that drop nothing (LEAVES)', () => {
    const result = computeBreakResult(BLOCKS.LEAVES, 'none')
    expect(result).toEqual({ success: true, drop: null })
  })
})

describe('computePlaceResult', () => {
  it('allows placing a block far from the player', () => {
    const result = computePlaceResult({ x: 10, y: 10, z: 10 }, { x: 0, y: 0, z: 0 })
    expect(result.allowed).toBe(true)
  })

  it('disallows placing a block inside the player position', () => {
    const result = computePlaceResult({ x: 5, y: 10, z: 5 }, { x: 5, y: 10, z: 5 })
    expect(result.allowed).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests, confirm failure**

Run: `cd game/Minecraft && npm run test -- blockActions`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`game/Minecraft/src/interaction/blockActions.js`:
```js
import { BLOCKS, BLOCK_DATA, getDrop } from '../constants/blocks.js'
import { PLAYER_WIDTH, PLAYER_HEIGHT } from '../player/collision.js'

export const TOOL_TIERS = { none: 0, wood: 1, stone: 2, iron: 3 }

export function canBreak(blockId, toolTier) {
  const data = BLOCK_DATA[blockId]
  if (!data || !data.minTier) return true
  return TOOL_TIERS[toolTier] >= TOOL_TIERS[data.minTier]
}

export function computeBreakResult(blockId, toolTier) {
  if (!canBreak(blockId, toolTier)) {
    return { success: false, drop: null }
  }
  return { success: true, drop: getDrop(blockId) }
}

export function computePlaceResult(targetPos, playerPos) {
  const halfWidth = PLAYER_WIDTH / 2
  const withinX = Math.abs(targetPos.x - playerPos.x) < halfWidth + 0.5 && Math.floor(targetPos.x) === Math.floor(playerPos.x)
  const withinZ = Math.floor(targetPos.z) === Math.floor(playerPos.z)
  const withinY = targetPos.y >= Math.floor(playerPos.y) && targetPos.y <= Math.floor(playerPos.y + PLAYER_HEIGHT)
  const allowed = !(withinX && withinZ && withinY)
  return { allowed }
}
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd game/Minecraft && npm run test -- blockActions`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
cd game/Minecraft && git add src/interaction/blockActions.js src/interaction/blockActions.test.js && git commit -m "feat(minecraft): add break/place pure logic with tool tiers"
```

---

### Task 9: 体力・空腹度ロジック

**Files:**
- Create: `game/Minecraft/src/survival/health.js`
- Test: `game/Minecraft/src/survival/health.test.js`

**Interfaces:**
- Produces: `applyHungerTick(hunger: number, elapsedSeconds: number)` → new hunger value (decreases by 1 per 30 real seconds, clamped at 0), `applyStarvationDamage(health: number, hunger: number, elapsedSeconds: number)` → new health value (loses 1 health per 10 seconds only while `hunger <= 0`, clamped at 0), `applyRegeneration(health: number, hunger: number, elapsedSeconds: number)` → new health value (gains 1 health per 8 seconds only while `hunger >= 18` and `health < 20`, clamped at 20).

- [ ] **Step 1: Write failing tests**

`game/Minecraft/src/survival/health.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { applyHungerTick, applyStarvationDamage, applyRegeneration } from './health.js'

describe('applyHungerTick', () => {
  it('decreases hunger by 1 per 30 seconds elapsed', () => {
    expect(applyHungerTick(20, 30)).toBe(19)
  })

  it('does not go below 0', () => {
    expect(applyHungerTick(0, 30)).toBe(0)
  })

  it('handles fractional seconds proportionally', () => {
    expect(applyHungerTick(20, 15)).toBeCloseTo(19.5, 5)
  })
})

describe('applyStarvationDamage', () => {
  it('does nothing when hunger is above 0', () => {
    expect(applyStarvationDamage(20, 5, 10)).toBe(20)
  })

  it('reduces health by 1 per 10 seconds when hunger is 0', () => {
    expect(applyStarvationDamage(20, 0, 10)).toBe(19)
  })

  it('does not go below 0', () => {
    expect(applyStarvationDamage(0, 0, 10)).toBe(0)
  })
})

describe('applyRegeneration', () => {
  it('does nothing when hunger is below 18', () => {
    expect(applyRegeneration(10, 17, 8)).toBe(10)
  })

  it('regenerates 1 health per 8 seconds when hunger is 18+', () => {
    expect(applyRegeneration(10, 18, 8)).toBe(11)
  })

  it('does not exceed 20', () => {
    expect(applyRegeneration(20, 20, 8)).toBe(20)
  })
})
```

- [ ] **Step 2: Run tests, confirm failure**

Run: `cd game/Minecraft && npm run test -- health`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`game/Minecraft/src/survival/health.js`:
```js
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function applyHungerTick(hunger, elapsedSeconds) {
  const decay = elapsedSeconds / 30
  return clamp(hunger - decay, 0, 20)
}

export function applyStarvationDamage(health, hunger, elapsedSeconds) {
  if (hunger > 0) return health
  const damage = elapsedSeconds / 10
  return clamp(health - damage, 0, 20)
}

export function applyRegeneration(health, hunger, elapsedSeconds) {
  if (hunger < 18) return health
  const heal = elapsedSeconds / 8
  return clamp(health + heal, 0, 20)
}
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd game/Minecraft && npm run test -- health`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
cd game/Minecraft && git add src/survival/health.js src/survival/health.test.js && git commit -m "feat(minecraft): add hunger/health tick logic"
```

---

### Task 10: 昼夜サイクル

**Files:**
- Create: `game/Minecraft/src/survival/dayNight.js`
- Test: `game/Minecraft/src/survival/dayNight.test.js`

**Interfaces:**
- Produces: `DAY_LENGTH_SECONDS = 600`, `advanceTime(currentTime: number, elapsedSeconds: number)` → new time value in `[0, DAY_LENGTH_SECONDS)` (wraps around), `isNight(currentTime: number)` → boolean (night is the last 40% of the cycle, i.e. `currentTime >= DAY_LENGTH_SECONDS * 0.6`), `lightIntensityFor(currentTime: number)` → number in `[0.15, 1]` (1 at midday, 0.15 at midnight, smoothly interpolated via cosine).

- [ ] **Step 1: Write failing tests**

`game/Minecraft/src/survival/dayNight.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { advanceTime, isNight, lightIntensityFor, DAY_LENGTH_SECONDS } from './dayNight.js'

describe('advanceTime', () => {
  it('adds elapsed seconds', () => {
    expect(advanceTime(0, 10)).toBe(10)
  })

  it('wraps around at DAY_LENGTH_SECONDS', () => {
    expect(advanceTime(DAY_LENGTH_SECONDS - 5, 10)).toBe(5)
  })
})

describe('isNight', () => {
  it('is false at the start of the day', () => {
    expect(isNight(0)).toBe(false)
  })

  it('is false just before the night threshold (60%)', () => {
    expect(isNight(DAY_LENGTH_SECONDS * 0.6 - 1)).toBe(false)
  })

  it('is true at and after the night threshold (60%)', () => {
    expect(isNight(DAY_LENGTH_SECONDS * 0.6)).toBe(true)
    expect(isNight(DAY_LENGTH_SECONDS * 0.9)).toBe(true)
  })
})

describe('lightIntensityFor', () => {
  it('is at its maximum (1) at midday', () => {
    expect(lightIntensityFor(DAY_LENGTH_SECONDS / 2)).toBeCloseTo(1, 1)
  })

  it('is at its minimum (0.15) at midnight (time 0)', () => {
    expect(lightIntensityFor(0)).toBeCloseTo(0.15, 1)
  })

  it('stays within [0.15, 1] across the full cycle', () => {
    for (let t = 0; t < DAY_LENGTH_SECONDS; t += 13) {
      const v = lightIntensityFor(t)
      expect(v).toBeGreaterThanOrEqual(0.15)
      expect(v).toBeLessThanOrEqual(1)
    }
  })
})
```

- [ ] **Step 2: Run tests, confirm failure**

Run: `cd game/Minecraft && npm run test -- dayNight`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`game/Minecraft/src/survival/dayNight.js`:
```js
export const DAY_LENGTH_SECONDS = 600

export function advanceTime(currentTime, elapsedSeconds) {
  return (currentTime + elapsedSeconds) % DAY_LENGTH_SECONDS
}

export function isNight(currentTime) {
  return currentTime >= DAY_LENGTH_SECONDS * 0.6
}

export function lightIntensityFor(currentTime) {
  // time 0 = midnight (min light), time DAY_LENGTH_SECONDS/2 = midday (max light)
  const angle = (currentTime / DAY_LENGTH_SECONDS) * Math.PI * 2
  const wave = (1 - Math.cos(angle)) / 2 // 0 at t=0, 1 at t=half
  const min = 0.15
  const max = 1
  return min + wave * (max - min)
}
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd game/Minecraft && npm run test -- dayNight`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
cd game/Minecraft && git add src/survival/dayNight.js src/survival/dayNight.test.js && git commit -m "feat(minecraft): add day/night cycle logic"
```

---

### Task 11: Mob AI（純粋ロジック）

**Files:**
- Create: `game/Minecraft/src/entities/mobAI.js`
- Test: `game/Minecraft/src/entities/mobAI.test.js`

**Interfaces:**
- Produces: `MOB_SPEED = 1.5`, `MOB_AGGRO_RANGE = 8`, `MOB_ATTACK_RANGE = 1.2`, `computeMobStep(mob: {position:{x,y,z}}, playerPos: {x,y,z}, elapsedSeconds: number)` → `{ position: {x,y,z}, isAttacking: boolean }` (if player is within `MOB_AGGRO_RANGE`, move toward player at `MOB_SPEED`, capped so it never overshoots; `isAttacking` true when within `MOB_ATTACK_RANGE`; otherwise mob stays in place and `isAttacking` is false).

- [ ] **Step 1: Write failing tests**

`game/Minecraft/src/entities/mobAI.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { computeMobStep, MOB_SPEED, MOB_AGGRO_RANGE, MOB_ATTACK_RANGE } from './mobAI.js'

describe('computeMobStep', () => {
  it('does not move when the player is outside aggro range', () => {
    const mob = { position: { x: 0, y: 10, z: 0 } }
    const result = computeMobStep(mob, { x: MOB_AGGRO_RANGE + 5, y: 10, z: 0 }, 1)
    expect(result.position).toEqual({ x: 0, y: 10, z: 0 })
    expect(result.isAttacking).toBe(false)
  })

  it('moves toward the player when within aggro range', () => {
    const mob = { position: { x: 0, y: 10, z: 0 } }
    const result = computeMobStep(mob, { x: 5, y: 10, z: 0 }, 1)
    expect(result.position.x).toBeGreaterThan(0)
    expect(result.position.x).toBeLessThanOrEqual(MOB_SPEED)
  })

  it('does not overshoot the player position', () => {
    const mob = { position: { x: 0, y: 10, z: 0 } }
    const result = computeMobStep(mob, { x: 0.5, y: 10, z: 0 }, 10)
    expect(result.position.x).toBeCloseTo(0.5, 5)
  })

  it('reports isAttacking true when within attack range after moving', () => {
    const mob = { position: { x: 0, y: 10, z: 0 } }
    const result = computeMobStep(mob, { x: MOB_ATTACK_RANGE - 0.1, y: 10, z: 0 }, 5)
    expect(result.isAttacking).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests, confirm failure**

Run: `cd game/Minecraft && npm run test -- mobAI`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`game/Minecraft/src/entities/mobAI.js`:
```js
export const MOB_SPEED = 1.5
export const MOB_AGGRO_RANGE = 8
export const MOB_ATTACK_RANGE = 1.2

function distance(a, b) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function computeMobStep(mob, playerPos, elapsedSeconds) {
  const dist = distance(mob.position, playerPos)

  if (dist > MOB_AGGRO_RANGE) {
    return { position: { ...mob.position }, isAttacking: false }
  }

  const maxStep = MOB_SPEED * elapsedSeconds
  const travel = Math.min(maxStep, dist)

  const dirX = dist === 0 ? 0 : (playerPos.x - mob.position.x) / dist
  const dirY = dist === 0 ? 0 : (playerPos.y - mob.position.y) / dist
  const dirZ = dist === 0 ? 0 : (playerPos.z - mob.position.z) / dist

  const position = {
    x: mob.position.x + dirX * travel,
    y: mob.position.y + dirY * travel,
    z: mob.position.z + dirZ * travel,
  }

  const newDist = distance(position, playerPos)
  return { position, isAttacking: newDist <= MOB_ATTACK_RANGE }
}
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd game/Minecraft && npm run test -- mobAI`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd game/Minecraft && git add src/entities/mobAI.js src/entities/mobAI.test.js && git commit -m "feat(minecraft): add mob chase/attack AI logic"
```

---

### Task 12: クラフトレシピ判定

**Files:**
- Create: `game/Minecraft/src/inventory/craftingRecipes.js`
- Test: `game/Minecraft/src/inventory/craftingRecipes.test.js`

**Interfaces:**
- Consumes: `BLOCKS` from `../constants/blocks.js`.
- Produces: `RECIPES` array of `{ id, inputs: {itemId: count}, output: {itemId, count} }`, `matchRecipe(grid: (string|number|null)[9])` → returns matching recipe's output `{itemId, count}` or `null`. `grid` is a flat 3x3 array (index 0-8) using `null` for empty. Matching is shapeless (only counts matter, not positions), which is intentionally simpler than vanilla Minecraft for this MVP.

Recipes:
- `PLANKS` (id 8): 1x WOOD (id 6) → 4x PLANKS
- `stick`: 2x PLANKS → 4x `stick`
- `wood_pickaxe`: 3x PLANKS + 2x `stick` → 1x `wood_pickaxe`
- `wood_axe`: 3x PLANKS + 2x `stick` → 1x `wood_axe`
- `stone_pickaxe`: 3x STONE (id 3) + 2x `stick` → 1x `stone_pickaxe`
- `stone_axe`: 3x STONE + 2x `stick` → 1x `stone_axe`

- [ ] **Step 1: Write failing tests**

`game/Minecraft/src/inventory/craftingRecipes.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { matchRecipe } from './craftingRecipes.js'
import { BLOCKS } from '../constants/blocks.js'

function grid(items) {
  const g = new Array(9).fill(null)
  items.forEach((item, i) => { g[i] = item })
  return g
}

describe('matchRecipe', () => {
  it('returns null for an empty grid', () => {
    expect(matchRecipe(grid([]))).toBe(null)
  })

  it('matches 1 wood -> 4 planks regardless of position', () => {
    const result = matchRecipe(grid([BLOCKS.WOOD]))
    expect(result).toEqual({ itemId: BLOCKS.PLANKS, count: 4 })
  })

  it('matches 1 wood placed in a different slot', () => {
    const result = matchRecipe(grid([null, null, null, null, BLOCKS.WOOD]))
    expect(result).toEqual({ itemId: BLOCKS.PLANKS, count: 4 })
  })

  it('matches 2 planks -> 4 sticks', () => {
    const result = matchRecipe(grid([BLOCKS.PLANKS, BLOCKS.PLANKS]))
    expect(result).toEqual({ itemId: 'stick', count: 4 })
  })

  it('matches 3 planks + 2 sticks -> wood_pickaxe', () => {
    const result = matchRecipe(grid([BLOCKS.PLANKS, BLOCKS.PLANKS, BLOCKS.PLANKS, 'stick', 'stick']))
    expect(result).toEqual({ itemId: 'wood_pickaxe', count: 1 })
  })

  it('matches 3 stone + 2 sticks -> stone_pickaxe', () => {
    const result = matchRecipe(grid([BLOCKS.STONE, BLOCKS.STONE, BLOCKS.STONE, 'stick', 'stick']))
    expect(result).toEqual({ itemId: 'stone_pickaxe', count: 1 })
  })

  it('returns null for an unrecognized combination', () => {
    const result = matchRecipe(grid([BLOCKS.DIRT, BLOCKS.SAND]))
    expect(result).toBe(null)
  })

  it('does not match when there are extra unrelated items in the grid', () => {
    const result = matchRecipe(grid([BLOCKS.WOOD, BLOCKS.DIRT]))
    expect(result).toBe(null)
  })
})
```

- [ ] **Step 2: Run tests, confirm failure**

Run: `cd game/Minecraft && npm run test -- craftingRecipes`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`game/Minecraft/src/inventory/craftingRecipes.js`:
```js
import { BLOCKS } from '../constants/blocks.js'

export const RECIPES = [
  { id: 'planks', inputs: { [BLOCKS.WOOD]: 1 }, output: { itemId: BLOCKS.PLANKS, count: 4 } },
  { id: 'stick', inputs: { [BLOCKS.PLANKS]: 2 }, output: { itemId: 'stick', count: 4 } },
  { id: 'wood_pickaxe', inputs: { [BLOCKS.PLANKS]: 3, stick: 2 }, output: { itemId: 'wood_pickaxe', count: 1 } },
  { id: 'wood_axe', inputs: { [BLOCKS.PLANKS]: 3, stick: 2 }, output: { itemId: 'wood_axe', count: 1 } },
  { id: 'stone_pickaxe', inputs: { [BLOCKS.STONE]: 3, stick: 2 }, output: { itemId: 'stone_pickaxe', count: 1 } },
  { id: 'stone_axe', inputs: { [BLOCKS.STONE]: 3, stick: 2 }, output: { itemId: 'stone_axe', count: 1 } },
]

function countItems(grid) {
  const counts = {}
  for (const item of grid) {
    if (item === null || item === undefined) continue
    counts[item] = (counts[item] ?? 0) + 1
  }
  return counts
}

function countsEqual(a, b) {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every((key) => a[key] === b[key])
}

export function matchRecipe(grid) {
  const counts = countItems(grid)
  if (Object.keys(counts).length === 0) return null

  for (const recipe of RECIPES) {
    if (countsEqual(counts, recipe.inputs)) {
      return { ...recipe.output }
    }
  }
  return null
}
```

Note: `wood_axe` and `wood_pickaxe` (and the stone equivalents) share identical `inputs`, so in practice only the first-declared recipe (`wood_pickaxe` / `stone_pickaxe`) will ever match via `matchRecipe`. This is a known MVP simplification (no distinct shapes) — the axe recipes are kept for documentation of intended items but are effectively unreachable through crafting. This is acceptable because the design's crafting UI (Task 20) will only expose the pickaxe recipes as craftable via a simple recipe-list button rather than free-form grid placement, and axes are not required by the survival loop (nothing in the spec depends on wood/stone axes: chopping trees works with bare hands like any other block per `blockActions.js`).

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd game/Minecraft && npm run test -- craftingRecipes`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
cd game/Minecraft && git add src/inventory/craftingRecipes.js src/inventory/craftingRecipes.test.js && git commit -m "feat(minecraft): add shapeless crafting recipe matching"
```

---

### Task 13: inventoryStore（Zustand）

**Files:**
- Create: `game/Minecraft/src/inventory/inventoryStore.js`
- Test: `game/Minecraft/src/inventory/inventoryStore.test.js`

**Interfaces:**
- Consumes: nothing beyond plain JS.
- Produces: `HOTBAR_SIZE = 9`, `INVENTORY_SIZE = 27`, `useInventoryStore` with state `{ hotbar: (Slot|null)[9], inventory: (Slot|null)[27], selectedHotbarIndex: number }` where `Slot = { itemId: number|string, count: number }`, and actions:
  - `addItem(itemId, count = 1)` → tries to stack into existing matching slots (hotbar first, then inventory), then fills first empty slot; returns `boolean` (true if fully added, false if inventory was full and some/all could not be added — for MVP, drop is a no-op if full),
  - `removeItem(itemId, count = 1)` → removes up to `count` of `itemId` across hotbar+inventory, returns actual removed count,
  - `hasItems(requirements: {itemId: count})` → boolean,
  - `consumeItems(requirements: {itemId: count})` → removes all given requirements (assumes `hasItems` was already checked) and returns `true`,
  - `selectHotbarIndex(index)`,
  - `getSelectedItem()` → `Slot|null`,
  - `loadInventoryState({hotbar, inventory, selectedHotbarIndex})`.

- [ ] **Step 1: Write failing tests**

`game/Minecraft/src/inventory/inventoryStore.test.js`:
```js
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
```

- [ ] **Step 2: Run tests, confirm failure**

Run: `cd game/Minecraft && npm run test -- inventoryStore`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`game/Minecraft/src/inventory/inventoryStore.js`:
```js
import { create } from 'zustand'

export const HOTBAR_SIZE = 9
export const INVENTORY_SIZE = 27

function addToSlots(slots, itemId, count) {
  const next = [...slots]
  let remaining = count

  for (let i = 0; i < next.length && remaining > 0; i++) {
    if (next[i] && next[i].itemId === itemId) {
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
    if (next[i] && next[i].itemId === itemId) {
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
  return all.reduce((sum, slot) => sum + (slot && slot.itemId === itemId ? slot.count : 0), 0)
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
```

Note: `hasItems`/`consumeItems` use string keys, so numeric `itemId` (block ids) are compared as strings via `Object.entries` — this works correctly because `countOf` compares `slot.itemId === itemId` where `itemId` here is always the string form from `Object.entries`. To avoid a numeric-vs-string mismatch bug, `addItem`/`removeItem` must always be called with the itemId in the same form it will be looked up later. Since `craftingRecipes.js` inputs use numeric block ids as object keys, JS coerces those keys to strings too, so `Object.entries(recipe.inputs)` also yields string keys — consistent with slot storage as long as slots store block ids as numbers and comparisons go through `==`-safe paths. To keep this unambiguous, Task 20 (crafting UI wiring) must convert requirement keys back with `Number(itemId)` when the key parses as a numeric string before calling `hasItems`/`consumeItems`/`addItem`/`removeItem` for block-id items, and pass tool item ids (e.g. `'stick'`, `'wood_pickaxe'`) as-is.

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd game/Minecraft && npm run test -- inventoryStore`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
cd game/Minecraft && git add src/inventory/inventoryStore.js src/inventory/inventoryStore.test.js && git commit -m "feat(minecraft): add inventory store with stacking add/remove"
```

---

### Task 14: WebGL対応チェック

**Files:**
- Create: `game/Minecraft/src/webgl/checkWebGL.js`
- Test: `game/Minecraft/src/webgl/checkWebGL.test.js`

**Interfaces:**
- Produces: `isWebGLAvailable(documentRef = document)` → boolean, by attempting `document.createElement('canvas').getContext('webgl2') || getContext('webgl')` and returning whether a context was obtained (wrapped in try/catch, returns `false` on any thrown error).

- [ ] **Step 1: Write failing tests**

`game/Minecraft/src/webgl/checkWebGL.test.js`:
```js
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
```

- [ ] **Step 2: Run tests, confirm failure**

Run: `cd game/Minecraft && npm run test -- checkWebGL`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`game/Minecraft/src/webgl/checkWebGL.js`:
```js
export function isWebGLAvailable(documentRef = document) {
  try {
    const canvas = documentRef.createElement('canvas')
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl')
    return Boolean(context)
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd game/Minecraft && npm run test -- checkWebGL`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd game/Minecraft && git add src/webgl/checkWebGL.js src/webgl/checkWebGL.test.js && git commit -m "feat(minecraft): add WebGL availability check"
```

---

### Task 15: セーブ/ロード（シリアライズ）

**Files:**
- Create: `game/Minecraft/src/persistence/saveGame.js`
- Test: `game/Minecraft/src/persistence/saveGame.test.js`

**Interfaces:**
- Produces: `SAVE_KEY = 'minecraft-clone-save-v1'`, `SAVE_VERSION = 1`, `serializeSave({ seed, overridesEntries, playerPosition, playerYaw, playerPitch, health, hunger, hotbar, inventory, selectedHotbarIndex, time })` → JSON string with `{ version: SAVE_VERSION, ...payload }`, `deserializeSave(json: string)` → parsed payload object, or `null` if JSON is invalid or `version !== SAVE_VERSION`, `saveToLocalStorage(payload, storage = localStorage)` → wraps `serializeSave` + `storage.setItem` in try/catch, returns `boolean` success, `loadFromLocalStorage(storage = localStorage)` → reads `storage.getItem(SAVE_KEY)`, returns `deserializeSave(...)` result or `null` if nothing stored.

- [ ] **Step 1: Write failing tests**

`game/Minecraft/src/persistence/saveGame.test.js`:
```js
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
```

- [ ] **Step 2: Run tests, confirm failure**

Run: `cd game/Minecraft && npm run test -- saveGame`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`game/Minecraft/src/persistence/saveGame.js`:
```js
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
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd game/Minecraft && npm run test -- saveGame`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
cd game/Minecraft && git add src/persistence/saveGame.js src/persistence/saveGame.test.js && git commit -m "feat(minecraft): add save/load serialization"
```

---

### Task 16: チャンクメッシュ用の面カリング（純粋ロジック）

**Files:**
- Create: `game/Minecraft/src/world/chunkMesh.js`
- Test: `game/Minecraft/src/world/chunkMesh.test.js`

**Interfaces:**
- Consumes: `isSolid` from `../constants/blocks.js`.
- Produces: `computeVisibleFaces(bounds: {minX,maxX,minY,maxY,minZ,maxZ}, getBlock: (x,y,z)=>number)` → array of `{ x, y, z, blockId, direction }` where `direction` is one of `'+x','-x','+y','-y','+z','-z'`. A face is included only if the block at `(x,y,z)` is solid and its neighbor in `direction` is not solid (i.e., visible from outside).

- [ ] **Step 1: Write failing tests**

`game/Minecraft/src/world/chunkMesh.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { computeVisibleFaces } from './chunkMesh.js'
import { BLOCKS } from '../constants/blocks.js'

describe('computeVisibleFaces', () => {
  it('returns no faces for an entirely empty region', () => {
    const getBlock = () => BLOCKS.AIR
    const faces = computeVisibleFaces({ minX: 0, maxX: 2, minY: 0, maxY: 2, minZ: 0, maxZ: 2 }, getBlock)
    expect(faces).toEqual([])
  })

  it('returns 6 faces for a single isolated solid block', () => {
    const getBlock = (x, y, z) => (x === 1 && y === 1 && z === 1 ? BLOCKS.STONE : BLOCKS.AIR)
    const faces = computeVisibleFaces({ minX: 0, maxX: 2, minY: 0, maxY: 2, minZ: 0, maxZ: 2 }, getBlock)
    expect(faces.length).toBe(6)
    const directions = faces.map((f) => f.direction).sort()
    expect(directions).toEqual(['+x', '+y', '+z', '-x', '-y', '-z'])
  })

  it('hides the shared face between two adjacent solid blocks', () => {
    const getBlock = (x, y, z) => ((x === 1 || x === 2) && y === 1 && z === 1 ? BLOCKS.STONE : BLOCKS.AIR)
    const faces = computeVisibleFaces({ minX: 0, maxX: 3, minY: 0, maxY: 2, minZ: 0, maxZ: 2 }, getBlock)
    const blockAtOneFaces = faces.filter((f) => f.x === 1 && f.y === 1 && f.z === 1)
    const plusXFace = blockAtOneFaces.find((f) => f.direction === '+x')
    expect(plusXFace).toBeUndefined()
  })

  it('includes blockId on each face', () => {
    const getBlock = (x, y, z) => (x === 1 && y === 1 && z === 1 ? BLOCKS.GRASS : BLOCKS.AIR)
    const faces = computeVisibleFaces({ minX: 0, maxX: 2, minY: 0, maxY: 2, minZ: 0, maxZ: 2 }, getBlock)
    expect(faces.every((f) => f.blockId === BLOCKS.GRASS)).toBe(true)
  })

  it('does not produce faces for non-solid blocks like WATER', () => {
    const getBlock = (x, y, z) => (x === 1 && y === 1 && z === 1 ? BLOCKS.WATER : BLOCKS.AIR)
    const faces = computeVisibleFaces({ minX: 0, maxX: 2, minY: 0, maxY: 2, minZ: 0, maxZ: 2 }, getBlock)
    expect(faces).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests, confirm failure**

Run: `cd game/Minecraft && npm run test -- chunkMesh`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`game/Minecraft/src/world/chunkMesh.js`:
```js
import { isSolid } from '../constants/blocks.js'

const DIRECTIONS = [
  { direction: '+x', dx: 1, dy: 0, dz: 0 },
  { direction: '-x', dx: -1, dy: 0, dz: 0 },
  { direction: '+y', dx: 0, dy: 1, dz: 0 },
  { direction: '-y', dx: 0, dy: -1, dz: 0 },
  { direction: '+z', dx: 0, dy: 0, dz: 1 },
  { direction: '-z', dx: 0, dy: 0, dz: -1 },
]

export function computeVisibleFaces(bounds, getBlock) {
  const { minX, maxX, minY, maxY, minZ, maxZ } = bounds
  const faces = []

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        const blockId = getBlock(x, y, z)
        if (!isSolid(blockId)) continue

        for (const { direction, dx, dy, dz } of DIRECTIONS) {
          const neighbor = getBlock(x + dx, y + dy, z + dz)
          if (!isSolid(neighbor)) {
            faces.push({ x, y, z, blockId, direction })
          }
        }
      }
    }
  }

  return faces
}
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd game/Minecraft && npm run test -- chunkMesh`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
cd game/Minecraft && git add src/world/chunkMesh.js src/world/chunkMesh.test.js && git commit -m "feat(minecraft): add face-culling algorithm for voxel rendering"
```

---

### Task 17: WebGLゲート + Three.jsキャンバスの土台

**Files:**
- Create: `game/Minecraft/src/webgl/WebGLGate.jsx`
- Modify: `game/Minecraft/src/App.jsx`

**Interfaces:**
- Consumes: `isWebGLAvailable` from `./checkWebGL.js`.
- Produces: `WebGLGate` component that renders `children` if WebGL is available, otherwise renders a centered fallback message. `App.jsx` now wraps a `<Canvas>` (from `@react-three/fiber`) inside `WebGLGate`.

- [ ] **Step 1: Implement WebGLGate**

`game/Minecraft/src/webgl/WebGLGate.jsx`:
```jsx
import { isWebGLAvailable } from './checkWebGL.js'

export default function WebGLGate({ children }) {
  if (!isWebGLAvailable()) {
    return (
      <div className="w-screen h-screen bg-black text-white flex items-center justify-center">
        <p className="text-center px-4">
          このブラウザは3D表示(WebGL)に対応していません。<br />
          最新のChrome、Firefox、Safariでお試しください。
        </p>
      </div>
    )
  }
  return children
}
```

- [ ] **Step 2: Wire into App.jsx**

`game/Minecraft/src/App.jsx`:
```jsx
import { Canvas } from '@react-three/fiber'
import WebGLGate from './webgl/WebGLGate.jsx'

export default function App() {
  return (
    <WebGLGate>
      <div className="w-screen h-screen bg-sky-400">
        <Canvas camera={{ fov: 75, near: 0.1, far: 1000 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 20, 10]} intensity={0.8} />
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="orange" />
          </mesh>
        </Canvas>
      </div>
    </WebGLGate>
  )
}
```

- [ ] **Step 3: Manual verification**

Run: `cd game/Minecraft && npm run dev`
Open the preview in a browser. Expected: a sky-blue background with a single orange rotating-camera-viewable cube rendered via WebGL, no console errors.

- [ ] **Step 4: Commit**

```bash
cd game/Minecraft && git add src/webgl/WebGLGate.jsx src/App.jsx && git commit -m "feat(minecraft): add WebGL gate and base Three.js canvas"
```

---

### Task 18: ワールド描画（Chunkコンポーネント）

**Files:**
- Create: `game/Minecraft/src/world/Chunk.jsx`
- Modify: `game/Minecraft/src/App.jsx`

**Interfaces:**
- Consumes: `computeVisibleFaces` from `./chunkMesh.js`; `useWorldStore` from `./worldStore.js`; `BLOCK_DATA` from `../constants/blocks.js`; `WORLD_SIZE`, `WORLD_HEIGHT` from `./terrainGenerator.js`.
- Produces: `Chunk` component that renders one `<instancedMesh>` per distinct block color found in the visible-face set, each instance representing one visible face positioned as a thin unit-cube face at the correct offset (simplification: render whole unit cubes at each solid-block position that has at least one visible face, rather than per-face quads, since this MVP's world is small enough that whole-cube instancing at 64×64×32 is performance-acceptable and vastly simpler than true per-face greedy meshing).

- [ ] **Step 1: Implement Chunk.jsx**

`game/Minecraft/src/world/Chunk.jsx`:
```jsx
import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { computeVisibleFaces } from './chunkMesh.js'
import { useWorldStore } from './worldStore.js'
import { BLOCK_DATA } from '../constants/blocks.js'
import { WORLD_SIZE, WORLD_HEIGHT } from './terrainGenerator.js'

export default function Chunk() {
  const overrides = useWorldStore((s) => s.overrides)
  const getBlock = useWorldStore((s) => s.getBlock)

  const blocksByColor = useMemo(() => {
    const bounds = { minX: 0, maxX: WORLD_SIZE - 1, minY: 0, maxY: WORLD_HEIGHT - 1, minZ: 0, maxZ: WORLD_SIZE - 1 }
    const faces = computeVisibleFaces(bounds, getBlock)

    const seen = new Map() // "x,y,z" -> blockId, dedupes faces into one cube per position
    for (const face of faces) {
      seen.set(`${face.x},${face.y},${face.z}`, face.blockId)
    }

    const byColor = new Map() // color -> [{x,y,z}]
    for (const [key, blockId] of seen.entries()) {
      const color = BLOCK_DATA[blockId].color
      const [x, y, z] = key.split(',').map(Number)
      if (!byColor.has(color)) byColor.set(color, [])
      byColor.get(color).push({ x, y, z })
    }

    return byColor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrides, getBlock])

  return (
    <group>
      {Array.from(blocksByColor.entries()).map(([color, positions]) => (
        <ColorInstances key={color} color={color} positions={positions} />
      ))}
    </group>
  )
}

function ColorInstances({ color, positions }) {
  const meshRef = useRef()

  useEffect(() => {
    if (!meshRef.current) return
    const dummy = new THREE.Object3D()
    positions.forEach((pos, i) => {
      dummy.position.set(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [positions])

  return (
    <instancedMesh ref={meshRef} args={[null, null, positions.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </instancedMesh>
  )
}
```

- [ ] **Step 2: Wire into App.jsx**

Modify `game/Minecraft/src/App.jsx`, replacing the placeholder `<mesh>` cube with `<Chunk />`:
```jsx
import { Canvas } from '@react-three/fiber'
import WebGLGate from './webgl/WebGLGate.jsx'
import Chunk from './world/Chunk.jsx'

export default function App() {
  return (
    <WebGLGate>
      <div className="w-screen h-screen bg-sky-400">
        <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [32, 25, 80] }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 20, 10]} intensity={0.8} />
          <Chunk />
        </Canvas>
      </div>
    </WebGLGate>
  )
}
```

- [ ] **Step 3: Manual verification**

Run: `cd game/Minecraft && npm run dev`
Open the preview. Expected: a generated island terrain is visible (grass/sand/stone colored cubes forming a landscape), no console errors, frame rate stays smooth (no visible stutter).

- [ ] **Step 4: Commit**

```bash
cd game/Minecraft && git add src/world/Chunk.jsx src/App.jsx && git commit -m "feat(minecraft): render generated terrain as instanced voxel meshes"
```

---

### Task 19: プレイヤー移動・視点操作（Pointer Lock）

**Files:**
- Create: `game/Minecraft/src/player/PlayerController.jsx`
- Modify: `game/Minecraft/src/App.jsx`

**Interfaces:**
- Consumes: `useThree`, `useFrame` from `@react-three/fiber`; `PointerLockControls` from `@react-three/drei`; `useWorldStore` from `../world/worldStore.js`; `resolveAxisMovement` from `./collision.js`; `usePlayerStore` from `./playerStore.js`.
- Produces: `PlayerController` component (no props) that: locks the pointer on click, reads WASD via `keydown`/`keyup` listeners, applies gravity (`-20` units/s² capped at `-30` terminal velocity), jumps on Space when grounded, resolves movement via `resolveAxisMovement`, and syncs the Three.js camera position/rotation with `playerStore`.

- [ ] **Step 1: Implement PlayerController.jsx**

`game/Minecraft/src/player/PlayerController.jsx`:
```jsx
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import { useWorldStore } from '../world/worldStore.js'
import { usePlayerStore } from './playerStore.js'
import { resolveAxisMovement, PLAYER_HEIGHT } from './collision.js'

const MOVE_SPEED = 5
const GRAVITY = -20
const TERMINAL_VELOCITY = -30
const JUMP_VELOCITY = 8
const EYE_OFFSET = PLAYER_HEIGHT - 0.2

export default function PlayerController() {
  const { camera } = useThree()
  const keys = useRef({})
  const controlsRef = useRef()
  const getBlock = useWorldStore((s) => s.getBlock)

  useEffect(() => {
    const onKeyDown = (e) => { keys.current[e.code] = true }
    const onKeyUp = (e) => { keys.current[e.code] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useFrame((_, delta) => {
    const store = usePlayerStore.getState()
    if (store.isDead) return

    const forward = (keys.current['KeyW'] ? 1 : 0) - (keys.current['KeyS'] ? 1 : 0)
    const strafe = (keys.current['KeyD'] ? 1 : 0) - (keys.current['KeyA'] ? 1 : 0)

    const yaw = camera.rotation.y
    const sin = Math.sin(yaw)
    const cos = Math.cos(yaw)

    const moveX = (forward * -sin + strafe * cos) * MOVE_SPEED * delta
    const moveZ = (forward * -cos - strafe * sin) * MOVE_SPEED * delta

    let velocityY = store.velocityY + GRAVITY * delta
    velocityY = Math.max(velocityY, TERMINAL_VELOCITY)

    const groundCheckPos = { x: store.position.x, y: store.position.y - 0.05, z: store.position.z }
    const isGrounded = resolveAxisMovement(store.position, { x: 0, y: -0.05, z: 0 }, getBlock).y >= groundCheckPos.y

    if (isGrounded && keys.current['Space']) {
      velocityY = JUMP_VELOCITY
    }

    const delta3 = { x: moveX, y: velocityY * delta, z: moveZ }
    const nextPos = resolveAxisMovement(store.position, delta3, getBlock)

    const landed = delta3.y < 0 && nextPos.y === store.position.y
    if (landed) velocityY = 0

    store.setPosition(nextPos)
    store.setVelocityY(velocityY)
    store.setLook(camera.rotation.y, camera.rotation.x)

    camera.position.set(nextPos.x, nextPos.y + EYE_OFFSET, nextPos.z)
  })

  return <PointerLockControls ref={controlsRef} />
}
```

- [ ] **Step 2: Wire into App.jsx**

Modify `game/Minecraft/src/App.jsx`:
```jsx
import { Canvas } from '@react-three/fiber'
import WebGLGate from './webgl/WebGLGate.jsx'
import Chunk from './world/Chunk.jsx'
import PlayerController from './player/PlayerController.jsx'

export default function App() {
  return (
    <WebGLGate>
      <div className="w-screen h-screen bg-sky-400 relative">
        <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [32, 25, 32] }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 20, 10]} intensity={0.8} />
          <Chunk />
          <PlayerController />
        </Canvas>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-1 h-1 bg-white rounded-full" />
        </div>
      </div>
    </WebGLGate>
  )
}
```

- [ ] **Step 3: Manual verification**

Run: `cd game/Minecraft && npm run dev`
Open the preview, click the canvas to lock the pointer, move the mouse to look around, press WASD to walk, press Space to jump.
Expected: camera moves and looks around smoothly, player cannot walk through solid terrain, falls under gravity and lands on the surface without falling through it, jump works while grounded.

- [ ] **Step 4: Commit**

```bash
cd game/Minecraft && git add src/player/PlayerController.jsx src/App.jsx && git commit -m "feat(minecraft): add first-person movement, gravity, and collision"
```

---

### Task 20: ブロック破壊/設置の配線（レイキャスト）

**Files:**
- Create: `game/Minecraft/src/interaction/useBlockRaycast.js`
- Modify: `game/Minecraft/src/App.jsx`

**Interfaces:**
- Consumes: `useThree`, `useFrame` from `@react-three/fiber`; `useWorldStore` from `../world/worldStore.js`; `usePlayerStore` from `../player/playerStore.js`; `useInventoryStore` from `../inventory/inventoryStore.js`; `computeBreakResult`, `computePlaceResult`, `TOOL_TIERS` from `./blockActions.js`; `BLOCKS` from `../constants/blocks.js`.
- Produces: `useBlockRaycast()` hook (called once, no return value needed) that: on every frame, casts a ray from the camera forward direction up to 6 blocks; on `mousedown` button 0 (left click) breaks the targeted block (adds the drop to inventory via `addItem`); on `mousedown` button 2 (right click) places the block matching the selected hotbar item onto the face-adjacent empty cell (validated via `computePlaceResult`), consuming one from the hotbar stack.

- [ ] **Step 1: Implement useBlockRaycast.js**

`game/Minecraft/src/interaction/useBlockRaycast.js`:
```js
import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '../world/worldStore.js'
import { usePlayerStore } from '../player/playerStore.js'
import { useInventoryStore } from '../inventory/inventoryStore.js'
import { computeBreakResult, computePlaceResult, TOOL_TIERS } from './blockActions.js'
import { BLOCKS } from '../constants/blocks.js'

const MAX_DISTANCE = 6
const STEP = 0.05

const FACE_OFFSETS = {
  '+x': { x: 1, y: 0, z: 0 },
  '-x': { x: -1, y: 0, z: 0 },
  '+y': { x: 0, y: 1, z: 0 },
  '-y': { x: 0, y: -1, z: 0 },
  '+z': { x: 0, y: 0, z: 1 },
  '-z': { x: 0, y: 0, z: -1 },
}

function raycastBlocks(origin, direction, getBlock) {
  let x = origin.x, y = origin.y, z = origin.z
  let lastEmpty = { x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) }

  for (let t = 0; t < MAX_DISTANCE; t += STEP) {
    x = origin.x + direction.x * t
    y = origin.y + direction.y * t
    z = origin.z + direction.z * t
    const bx = Math.floor(x), by = Math.floor(y), bz = Math.floor(z)
    const block = getBlock(bx, by, bz)
    if (block !== BLOCKS.AIR) {
      return { hit: { x: bx, y: by, z: bz, blockId: block }, adjacent: lastEmpty }
    }
    lastEmpty = { x: bx, y: by, z: bz }
  }
  return { hit: null, adjacent: null }
}

export function useBlockRaycast() {
  const { camera } = useThree()
  const getBlock = useWorldStore((s) => s.getBlock)
  const targetRef = useRef(null)

  useFrame(() => {
    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)
    const result = raycastBlocks(camera.position, direction, getBlock)
    targetRef.current = result
  })

  useEffect(() => {
    function toolTierForSelectedItem() {
      const selected = useInventoryStore.getState().getSelectedItem()
      if (!selected) return 'none'
      if (selected.itemId === 'wood_pickaxe' || selected.itemId === 'wood_axe') return 'wood'
      if (selected.itemId === 'stone_pickaxe' || selected.itemId === 'stone_axe') return 'stone'
      return 'none'
    }

    function onMouseDown(event) {
      if (document.pointerLockElement === null) return
      const result = targetRef.current
      if (!result || !result.hit) return

      if (event.button === 0) {
        const { blockId, x, y, z } = result.hit
        const tier = toolTierForSelectedItem()
        const outcome = computeBreakResult(blockId, tier)
        if (outcome.success) {
          useWorldStore.getState().removeBlock(x, y, z)
          if (outcome.drop !== null) {
            useInventoryStore.getState().addItem(outcome.drop, 1)
          }
        }
      } else if (event.button === 2) {
        const selected = useInventoryStore.getState().getSelectedItem()
        if (!selected || typeof selected.itemId !== 'number') return
        const { adjacent } = result
        if (!adjacent) return
        const playerPos = usePlayerStore.getState().position
        const placeCheck = computePlaceResult(adjacent, playerPos)
        if (!placeCheck.allowed) return
        useWorldStore.getState().setBlock(adjacent.x, adjacent.y, adjacent.z, selected.itemId)
        useInventoryStore.getState().removeItem(selected.itemId, 1)
      }
    }

    function onContextMenu(event) {
      event.preventDefault()
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('contextmenu', onContextMenu)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('contextmenu', onContextMenu)
    }
  }, [])
}
```

- [ ] **Step 2: Wire into App.jsx**

Modify `game/Minecraft/src/App.jsx` to call the hook inside a small component rendered within the `Canvas` (hooks from `@react-three/fiber` must run inside the `Canvas` tree):
```jsx
import { Canvas } from '@react-three/fiber'
import WebGLGate from './webgl/WebGLGate.jsx'
import Chunk from './world/Chunk.jsx'
import PlayerController from './player/PlayerController.jsx'
import { useBlockRaycast } from './interaction/useBlockRaycast.js'

function Interaction() {
  useBlockRaycast()
  return null
}

export default function App() {
  return (
    <WebGLGate>
      <div className="w-screen h-screen bg-sky-400 relative">
        <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [32, 25, 32] }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 20, 10]} intensity={0.8} />
          <Chunk />
          <PlayerController />
          <Interaction />
        </Canvas>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-1 h-1 bg-white rounded-full" />
        </div>
      </div>
    </WebGLGate>
  )
}
```

- [ ] **Step 3: Manual verification**

Run: `cd game/Minecraft && npm run dev`
Open the preview, lock the pointer, aim at a nearby dirt/grass block within 6 blocks and left-click.
Expected: the block disappears from the world and an item is added to the hotbar (verify via a temporary `console.log(useInventoryStore.getState())` in the browser console, since the Hotbar UI isn't built until Task 22). Right-click on an empty adjacent face with a placeable block selected in hotbar slot 0 places it back.

- [ ] **Step 4: Commit**

```bash
cd game/Minecraft && git add src/interaction/useBlockRaycast.js src/App.jsx && git commit -m "feat(minecraft): wire block break/place via camera raycast"
```

---

### Task 21: 敵Mobの出現・描画・接触ダメージ

**Files:**
- Create: `game/Minecraft/src/entities/mobStore.js`
- Create: `game/Minecraft/src/entities/Mobs.jsx`
- Modify: `game/Minecraft/src/App.jsx`

**Interfaces:**
- Consumes: `computeMobStep` from `./mobAI.js`; `useWorldStore` from `../world/worldStore.js`; `usePlayerStore` from `../player/playerStore.js`; `isNight` from `../survival/dayNight.js`.
- Produces: `useMobStore` (Zustand) with state `{ mobs: {id, position}[] }` and actions `spawnMob(position)`, `removeMob(id)`, `updateMobPosition(id, position)`, `setMobs(mobs)`. `Mobs` component that: spawns a mob near the player every ~15 seconds while `isNight(time)` is true and fewer than 5 mobs exist (spawn position: a random point 10-15 blocks from the player at the terrain surface height, computed via `useWorldStore.getState().getBlock`); despawns mobs when `!isNight`; each frame moves every mob via `computeMobStep` and applies 2 damage/second to the player via `usePlayerStore.getState().damage` while `isAttacking` is true; renders each mob as a small red box mesh.

- [ ] **Step 1: Implement mobStore.js**

`game/Minecraft/src/entities/mobStore.js`:
```js
import { create } from 'zustand'

let nextId = 1

export const useMobStore = create((set) => ({
  mobs: [],

  spawnMob(position) {
    set((state) => ({ mobs: [...state.mobs, { id: nextId++, position }] }))
  },

  removeMob(id) {
    set((state) => ({ mobs: state.mobs.filter((m) => m.id !== id) }))
  },

  updateMobPosition(id, position) {
    set((state) => ({
      mobs: state.mobs.map((m) => (m.id === id ? { ...m, position } : m)),
    }))
  },

  setMobs(mobs) {
    set({ mobs })
  },
}))
```

- [ ] **Step 2: Implement Mobs.jsx**

`game/Minecraft/src/entities/Mobs.jsx`:
```jsx
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useMobStore } from './mobStore.js'
import { usePlayerStore } from '../player/playerStore.js'
import { useWorldStore } from '../world/worldStore.js'
import { computeMobStep } from './mobAI.js'
import { isNight } from '../survival/dayNight.js'
import { WORLD_SIZE, WORLD_HEIGHT } from '../world/terrainGenerator.js'

const MAX_MOBS = 5
const SPAWN_INTERVAL = 15
const ATTACK_DAMAGE_PER_SECOND = 2

function surfaceHeightAt(x, z, getBlock) {
  for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
    if (getBlock(x, y, z) !== 0) return y + 1
  }
  return 0
}

export default function Mobs({ getTime }) {
  const spawnTimer = useRef(0)
  const getBlock = useWorldStore((s) => s.getBlock)

  useFrame((_, delta) => {
    const time = getTime()
    const night = isNight(time)
    const playerPos = usePlayerStore.getState().position
    const mobState = useMobStore.getState()

    if (!night && mobState.mobs.length > 0) {
      useMobStore.getState().setMobs([])
    }

    if (night) {
      spawnTimer.current += delta
      if (spawnTimer.current >= SPAWN_INTERVAL && mobState.mobs.length < MAX_MOBS) {
        spawnTimer.current = 0
        const angle = Math.random() * Math.PI * 2
        const dist = 10 + Math.random() * 5
        const x = Math.max(0, Math.min(WORLD_SIZE - 1, Math.round(playerPos.x + Math.cos(angle) * dist)))
        const z = Math.max(0, Math.min(WORLD_SIZE - 1, Math.round(playerPos.z + Math.sin(angle) * dist)))
        const y = surfaceHeightAt(x, z, getBlock)
        useMobStore.getState().spawnMob({ x, y, z })
      }
    }

    for (const mob of mobState.mobs) {
      const step = computeMobStep(mob, playerPos, delta)
      useMobStore.getState().updateMobPosition(mob.id, step.position)
      if (step.isAttacking) {
        usePlayerStore.getState().damage(ATTACK_DAMAGE_PER_SECOND * delta)
      }
    }
  })

  const mobs = useMobStore((s) => s.mobs)

  return (
    <>
      {mobs.map((mob) => (
        <mesh key={mob.id} position={[mob.position.x, mob.position.y + 0.9, mob.position.z]}>
          <boxGeometry args={[0.6, 1.8, 0.6]} />
          <meshStandardMaterial color="#b71c1c" />
        </mesh>
      ))}
    </>
  )
}
```

- [ ] **Step 3: Wire into App.jsx**

For now, pass a placeholder `getTime` that always returns daytime (the real day/night clock is wired in Task 23); this lets the mob system be verified independently first with a manual override.

Modify `game/Minecraft/src/App.jsx`, adding inside `<Canvas>`:
```jsx
import Mobs from './entities/Mobs.jsx'
// ...
<Mobs getTime={() => 400} />
```//(400 seconds = within the night window per DAY_LENGTH_SECONDS=600, isNight threshold 360)

- [ ] **Step 4: Manual verification**

Run: `cd game/Minecraft && npm run dev`
Open the preview. Expected: within ~15 seconds, a red box (mob) spawns 10-15 blocks from the player and moves toward the player; when it reaches melee range the player's health (check via `console.log(usePlayerStore.getState().health)` in browser console) decreases over time.

- [ ] **Step 5: Commit**

```bash
cd game/Minecraft && git add src/entities/mobStore.js src/entities/Mobs.jsx src/App.jsx && git commit -m "feat(minecraft): add hostile mob spawning, chase AI, and contact damage"
```

---

### Task 22: HUD・ホットバー・インベントリ・クラフトUI

**Files:**
- Create: `game/Minecraft/src/inventory/ui/Hotbar.jsx`
- Create: `game/Minecraft/src/inventory/ui/HUD.jsx`
- Create: `game/Minecraft/src/inventory/ui/InventoryPanel.jsx`
- Create: `game/Minecraft/src/inventory/ui/CraftingPanel.jsx`
- Modify: `game/Minecraft/src/App.jsx`

**Interfaces:**
- Consumes: `useInventoryStore`, `HOTBAR_SIZE` from `../inventoryStore.js`; `usePlayerStore` from `../../player/playerStore.js`; `matchRecipe` from `../craftingRecipes.js`; `BLOCK_DATA` from `../../constants/blocks.js`.
- Produces: `Hotbar` (renders 9 slots, highlights `selectedHotbarIndex`, listens for number keys `1`-`9` to call `selectHotbarIndex`), `HUD` (renders health as hearts count and hunger as a number, reading from `usePlayerStore`), `InventoryPanel` (toggled by pressing `E`; renders the 27 inventory slots in a grid), `CraftingPanel` (renders a 3x3 grid the user can click items into from inventory — for MVP, implemented as: click an inventory slot to place one item into the next empty crafting cell, click a crafting cell to return it to inventory, and a "Craft" button that calls `matchRecipe`, checks `hasItems`, and on success calls `consumeItems` + `addItem`).

- [ ] **Step 1: Implement Hotbar.jsx**

`game/Minecraft/src/inventory/ui/Hotbar.jsx`:
```jsx
import { useEffect } from 'react'
import { useInventoryStore, HOTBAR_SIZE } from '../inventoryStore.js'

export default function Hotbar() {
  const hotbar = useInventoryStore((s) => s.hotbar)
  const selectedHotbarIndex = useInventoryStore((s) => s.selectedHotbarIndex)
  const selectHotbarIndex = useInventoryStore((s) => s.selectHotbarIndex)

  useEffect(() => {
    function onKeyDown(e) {
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= HOTBAR_SIZE) {
        selectHotbarIndex(num - 1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectHotbarIndex])

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
      {hotbar.map((slot, i) => (
        <div
          key={i}
          className={`w-12 h-12 flex items-center justify-center text-xs text-white border-2 ${
            i === selectedHotbarIndex ? 'border-white' : 'border-gray-500'
          } bg-black/50`}
        >
          {slot ? `${slot.itemId}x${slot.count}` : ''}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Implement HUD.jsx**

`game/Minecraft/src/inventory/ui/HUD.jsx`:
```jsx
import { usePlayerStore } from '../../player/playerStore.js'

export default function HUD() {
  const health = usePlayerStore((s) => s.health)
  const hunger = usePlayerStore((s) => s.hunger)
  const isDead = usePlayerStore((s) => s.isDead)

  return (
    <div className="absolute top-4 left-4 text-white font-mono pointer-events-none">
      <p>❤ {Math.ceil(health)}/20</p>
      <p>🍗 {Math.ceil(hunger)}/20</p>
      {isDead && <p className="text-red-500 text-2xl">YOU DIED</p>}
    </div>
  )
}
```

- [ ] **Step 3: Implement InventoryPanel.jsx and CraftingPanel.jsx**

`game/Minecraft/src/inventory/ui/CraftingPanel.jsx`:
```jsx
import { useState } from 'react'
import { useInventoryStore } from '../inventoryStore.js'
import { matchRecipe } from '../craftingRecipes.js'

export default function CraftingPanel() {
  const [grid, setGrid] = useState(new Array(9).fill(null))
  const addItem = useInventoryStore((s) => s.addItem)
  const hasItems = useInventoryStore((s) => s.hasItems)
  const consumeItems = useInventoryStore((s) => s.consumeItems)

  const result = matchRecipe(grid)

  function placeInGrid(itemId) {
    const emptyIndex = grid.findIndex((cell) => cell === null)
    if (emptyIndex === -1) return
    const next = [...grid]
    next[emptyIndex] = itemId
    setGrid(next)
  }

  function clearGridCell(index) {
    const next = [...grid]
    next[index] = null
    setGrid(next)
  }

  function craft() {
    if (!result) return
    const requirements = {}
    for (const item of grid) {
      if (item === null) continue
      requirements[item] = (requirements[item] ?? 0) + 1
    }
    if (!hasItems(requirements)) return
    consumeItems(requirements)
    addItem(result.itemId, result.count)
    setGrid(new Array(9).fill(null))
  }

  return (
    <div className="bg-gray-900 p-4 rounded text-white">
      <p className="mb-2">クラフト</p>
      <div className="grid grid-cols-3 gap-1 mb-2">
        {grid.map((cell, i) => (
          <button
            key={i}
            onClick={() => clearGridCell(i)}
            className="w-10 h-10 border border-gray-500 flex items-center justify-center text-xs"
          >
            {cell ?? ''}
          </button>
        ))}
      </div>
      <button
        onClick={craft}
        disabled={!result}
        className="px-3 py-1 bg-green-700 disabled:bg-gray-600 rounded"
      >
        {result ? `Craft: ${result.itemId} x${result.count}` : 'Craft'}
      </button>
      <div className="mt-2 flex gap-1 flex-wrap">
        <p className="w-full text-xs text-gray-400">クリックでクラフト欄に追加:</p>
        {['coal', 'stick'].map((testItem) => (
          <button key={testItem} onClick={() => placeInGrid(testItem)} className="px-2 py-1 bg-gray-700 rounded text-xs">
            {testItem}
          </button>
        ))}
      </div>
    </div>
  )
}
```

`game/Minecraft/src/inventory/ui/InventoryPanel.jsx`:
```jsx
import { useInventoryStore } from '../inventoryStore.js'
import CraftingPanel from './CraftingPanel.jsx'

export default function InventoryPanel({ onClose }) {
  const inventory = useInventoryStore((s) => s.inventory)

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
      <div className="bg-gray-800 p-4 rounded flex gap-4">
        <div>
          <p className="text-white mb-2">インベントリ (Eで閉じる)</p>
          <div className="grid grid-cols-9 gap-1">
            {inventory.map((slot, i) => (
              <div key={i} className="w-10 h-10 border border-gray-500 flex items-center justify-center text-xs text-white">
                {slot ? `${slot.itemId}x${slot.count}` : ''}
              </div>
            ))}
          </div>
        </div>
        <CraftingPanel />
      </div>
    </div>
  )
}
```

Note: `onClose` prop is accepted but the close button itself is handled by the parent listening for the `E` key (Step 4), consistent with how the panel is opened.

- [ ] **Step 4: Wire into App.jsx**

Modify `game/Minecraft/src/App.jsx`:
```jsx
import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import WebGLGate from './webgl/WebGLGate.jsx'
import Chunk from './world/Chunk.jsx'
import PlayerController from './player/PlayerController.jsx'
import { useBlockRaycast } from './interaction/useBlockRaycast.js'
import Mobs from './entities/Mobs.jsx'
import Hotbar from './inventory/ui/Hotbar.jsx'
import HUD from './inventory/ui/HUD.jsx'
import InventoryPanel from './inventory/ui/InventoryPanel.jsx'

function Interaction() {
  useBlockRaycast()
  return null
}

export default function App() {
  const [inventoryOpen, setInventoryOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e) {
      if (e.code === 'KeyE') setInventoryOpen((open) => !open)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <WebGLGate>
      <div className="w-screen h-screen bg-sky-400 relative">
        <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [32, 25, 32] }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 20, 10]} intensity={0.8} />
          <Chunk />
          <PlayerController />
          <Interaction />
          <Mobs getTime={() => 400} />
        </Canvas>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-1 h-1 bg-white rounded-full" />
        </div>
        <HUD />
        <Hotbar />
        {inventoryOpen && <InventoryPanel onClose={() => setInventoryOpen(false)} />}
      </div>
    </WebGLGate>
  )
}
```

- [ ] **Step 5: Manual verification**

Run: `cd game/Minecraft && npm run dev`
Expected: HUD shows health/hunger in the top-left, hotbar shows 9 slots at the bottom (highlighting the selected one, switchable with number keys 1-9), pressing `E` opens/closes the inventory+crafting panel, breaking a block updates the hotbar count visibly.

- [ ] **Step 6: Commit**

```bash
cd game/Minecraft && git add src/inventory/ui src/App.jsx && git commit -m "feat(minecraft): add HUD, hotbar, inventory and crafting UI"
```

---

### Task 23: 昼夜サイクルとサバイバルティックの配線

**Files:**
- Create: `game/Minecraft/src/survival/useSurvivalTick.js`
- Modify: `game/Minecraft/src/App.jsx`

**Interfaces:**
- Consumes: `useFrame` from `@react-three/fiber`; `advanceTime`, `lightIntensityFor` from `./dayNight.js`; `applyHungerTick`, `applyStarvationDamage`, `applyRegeneration` from `./health.js`; `usePlayerStore` from `../player/playerStore.js`.
- Produces: `useSurvivalTick()` hook that maintains a `time` ref (starting at `0`, i.e. midnight — matches the "night" default used by Task 21/22's manual test), advances it every frame via `advanceTime`, applies hunger/starvation/regeneration to `playerStore` every frame, and returns `{ getTime, getLightIntensity }` accessor functions (not reactive state, to avoid re-rendering on every frame — consumers call these inside their own `useFrame`).

- [ ] **Step 1: Implement useSurvivalTick.js**

`game/Minecraft/src/survival/useSurvivalTick.js`:
```js
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { advanceTime, lightIntensityFor } from './dayNight.js'
import { applyHungerTick, applyStarvationDamage, applyRegeneration } from './health.js'
import { usePlayerStore } from '../player/playerStore.js'

export function useSurvivalTick() {
  const timeRef = useRef(0)

  useFrame((_, delta) => {
    timeRef.current = advanceTime(timeRef.current, delta)

    const store = usePlayerStore.getState()
    if (store.isDead) return

    const newHunger = applyHungerTick(store.hunger, delta)
    let newHealth = applyStarvationDamage(store.health, newHunger, delta)
    newHealth = applyRegeneration(newHealth, newHunger, delta)

    store.setHunger(newHunger)
    if (newHealth < store.health) {
      store.damage(store.health - newHealth)
    } else if (newHealth > store.health) {
      store.heal(newHealth - store.health)
    }
  })

  return {
    getTime: () => timeRef.current,
    getLightIntensity: () => lightIntensityFor(timeRef.current),
  }
}
```

- [ ] **Step 2: Wire into App.jsx**

Modify `game/Minecraft/src/App.jsx`: replace the fixed `getTime={() => 400}` passed to `Mobs` with the real clock, and drive the directional light's intensity from it. Since `useSurvivalTick` (and any hook using `useFrame`) must run inside the `Canvas` tree, introduce a small `Scene` component:

```jsx
import { useEffect, useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import WebGLGate from './webgl/WebGLGate.jsx'
import Chunk from './world/Chunk.jsx'
import PlayerController from './player/PlayerController.jsx'
import { useBlockRaycast } from './interaction/useBlockRaycast.js'
import Mobs from './entities/Mobs.jsx'
import Hotbar from './inventory/ui/Hotbar.jsx'
import HUD from './inventory/ui/HUD.jsx'
import InventoryPanel from './inventory/ui/InventoryPanel.jsx'
import { useSurvivalTick } from './survival/useSurvivalTick.js'

function Interaction() {
  useBlockRaycast()
  return null
}

function DayNightLight({ getLightIntensity }) {
  const lightRef = useRef()
  useFrame(() => {
    if (lightRef.current) lightRef.current.intensity = getLightIntensity()
  })
  return <directionalLight ref={lightRef} position={[10, 20, 10]} intensity={1} />
}

function Scene() {
  const { getTime, getLightIntensity } = useSurvivalTick()
  return (
    <>
      <ambientLight intensity={0.3} />
      <DayNightLight getLightIntensity={getLightIntensity} />
      <Chunk />
      <PlayerController />
      <Interaction />
      <Mobs getTime={getTime} />
    </>
  )
}

export default function App() {
  const [inventoryOpen, setInventoryOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e) {
      if (e.code === 'KeyE') setInventoryOpen((open) => !open)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <WebGLGate>
      <div className="w-screen h-screen bg-sky-400 relative">
        <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [32, 25, 32] }}>
          <Scene />
        </Canvas>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-1 h-1 bg-white rounded-full" />
        </div>
        <HUD />
        <Hotbar />
        {inventoryOpen && <InventoryPanel onClose={() => setInventoryOpen(false)} />}
      </div>
    </WebGLGate>
  )
}
```

- [ ] **Step 3: Manual verification**

Run: `cd game/Minecraft && npm run dev`
Wait and observe over a couple of minutes (or temporarily lower `DAY_LENGTH_SECONDS` in `dayNight.js` to `30` for faster manual testing, then revert). Expected: lighting dims and brightens following the cycle, hunger number in the HUD slowly decreases over time, and health decreases once hunger hits 0.

- [ ] **Step 4: Commit**

```bash
cd game/Minecraft && git add src/survival/useSurvivalTick.js src/App.jsx && git commit -m "feat(minecraft): wire day/night lighting and hunger/health ticks"
```

---

### Task 24: 自動セーブ・ロードの配線

**Files:**
- Create: `game/Minecraft/src/persistence/useAutoSave.js`
- Modify: `game/Minecraft/src/App.jsx`

**Interfaces:**
- Consumes: `saveToLocalStorage`, `loadFromLocalStorage` from `./saveGame.js`; `useWorldStore` from `../world/worldStore.js`; `usePlayerStore` from `../player/playerStore.js`; `useInventoryStore` from `../inventory/inventoryStore.js`.
- Produces: `loadGameOnStartup()` (call once, outside React, before first render — applies any saved state to the three stores), `useAutoSave(getTime)` hook that: saves the combined state every 5 seconds (via `setInterval`) and once more on the `beforeunload` window event, then cleans up both on unmount.

- [ ] **Step 1: Implement useAutoSave.js**

`game/Minecraft/src/persistence/useAutoSave.js`:
```js
import { useEffect } from 'react'
import { saveToLocalStorage, loadFromLocalStorage } from './saveGame.js'
import { useWorldStore } from '../world/worldStore.js'
import { usePlayerStore } from '../player/playerStore.js'
import { useInventoryStore } from '../inventory/inventoryStore.js'

function buildSavePayload(time) {
  const world = useWorldStore.getState()
  const player = usePlayerStore.getState()
  const inventory = useInventoryStore.getState()

  return {
    seed: world.seed,
    overridesEntries: world.getOverridesEntries(),
    playerPosition: player.position,
    playerYaw: player.yaw,
    playerPitch: player.pitch,
    health: player.health,
    hunger: player.hunger,
    hotbar: inventory.hotbar,
    inventory: inventory.inventory,
    selectedHotbarIndex: inventory.selectedHotbarIndex,
    time,
  }
}

export function loadGameOnStartup() {
  const saved = loadFromLocalStorage()
  if (!saved) return null

  useWorldStore.getState().resetWorld(saved.seed)
  useWorldStore.getState().loadOverrides(saved.overridesEntries)
  usePlayerStore.getState().setPosition(saved.playerPosition)
  usePlayerStore.getState().setLook(saved.playerYaw, saved.playerPitch)
  usePlayerStore.getState().setHunger(saved.hunger)
  if (saved.health > usePlayerStore.getState().health) {
    usePlayerStore.getState().heal(saved.health - usePlayerStore.getState().health)
  } else if (saved.health < usePlayerStore.getState().health) {
    usePlayerStore.getState().damage(usePlayerStore.getState().health - saved.health)
  }
  useInventoryStore.getState().loadInventoryState({
    hotbar: saved.hotbar,
    inventory: saved.inventory,
    selectedHotbarIndex: saved.selectedHotbarIndex,
  })

  return saved.time
}

export function useAutoSave(getTime) {
  useEffect(() => {
    function save() {
      saveToLocalStorage(buildSavePayload(getTime()))
    }

    const intervalId = setInterval(save, 5000)
    window.addEventListener('beforeunload', save)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('beforeunload', save)
    }
  }, [getTime])
}
```

- [ ] **Step 2: Wire into App.jsx**

Modify `game/Minecraft/src/App.jsx`: call `loadGameOnStartup()` once at module scope (before the component tree mounts) to restore any saved world/player/inventory state, and call `useAutoSave(getTime)` inside `Scene` (where `getTime` is already available from `useSurvivalTick`). Update `useSurvivalTick` usage in `Scene`:

```jsx
import { loadGameOnStartup, useAutoSave } from './persistence/useAutoSave.js'

loadGameOnStartup()

function Scene() {
  const { getTime, getLightIntensity } = useSurvivalTick()
  useAutoSave(getTime)
  return (
    <>
      <ambientLight intensity={0.3} />
      <DayNightLight getLightIntensity={getLightIntensity} />
      <Chunk />
      <PlayerController />
      <Interaction />
      <Mobs getTime={getTime} />
    </>
  )
}
```

Note: `loadGameOnStartup()` runs synchronously at module load, before `usePlayerStore`'s initial position is consumed by `PlayerController`'s camera sync, so the restored position takes effect from the first frame.

- [ ] **Step 3: Manual verification**

Run: `cd game/Minecraft && npm run dev`
Break a few blocks, move around, wait 5+ seconds, then reload the page.
Expected: the broken blocks remain broken, the player spawns back at (roughly) the last saved position, and the hotbar retains the collected items. Open browser devtools → Application → Local Storage to confirm a `minecraft-clone-save-v1` entry exists.

- [ ] **Step 4: Commit**

```bash
cd game/Minecraft && git add src/persistence/useAutoSave.js src/App.jsx && git commit -m "feat(minecraft): wire auto-save and load-on-startup"
```

---

### Task 25: 最終統合テストと README更新

**Files:**
- Modify: `game/README.md`
- Create: `game/Minecraft/README.md`

**Interfaces:**
- None (documentation + manual QA pass only).

- [ ] **Step 1: Run the full automated test suite**

Run: `cd game/Minecraft && npm run test`
Expected: all unit tests across every task pass (blocks, noise, terrainGenerator, worldStore, collision, playerStore, blockActions, health, dayNight, mobAI, craftingRecipes, inventoryStore, checkWebGL, saveGame, chunkMesh).

- [ ] **Step 2: Run lint and build**

Run: `cd game/Minecraft && npm run lint && npm run build`
Expected: both exit 0 with no errors.

- [ ] **Step 3: Full manual playtest checklist**

Run: `cd game/Minecraft && npm run dev`, open the preview, and confirm each item:
- [ ] Terrain renders as a distinguishable island with grass/sand/stone/water
- [ ] WASD movement + mouse look work after clicking to lock the pointer
- [ ] Player collides with terrain (no walking through walls, no falling through the ground)
- [ ] Space jumps when grounded
- [ ] Left-click breaks the targeted block and adds its drop to the hotbar
- [ ] Right-click places the selected hotbar block on an adjacent empty cell
- [ ] Number keys 1-9 switch the selected hotbar slot
- [ ] `E` opens/closes the inventory + crafting panel
- [ ] Crafting wood → planks → sticks → wood_pickaxe produces items and consumes inputs correctly
- [ ] Stone requires a wood-tier tool or better to break (bare hands fail)
- [ ] HUD shows health and hunger, both changing over time
- [ ] Hunger reaching 0 causes health to drop over time
- [ ] A hostile mob spawns at night, chases the player, and deals contact damage
- [ ] Reloading the page restores the world diff, player position, and inventory

- [ ] **Step 4: Write project README**

`game/Minecraft/README.md`:
```markdown
# Minecraft (clone)

ブラウザで動くマイクラ風ボクセルサバイバルゲーム。React + Three.js (react-three-fiber) 製。

## 遊び方

- WASD: 移動
- マウス: 視点操作（クリックしてポインターロック）
- 左クリック: ブロック破壊
- 右クリック: ブロック設置
- Space: ジャンプ
- 1-9: ホットバー選択
- E: インベントリ/クラフトを開閉

## 開発

\`\`\`bash
npm install
npm run dev
npm run test
\`\`\`

詳細な設計は [../docs/superpowers/specs/2026-07-05-minecraft-clone-design.md](../docs/superpowers/specs/2026-07-05-minecraft-clone-design.md) を参照。
```

Modify `game/README.md`, appending after the existing entries:
```markdown

Minecraft
![Minecraft](./images/minecraft.png)
```

(Screenshot capture of `./images/minecraft.png` is a manual follow-up step for the user — take a screenshot of the running game and save it there; not automatable within this plan.)

- [ ] **Step 5: Commit**

```bash
cd game/Minecraft && git add README.md
cd game && git add README.md
git commit -m "docs(minecraft): add project README and update game index"
```

---

## Post-plan notes

- The axe recipes (`wood_axe`, `stone_axe`) are defined in `craftingRecipes.js` but unreachable via `matchRecipe` due to sharing identical inputs with the pickaxe recipes (see Task 12 note). This is intentional for MVP scope — flag to the user if axes become desired later, as it would require adding shaped (positional) recipe matching.
- Screenshot for `game/README.md` (`game/images/minecraft.png`) must be captured manually after the game is running, following the same pattern as `Tetris` and `Valentine_matching`.
