import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanDoc, cleanPoster, keepPrefs } from '../src/doc.js'
import { DEFAULT_POSTER } from '../src/constants.js'
import { STARTERS, buildElements, buildPoster, makeText, makeShape, makeItem, describe } from '../src/starters.js'

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

test('cleanPoster fixes bad sizes, colors and settings', () => {
  const poster = cleanPoster({ width: 5, height: 'x', background: 'red;}', exportScale: 9, gridSize: 7, transparent: 'yes' })
  assert.equal(poster.width, DEFAULT_POSTER.width)
  assert.equal(poster.height, DEFAULT_POSTER.height)
  assert.equal(poster.background, '#ffffff')
  assert.equal(poster.exportScale, 3)
  assert.equal(poster.gridSize, 20)
  assert.equal(poster.transparent, false)
})

test('cleanPoster keeps good values', () => {
  const poster = cleanPoster({ width: 800, height: 600, background: '#FFE94A', exportScale: 2, exportFormat: 'jpeg' })
  assert.equal(poster.width, 800)
  assert.equal(poster.background, '#ffe94a')
  assert.equal(poster.exportScale, 2)
  assert.equal(poster.exportFormat, 'jpeg')
})

test('cleanDoc rejects things that are not posters', () => {
  assert.equal(cleanDoc(null), null)
  assert.equal(cleanDoc({}), null)
  assert.equal(cleanDoc({ elements: 'nope' }), null)
})

test('cleanDoc tidies messy text items and drops junk', () => {
  const doc = cleanDoc({
    elements: [
      { text: 'hi', x: 'abc', fontSize: 'huge', color: 'url(javascript:1)', fontFamily: 'Comic Sans', id: 'same' },
      { text: 'again', id: 'same' },
      null,
      { nothing: true },
    ],
  })
  assert.equal(doc.elements.length, 2)
  const [first] = doc.elements
  assert.equal(first.x, 60)
  assert.equal(first.fontSize, 48)
  assert.equal(first.color, '#000000')
  assert.equal(first.fontFamily, 'Playfair Display')
})

test('cleanDoc caps absurd numbers and text length', () => {
  const [shape, text] = cleanDoc({
    elements: [
      { type: 'shape', width: 99999999, x: -99999 },
      { text: 'a'.repeat(5000), fontSize: 99999 },
    ],
  }).elements
  assert.equal(shape.width, 4000)
  assert.equal(shape.x, -5000)
  assert.equal(text.text.length, 2000)
  assert.equal(text.fontSize, 600)
})

test('cleanDoc keeps real images and drops anything else posing as one', () => {
  const doc = cleanDoc({
    elements: [
      { type: 'image', src: TINY_PNG, width: 100, height: 50, opacity: 5 },
      { type: 'image', src: 'https://example.com/x.png' },
      { type: 'image', src: 'data:text/html;base64,PGgxPg==' },
      { type: 'image', src: 'javascript:alert(1)' },
    ],
  })
  assert.equal(doc.elements.length, 1)
  assert.equal(doc.elements[0].type, 'image')
  assert.equal(doc.elements[0].opacity, 1)
})

test('old saved items without newer fields still load', () => {
  const [el] = cleanDoc({ elements: [{ id: 'a', text: 'Old', x: 50, y: 50, fontFamily: 'Archivo', fontSize: 60, fontWeight: 700 }] }).elements
  assert.equal(el.letterSpacing, 0)
  assert.equal(el.lineHeight, 1.1)
  assert.equal(el.italic, false)
  assert.equal(el.hidden, false)
})

test('keepPrefs carries personal settings onto a new poster', () => {
  const next = keepPrefs({ ...DEFAULT_POSTER, background: '#000000' }, { ...DEFAULT_POSTER, snapGrid: true, exportScale: 1 })
  assert.equal(next.background, '#000000')
  assert.equal(next.snapGrid, true)
  assert.equal(next.exportScale, 1)
})

test('every starter builds clean items with unique ids', () => {
  STARTERS.forEach((starter) => {
    const items = buildElements(starter.id)
    assert.equal(new Set(items.map((el) => el.id)).size, items.length, starter.name)
    const poster = buildPoster(starter.id)
    items.forEach((el) => {
      assert.ok(el, starter.name)
      assert.ok(el.x >= 0 && el.x < poster.width, starter.name + ' x')
      assert.ok(el.y >= 0 && el.y < poster.height, starter.name + ' y')
    })
  })
})

test('describe gives each item a readable name', () => {
  assert.equal(describe(makeText({ text: 'Quiet\nHours' })), 'Quiet')
  assert.equal(describe(makeText({ text: '   ' })), 'Empty text')
  assert.equal(describe(makeShape({ kind: 'rule' })), 'Rule')
  assert.equal(describe(makeShape({ kind: 'block' })), 'Block')
  assert.equal(describe(makeItem({ type: 'image', src: TINY_PNG })), 'Image')
})
