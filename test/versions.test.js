import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MAX_VERSIONS, addVersion, dueForSnapshot, timeLabel } from '../src/versions.js'

const doc = (n) => ({ elements: [{ id: 'a', text: 'v' + n }], poster: { width: 600 } })

test('addVersion puts the newest first and skips unchanged posters', () => {
  let list = addVersion([], doc(1), 1000)
  list = addVersion(list, doc(2), 2000)
  assert.equal(list.length, 2)
  assert.equal(list[0].elements[0].text, 'v2')
  assert.equal(addVersion(list, doc(2), 3000), list)
})

test('addVersion keeps only the most recent versions', () => {
  let list = []
  for (let i = 0; i < MAX_VERSIONS + 5; i++) list = addVersion(list, doc(i), i)
  assert.equal(list.length, MAX_VERSIONS)
  assert.equal(list[0].elements[0].text, 'v' + (MAX_VERSIONS + 4))
})

test('addVersion drops old versions when they get too big, but keeps the newest', () => {
  const big = (n) => ({ elements: [{ id: 'a', text: 'x'.repeat(2000000) + n }], poster: {} })
  let list = addVersion([], big(1), 1)
  list = addVersion(list, big(2), 2)
  assert.equal(list.length, 1)
  assert.ok(list[0].elements[0].text.endsWith('2'))
})

test('dueForSnapshot waits for the gap to pass', () => {
  assert.equal(dueForSnapshot([], 1000, 5), true)
  assert.equal(dueForSnapshot([{ savedAt: 1000 }], 500, 1200), false)
  assert.equal(dueForSnapshot([{ savedAt: 1000 }], 500, 1600), true)
})

test('timeLabel describes how long ago something was', () => {
  const now = 10 * 3600000
  assert.equal(timeLabel(now - 10000, now), 'Just now')
  assert.equal(timeLabel(now - 5 * 60000, now), '5 min ago')
  assert.equal(timeLabel(now - 3 * 3600000, now), '3 h ago')
})
