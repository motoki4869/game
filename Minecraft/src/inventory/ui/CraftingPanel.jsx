import ItemIcon from './ItemIcon.jsx'

// Controlled crafting area: 3x3 grid -> arrow -> result slot, vanilla
// layout. The parent (InventoryPanel) owns the grid state and the craft
// action; this component only renders and forwards clicks.
export default function CraftingPanel({ grid, result, onCellClick, onCraft }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid grid-cols-3 gap-1">
        {grid.map((cell, i) => (
          <button
            key={i}
            onClick={() => onCellClick(i)}
            className="w-11 h-11 bg-[#8b8b8b] border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white flex items-center justify-center"
          >
            {cell !== null && <ItemIcon itemId={cell} count={1} />}
          </button>
        ))}
      </div>
      <span className="text-3xl text-[#373737]">→</span>
      <button
        onClick={onCraft}
        disabled={!result}
        className="w-14 h-14 bg-[#8b8b8b] border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white flex items-center justify-center disabled:opacity-60"
      >
        {result && <ItemIcon itemId={result.itemId} count={result.count} />}
      </button>
    </div>
  )
}
