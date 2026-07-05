import { BLOCK_DATA } from '../../constants/blocks.js'

const ITEM_INFO = {
  stick: { label: '棒', color: '#8a6b42' },
  coal: { label: '石炭', color: '#2b2b2b' },
  iron_ore: { label: '鉄鉱石', color: '#d8af93' },
  wood_pickaxe: { label: '木ツルハシ', color: '#a9835a' },
  stone_pickaxe: { label: '石ツルハシ', color: '#8b8b8b' },
  wood_axe: { label: '木の斧', color: '#a9835a' },
  stone_axe: { label: '石の斧', color: '#8b8b8b' },
}

const BLOCK_LABELS = {
  grass: '草',
  dirt: '土',
  stone: '石',
  sand: '砂',
  water: '水',
  wood: '原木',
  leaves: '葉',
  planks: '板材',
  coal_ore: '石炭鉱石',
  iron_ore: '鉄鉱石',
}

function itemInfo(itemId) {
  if (typeof itemId === 'number') {
    const data = BLOCK_DATA[itemId]
    if (!data) return { label: String(itemId), color: '#666666' }
    return { label: BLOCK_LABELS[data.name] ?? data.name, color: data.color }
  }
  return ITEM_INFO[itemId] ?? { label: String(itemId), color: '#666666' }
}

// Minecraft-style slot content: a colored tile with the item name and a
// count badge in the bottom-right corner.
export default function ItemIcon({ itemId, count, size = 'md' }) {
  const { label, color } = itemInfo(itemId)
  const isTool = typeof itemId === 'string' && itemId.includes('_')
  const dims = size === 'sm' ? 'w-8 h-8 text-[8px]' : 'w-10 h-10 text-[9px]'

  return (
    <div className={`relative ${dims} flex items-center justify-center rounded-sm select-none`}>
      <div
        className={`absolute inset-0.5 rounded-sm ${isTool ? '' : 'border border-black/40'}`}
        style={{
          backgroundColor: color,
          clipPath: isTool ? 'polygon(20% 100%, 45% 100%, 100% 20%, 80% 0%, 0% 75%)' : undefined,
        }}
      />
      <span className="relative z-10 text-white leading-tight text-center px-0.5" style={{ textShadow: '1px 1px 0 #000' }}>
        {label}
      </span>
      {count > 1 && (
        <span
          className="absolute bottom-0 right-0 z-10 text-white text-[10px] font-bold leading-none"
          style={{ textShadow: '1px 1px 0 #000' }}
        >
          {count}
        </span>
      )}
    </div>
  )
}
