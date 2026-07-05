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
