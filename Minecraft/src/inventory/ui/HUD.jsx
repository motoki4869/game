import { usePlayerStore, DEFAULT_SPAWN_POSITION } from '../../player/playerStore.js'

// Vanilla-style status bars: 10 hearts (2 HP each) and 10 drumsticks,
// anchored just above the hotbar.
function IconRow({ count10, icon, activeClass }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 10 }, (_, i) => {
        const filled = count10 >= (i + 1) * 2
        const half = !filled && count10 >= i * 2 + 1
        return (
          <span
            key={i}
            className={`text-sm leading-none ${filled ? activeClass : half ? `${activeClass} opacity-60` : 'opacity-20'}`}
            style={{ textShadow: '1px 1px 0 #000' }}
          >
            {icon}
          </span>
        )
      })}
    </div>
  )
}

export default function HUD() {
  const health = usePlayerStore((s) => s.health)
  const hunger = usePlayerStore((s) => s.hunger)
  const isDead = usePlayerStore((s) => s.isDead)

  return (
    <>
      <div className="absolute bottom-[70px] left-1/2 -translate-x-1/2 flex gap-8 pointer-events-none">
        <IconRow count10={Math.ceil(health)} icon="❤" activeClass="text-red-500" />
        <IconRow count10={Math.ceil(hunger)} icon="🍗" activeClass="" />
      </div>
      {isDead && (
        <div className="absolute inset-0 bg-red-900/60 flex flex-col items-center justify-center gap-6">
          <p className="text-white text-5xl font-bold" style={{ textShadow: '2px 2px 0 #500' }}>
            YOU DIED
          </p>
          <button
            onClick={() => usePlayerStore.getState().respawn(DEFAULT_SPAWN_POSITION)}
            className="px-6 py-2 bg-[#8b8b8b] text-white border-2 border-t-white border-l-white border-b-[#373737] border-r-[#373737] hover:bg-[#9b9b9b]"
          >
            リスポーン
          </button>
        </div>
      )}
    </>
  )
}
