export const DAY_LENGTH_SECONDS = 600

export function advanceTime(currentTime, elapsedSeconds) {
  return (currentTime + elapsedSeconds) % DAY_LENGTH_SECONDS
}

export function isNight(currentTime) {
  return currentTime >= DAY_LENGTH_SECONDS * 0.6
}

export function lightIntensityFor(currentTime) {
  // time 0 = midnight (min light), time DAY_LENGTH_SECONDS/2 = midday (max light)
  const angle = (currentTime / DAY_LENGTH_SECONDS) * Math.PI * 2
  const wave = (1 - Math.cos(angle)) / 2 // 0 at t=0, 1 at t=half
  const min = 0.15
  const max = 1
  return min + wave * (max - min)
}
