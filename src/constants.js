export const HIGHLIGHT = '#ffe94a'
export const MARGIN = 40

export const FORMATS = [
  { name: 'Portrait', width: 600, height: 800 },
  { name: 'Square', width: 600, height: 600 },
  { name: 'Story', width: 450, height: 800 },
  { name: 'Landscape', width: 800, height: 600 },
]

export const DEFAULT_POSTER = { width: 600, height: 800, background: '#ffffff' }

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
