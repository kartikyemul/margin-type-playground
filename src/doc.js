import { DEFAULT_POSTER } from './constants.js'
import { STARTERS, cleanColor, makeItem } from './starters.js'

// settings that belong to you rather than to a particular poster
export const PREF_KEYS = ['showGrid', 'snapGrid', 'gridSize', 'exportScale', 'exportFormat', 'transparent']

export function keepPrefs(newPoster, oldPoster) {
  const prefs = {}
  PREF_KEYS.forEach((key) => {
    prefs[key] = oldPoster[key]
  })
  return { ...newPoster, ...prefs }
}

export function cleanPoster(saved) {
  const poster = { ...DEFAULT_POSTER, ...saved }
  const sizeOk = (n) => Number.isFinite(n) && n >= 200 && n <= 2000
  if (!sizeOk(poster.width) || !sizeOk(poster.height)) {
    poster.width = DEFAULT_POSTER.width
    poster.height = DEFAULT_POSTER.height
  }
  poster.background = cleanColor(poster.background, DEFAULT_POSTER.background)
  poster.showGrid = poster.showGrid === true
  poster.snapGrid = poster.snapGrid === true
  if (![10, 20, 40].includes(poster.gridSize)) poster.gridSize = DEFAULT_POSTER.gridSize
  if (![1, 2, 3].includes(poster.exportScale)) poster.exportScale = DEFAULT_POSTER.exportScale
  if (!['png', 'jpeg'].includes(poster.exportFormat)) poster.exportFormat = DEFAULT_POSTER.exportFormat
  poster.transparent = poster.transparent === true
  return poster
}

// Turns whatever came out of storage into a safe poster, or null if it isn't one
export function cleanDoc(data) {
  if (!data || !Array.isArray(data.elements)) return null
  return {
    poster: cleanPoster(data.poster),
    starterId: STARTERS.some((s) => s.id === data.starterId) ? data.starterId : 'quiet-hours',
    elements: data.elements
      .filter((el) => el && (el.type === 'shape' || el.type === 'image' || typeof el.text === 'string'))
      .map((el) => makeItem(el))
      .filter(Boolean),
  }
}
