import { DEFAULT_POSTER, FONTS } from './constants.js'

let counter = 0

export function newId() {
  counter += 1
  return 't' + Date.now().toString(36) + counter
}

const num = (v, fallback, min, max) => (Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback)

export function cleanColor(v, fallback) {
  return typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : fallback
}

// Both makers fill in defaults and tidy up anything odd, so saved or imported files can't break the editor.
export function makeText(props = {}) {
  const t = { text: 'New text', fontFamily: 'Playfair Display', ...props }
  return {
    id: typeof t.id === 'string' && t.id ? t.id : newId(),
    text: String(t.text).slice(0, 2000),
    x: num(t.x, 60, -5000, 5000),
    y: num(t.y, 80, -5000, 5000),
    fontFamily: FONTS.some((f) => f.name === t.fontFamily) ? t.fontFamily : 'Playfair Display',
    fontSize: num(t.fontSize, 48, 4, 600),
    fontWeight: [400, 700, 900].includes(t.fontWeight) ? t.fontWeight : 700,
    color: cleanColor(t.color, '#000000'),
    align: ['left', 'center', 'right'].includes(t.align) ? t.align : 'left',
    rotation: num(t.rotation, 0, -360, 360),
    letterSpacing: num(t.letterSpacing, 0, -1, 2),
    lineHeight: num(t.lineHeight, 1.1, 0.5, 4),
    italic: t.italic === true,
    uppercase: t.uppercase === true,
    hidden: t.hidden === true,
    highlight: t.highlight === true,
  }
}

export function makeShape(props = {}) {
  const t = props
  return {
    id: typeof t.id === 'string' && t.id ? t.id : newId(),
    type: 'shape',
    kind: t.kind === 'rule' ? 'rule' : 'block',
    x: num(t.x, 60, -5000, 5000),
    y: num(t.y, 120, -5000, 5000),
    width: num(t.width, 160, 1, 4000),
    height: num(t.height, 160, 1, 4000),
    color: cleanColor(t.color, '#000000'),
    rotation: num(t.rotation, 0, -360, 360),
    hidden: t.hidden === true,
  }
}

// Only images this app made itself are accepted (PNG or JPEG data), so a bad file can't smuggle anything in.
export function makeImage(props = {}) {
  const t = props
  const ok = typeof t.src === 'string' && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(t.src) && t.src.length < 8000000
  if (!ok) return null
  return {
    id: typeof t.id === 'string' && t.id ? t.id : newId(),
    type: 'image',
    src: t.src,
    x: num(t.x, 60, -5000, 5000),
    y: num(t.y, 80, -5000, 5000),
    width: num(t.width, 200, 10, 4000),
    height: num(t.height, 200, 10, 4000),
    rotation: num(t.rotation, 0, -360, 360),
    opacity: num(t.opacity, 1, 0.05, 1),
    hidden: t.hidden === true,
  }
}

export function makeItem(props = {}) {
  if (props.type === 'shape') return makeShape(props)
  if (props.type === 'image') return makeImage(props)
  return makeText(props)
}

