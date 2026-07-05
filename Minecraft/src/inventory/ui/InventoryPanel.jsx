import { useState } from 'react'
import { useInventoryStore } from '../inventoryStore.js'
import { matchRecipe } from '../craftingRecipes.js'
import CraftingPanel from './CraftingPanel.jsx'
import ItemIcon from './ItemIcon.jsx'

function Slot({ slot, onClick, highlight = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-11 h-11 bg-[#8b8b8b] border-2 flex items-center justify-center ${
        highlight
          ? 'border-white'
          : 'border-t-[#373737] border-l-[#373737] border-b-white border-r-white'
      }`}
    >
      {slot && <ItemIcon itemId={slot.itemId} count={slot.count} />}
    </button>
  )
}

// Vanilla-style inventory screen: crafting grid + result on top, the 27
// main slots below, hotbar row at the bottom. Clicking a slot commits one
// of that item into the crafting grid; clicking a grid cell returns it.
export default function InventoryPanel() {
  const [grid, setGrid] = useState(new Array(9).fill(null))
  const inventory = useInventoryStore((s) => s.inventory)
  const hotbar = useInventoryStore((s) => s.hotbar)
  const hasItems = useInventoryStore((s) => s.hasItems)
  const consumeItems = useInventoryStore((s) => s.consumeItems)
  const addItem = useInventoryStore((s) => s.addItem)

  const result = matchRecipe(grid)

  function committedCount(itemId) {
    return grid.reduce((sum, cell) => sum + (cell !== null && String(cell) === String(itemId) ? 1 : 0), 0)
  }

  function ownedCount(itemId) {
    const all = [...hotbar, ...inventory]
    return all.reduce((sum, slot) => sum + (slot && String(slot.itemId) === String(itemId) ? slot.count : 0), 0)
  }

  function placeFromSlot(slot) {
    if (!slot) return
    if (committedCount(slot.itemId) >= ownedCount(slot.itemId)) return
    const emptyIndex = grid.findIndex((cell) => cell === null)
    if (emptyIndex === -1) return
    const next = [...grid]
    next[emptyIndex] = slot.itemId
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
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
      <div className="bg-[#c6c6c6] p-4 rounded border-4 border-t-white border-l-white border-b-[#555555] border-r-[#555555]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[#404040] font-bold">クラフト</p>
          <p className="text-[#404040] text-xs">Eで閉じる</p>
        </div>
        <div className="mb-4">
          <CraftingPanel grid={grid} result={result} onCellClick={clearGridCell} onCraft={craft} />
          <p className="text-[#555555] text-[11px] mt-1">
            下のアイテムをクリックして材料を置く / 置いた材料はクリックで戻す / 完成品をクリックでクラフト
          </p>
        </div>
        <p className="text-[#404040] text-sm mb-1">インベントリ</p>
        <div className="grid grid-cols-9 gap-1 mb-3">
          {inventory.map((slot, i) => (
            <Slot key={i} slot={slot} onClick={() => placeFromSlot(slot)} />
          ))}
        </div>
        <div className="grid grid-cols-9 gap-1">
          {hotbar.map((slot, i) => (
            <Slot key={i} slot={slot} onClick={() => placeFromSlot(slot)} />
          ))}
        </div>
      </div>
    </div>
  )
}
