export const MAX_VERSIONS = 10
export const VERSION_BUDGET = 3500000

const sameDoc = (a, b) => JSON.stringify([a.elements, a.poster]) === JSON.stringify([b.elements, b.poster])

// Puts a snapshot at the front of the list, unless nothing changed. Old ones fall off
// the end when there are too many or they take up too much room.
export function addVersion(list, entry, now = Date.now()) {
  if (list[0] && sameDoc(list[0], entry)) return list
  const next = [{ ...entry, savedAt: entry.savedAt ?? now }, ...list].slice(0, MAX_VERSIONS)
  while (next.length > 1 && JSON.stringify(next).length > VERSION_BUDGET) next.pop()
  return next
}

export function dueForSnapshot(list, gapMs, now = Date.now()) {
  return list.length === 0 || now - list[0].savedAt >= gapMs
}

export function timeLabel(ts, now = Date.now()) {
  const minutes = Math.floor((now - ts) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return minutes + ' min ago'
  if (minutes < 1440) return Math.floor(minutes / 60) + ' h ago'
  return new Date(ts).toLocaleDateString()
}
