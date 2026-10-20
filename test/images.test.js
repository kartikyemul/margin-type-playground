import { test } from 'node:test'
import assert from 'node:assert/strict'
import { IMAGE_BUDGET, hasRoomFor, imagesSize } from '../src/images.js'

const image = (length) => ({ type: 'image', src: 'x'.repeat(length) })

test('imagesSize adds up pictures only', () => {
  assert.equal(imagesSize([image(100), { type: 'shape' }, { text: 'hi' }, image(50)]), 150)
  assert.equal(imagesSize([]), 0)
})

test('hasRoomFor stops pictures once the poster budget is used up', () => {
  assert.equal(hasRoomFor([], 'x'.repeat(1000)), true)
  assert.equal(hasRoomFor([image(IMAGE_BUDGET - 10)], 'x'.repeat(10)), true)
  assert.equal(hasRoomFor([image(IMAGE_BUDGET - 10)], 'x'.repeat(11)), false)
})
