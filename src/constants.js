export const CANVAS_W = 600
export const CANVAS_H = 800
export const LINE_HEIGHT = 1.1
export const HIGHLIGHT = '#ffe94a'

export const FONTS = [
  { name: 'Playfair Display', fallback: 'serif' },
  { name: 'Libre Baskerville', fallback: 'serif' },
  { name: 'Archivo', fallback: 'sans-serif' },
  { name: 'Anton', fallback: 'sans-serif' },
  { name: 'Space Mono', fallback: 'monospace' },
]

export function fontStack(name) {
  const font = FONTS.find((f) => f.name === name)
  return `"${name}", ${font ? font.fallback : 'sans-serif'}`
}
