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
