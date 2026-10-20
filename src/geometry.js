import { MARGIN } from './constants.js'

// Snap one axis: the item's start, middle or end can lock onto the margin or the centre.
export function snapAxis(pos, size, total, threshold) {
  const options = [
    { at: pos, goal: MARGIN },
    { at: pos + size / 2, goal: total / 2 },
    { at: pos + size, goal: total - MARGIN },
  ]
  let best = null
  options.forEach((o) => {
    const diff = o.goal - o.at
    if (Math.abs(diff) <= threshold && (!best || Math.abs(diff) < Math.abs(best.diff))) {
      best = { diff, goal: o.goal }
    }
  })
  return best ? { pos: pos + best.diff, guide: best.goal } : { pos, guide: null }
}

export function snapToGrid(value, grid) {
  return grid ? Math.round(value / grid) * grid : value
}

// Keeps an angle between -180 and 179
export function normalizeAngle(deg) {
  return ((((deg + 180) % 360) + 360) % 360) - 180
}

// Size a picture to sit inside ("fit") or cover ("fill") a box, centred in it
export function fitRect(width, height, boxWidth, boxHeight, mode) {
  const pick = mode === 'fill' ? Math.max : Math.min
  const ratio = pick(boxWidth / width, boxHeight / height)
  const w = Math.round(width * ratio)
  const h = Math.round(height * ratio)
  return { width: w, height: h, x: Math.round((boxWidth - w) / 2), y: Math.round((boxHeight - h) / 2) }
}

// Grow or shrink a box around its centre, keeping its proportions within the limits
export function scaleBox(box, factor, min, max) {
  let ratio = factor
  if (Math.max(box.width, box.height) * ratio > max) ratio = max / Math.max(box.width, box.height)
  if (Math.min(box.width, box.height) * ratio < min) ratio = min / Math.min(box.width, box.height)
  const width = Math.round(box.width * ratio)
  const height = Math.round(box.height * ratio)
  return {
    width,
    height,
    x: Math.round(box.x + (box.width - width) / 2),
    y: Math.round(box.y + (box.height - height) / 2),
  }
}

export function rectsOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}
