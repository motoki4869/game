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
