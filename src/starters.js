let counter = 0

export function newId() {
  counter += 1
  return 't' + Date.now().toString(36) + counter
}

export function makeText(props = {}) {
  return {
    id: newId(),
    text: 'New text',
    x: 60,
    y: 80,
    fontFamily: 'Playfair Display',
    fontSize: 48,
    fontWeight: 700,
    color: '#000000',
    align: 'left',
    rotation: 0,
    letterSpacing: 0,
    lineHeight: 1.1,
    highlight: false,
    ...props,
  }
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
]

export function buildElements(starterId) {
  const starter = STARTERS.find((s) => s.id === starterId) || STARTERS[0]
  return starter.elements.map((el) => makeText(el))
}
