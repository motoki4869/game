import { useEffect } from 'react'
import { useInventoryStore, HOTBAR_SIZE } from '../inventoryStore.js'
import ItemIcon from './ItemIcon.jsx'

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
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex pointer-events-none bg-black/40 p-0.5 rounded-sm">
      {hotbar.map((slot, i) => (
        <div
          key={i}
          className={`w-12 h-12 flex items-center justify-center border-2 ${
            i === selectedHotbarIndex ? 'border-white bg-white/20' : 'border-[#5a5a5a] bg-black/30'
          }`}
        >
          {slot && <ItemIcon itemId={slot.itemId} count={slot.count} />}
        </div>
      ))}
    </div>
  )
}