export const STARTERS = [
  { id: 'blank', name: 'Blank canvas', elements: [] },
  {
    id: 'quiet-hours',
    name: 'Quiet Hours',
    elements: [
      { text: 'Issue 12', x: 52, y: 28, fontFamily: 'Archivo', fontSize: 14, fontWeight: 700, highlight: true },
      { text: 'Quiet\nHours', x: 48, y: 56, fontSize: 150 },
      {
        text: 'an essay on staying in,\nand the long evenings\nthat follow',
        x: 52,
        y: 420,
        fontFamily: 'Libre Baskerville',
        fontSize: 20,
        fontWeight: 400,
      },
      { text: 'Autumn 2026', x: 520, y: 380, fontFamily: 'Space Mono', fontSize: 14, fontWeight: 400, rotation: -90 },
      { text: 'slow', x: 44, y: 560, fontSize: 220, fontWeight: 400 },
      { text: 'Printed in a small run', x: 330, y: 29, fontFamily: 'Space Mono', fontSize: 11, fontWeight: 400 },
      { type: 'shape', kind: 'rule', x: 52, y: 404, width: 56, height: 3 },
    ],
  },
  {
    id: 'issue-04',
    name: 'Issue 04',
    elements: [
      { text: '&', x: 380, y: 400, fontSize: 300, fontWeight: 400, color: '#b5b5b5', rotation: 12 },
      { text: 'ISSUE\n04', x: 30, y: 20, fontFamily: 'Anton', fontSize: 240, fontWeight: 400 },
      {
        text: 'notes on\nthings we\nalmost threw away',
        x: 40,
        y: 590,
        fontFamily: 'Archivo',
        fontSize: 28,
        highlight: true,
      },
      { text: 'free, take one', x: 330, y: 650, fontFamily: 'Space Mono', fontSize: 16, fontWeight: 400, rotation: -8 },
      { text: 'p. 12', x: 520, y: 760, fontFamily: 'Space Mono', fontSize: 12, fontWeight: 400, align: 'right' },
    ],
  },
  {
    id: 'loud-soft',
    name: 'Loud and soft',
    elements: [
      { text: 'LOUD', x: 30, y: 40, fontFamily: 'Archivo', fontSize: 170, fontWeight: 900 },
      { text: 'soft', x: 30, y: 215, fontSize: 170, fontWeight: 400 },
      { text: 'turn it up', x: 300, y: 470, fontFamily: 'Archivo', fontSize: 30, fontWeight: 900, rotation: -4, highlight: true },
      { text: 'turn it down', x: 292, y: 530, fontFamily: 'Libre Baskerville', fontSize: 26, fontWeight: 400, rotation: 3 },
      { text: 'a poster about volume', x: 36, y: 730, fontFamily: 'Space Mono', fontSize: 14, fontWeight: 400 },
    ],
  },
  {
    id: 'night-shift',
    name: 'Night shift',
    poster: { background: '#000000' },
    elements: [
      { text: 'Night\nShift', x: 36, y: 40, fontFamily: 'Anton', fontSize: 220, fontWeight: 400, color: '#ffffff', uppercase: true },
      { text: 'the city after twelve', x: 44, y: 560, fontFamily: 'Libre Baskerville', fontSize: 22, fontWeight: 400, color: '#ffffff', italic: true },
      { text: 'open all night', x: 44, y: 640, fontFamily: 'Space Mono', fontSize: 14, fontWeight: 700, uppercase: true, highlight: true },
      { text: 'after\ndark', x: 340, y: 600, fontSize: 80, fontWeight: 400, color: '#ffe94a', italic: true },
      { text: 'No. 07', x: 44, y: 750, fontFamily: 'Space Mono', fontSize: 12, fontWeight: 400, color: '#8a8a8a' },
    ],
  },
  {
    id: 'reading-list',
    name: 'Reading list',
    poster: { width: 800, height: 600 },
    elements: [
      { text: 'Reading\nlist', x: 44, y: 36, fontSize: 110 },
      { text: 'Autumn, in no particular order', x: 48, y: 330, fontFamily: 'Space Mono', fontSize: 13, fontWeight: 400 },
      {
        text: "1. Giovanni's Room\n2. The Garden of Forking Paths\n3. Bluets\n4. A Field Guide to Getting Lost\n5. Nox",
        x: 500,
        y: 70,
        fontFamily: 'Libre Baskerville',
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 1.9,
      },
      { text: 'Read slowly', x: 48, y: 520, fontFamily: 'Archivo', fontSize: 16, fontWeight: 700, highlight: true },
      { text: 'p. 3', x: 730, y: 540, fontFamily: 'Space Mono', fontSize: 12, fontWeight: 400 },
      { type: 'shape', kind: 'rule', x: 500, y: 52, width: 250, height: 2 },
    ],
  },
]

// A short name for an item, used in the layers list and for screen readers
export function describe(el) {
  if (el.type === 'image') return 'Image'
  if (el.type === 'shape') return el.kind === 'rule' ? 'Rule' : 'Block'
  return el.text.split('\n')[0].trim() || 'Empty text'
}

export function buildElements(starterId) {
  const starter = STARTERS.find((s) => s.id === starterId) || STARTERS[0]
  return starter.elements.map((el) => makeItem(el))
}

export function buildPoster(starterId) {
  const starter = STARTERS.find((s) => s.id === starterId) || STARTERS[0]
  return { ...DEFAULT_POSTER, ...starter.poster }
}
