import { test } from 'node:test'
import assert from 'node:assert/strict'
import { snapAxis, snapToGrid, normalizeAngle, fitRect, scaleBox, rectsOverlap } from '../src/geometry.js'

test('snapAxis locks onto the margin, centre and far margin when close', () => {
  assert.deepEqual(snapAxis(43, 100, 600, 6), { pos: 40, guide: 40 })
  assert.deepEqual(snapAxis(247, 100, 600, 6), { pos: 250, guide: 300 })
  assert.deepEqual(snapAxis(458, 100, 600, 6), { pos: 460, guide: 560 })
})

test('snapAxis leaves the position alone when nothing is close', () => {
  assert.deepEqual(snapAxis(120, 60, 600, 6), { pos: 120, guide: null })
})

test('snapToGrid rounds to the nearest line, or does nothing when the grid is off', () => {
  assert.equal(snapToGrid(47, 20), 40)
  assert.equal(snapToGrid(51, 20), 60)
  assert.equal(snapToGrid(47, 0), 47)
})

test('normalizeAngle keeps angles between -180 and 179', () => {
  assert.equal(normalizeAngle(0), 0)
  assert.equal(normalizeAngle(190), -170)
  assert.equal(normalizeAngle(-190), 170)
  assert.equal(normalizeAngle(360), 0)
})

test('fitRect fits inside or covers the box and stays centred', () => {
  assert.deepEqual(fitRect(800, 400, 600, 800, 'fit'), { width: 600, height: 300, x: 0, y: 250 })
  assert.deepEqual(fitRect(800, 400, 600, 800, 'fill'), { width: 1600, height: 800, x: -500, y: 0 })
})

test('scaleBox scales around the centre and respects the limits', () => {
  assert.deepEqual(scaleBox({ x: 100, y: 100, width: 200, height: 100 }, 2, 10, 4000), { width: 400, height: 200, x: 0, y: 50 })
  assert.equal(scaleBox({ x: 0, y: 0, width: 200, height: 100 }, 0.001, 20, 4000).height, 20)
  assert.equal(scaleBox({ x: 0, y: 0, width: 3000, height: 1000 }, 5, 20, 4000).width, 4000)
})

test('rectsOverlap detects overlapping and separate boxes', () => {
  const a = { left: 0, top: 0, right: 100, bottom: 100 }
  assert.equal(rectsOverlap(a, { left: 50, top: 50, right: 150, bottom: 150 }), true)
  assert.equal(rectsOverlap(a, { left: 100, top: 0, right: 200, bottom: 100 }), false)
})
