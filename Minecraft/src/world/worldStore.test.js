import { describe, it, expect, beforeEach } from 'vitest'
import { useWorldStore, CHUNK_SIZE, chunkKeyFor } from './worldStore.js'
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

describe('chunk versioning', () => {
  beforeEach(() => {
    useWorldStore.getState().resetWorld(1)
  })

  it('chunkKeyFor maps world coordinates to a chunk key', () => {
    expect(chunkKeyFor(0, 0)).toBe('0,0')
    expect(chunkKeyFor(CHUNK_SIZE - 1, CHUNK_SIZE - 1)).toBe('0,0')
    expect(chunkKeyFor(CHUNK_SIZE, 0)).toBe('1,0')
    expect(chunkKeyFor(0, CHUNK_SIZE * 2)).toBe('0,2')
  })

  it('setBlock bumps the containing chunk version', () => {
    const { setBlock, getChunkVersion } = useWorldStore.getState()
    const before = getChunkVersion('1,1')
    setBlock(CHUNK_SIZE + 4, 10, CHUNK_SIZE + 4, BLOCKS.PLANKS)
    expect(useWorldStore.getState().getChunkVersion('1,1')).toBe(before + 1)
  })

  it('setBlock on an interior cell does not bump neighbor chunks', () => {
    const { setBlock } = useWorldStore.getState()
    setBlock(CHUNK_SIZE + 4, 10, CHUNK_SIZE + 4, BLOCKS.PLANKS)
    expect(useWorldStore.getState().getChunkVersion('0,1')).toBe(0)
    expect(useWorldStore.getState().getChunkVersion('2,1')).toBe(0)
    expect(useWorldStore.getState().getChunkVersion('1,0')).toBe(0)
    expect(useWorldStore.getState().getChunkVersion('1,2')).toBe(0)
  })

  it('setBlock on a chunk border also bumps the adjacent chunk (face culling depends on it)', () => {
    const { setBlock } = useWorldStore.getState()
    setBlock(CHUNK_SIZE, 10, CHUNK_SIZE + 4, BLOCKS.PLANKS) // x on -x border of chunk (1,1)
    expect(useWorldStore.getState().getChunkVersion('1,1')).toBe(1)
    expect(useWorldStore.getState().getChunkVersion('0,1')).toBe(1)
  })

  it('resetWorld clears chunk versions', () => {
    const { setBlock } = useWorldStore.getState()
    setBlock(4, 10, 4, BLOCKS.PLANKS)
    useWorldStore.getState().resetWorld(1)
    expect(useWorldStore.getState().getChunkVersion('0,0')).toBe(0)
  })
})
