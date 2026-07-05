import { useState } from 'react'
import { useInventoryStore } from '../inventoryStore.js'
import { matchRecipe } from '../craftingRecipes.js'
import { BLOCKS } from '../../constants/blocks.js'

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
        {[BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.STONE, 'stick'].map((testItem) => (
          <button key={testItem} onClick={() => placeInGrid(testItem)} className="px-2 py-1 bg-gray-700 rounded text-xs">
            {testItem}
          </button>
        ))}
      </div>
    </div>
  )
}
