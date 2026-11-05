import { test } from 'node:test'
import assert from 'node:assert/strict'
import { breakParagraph, layoutText, lineTops } from '../src/layout.js'

const measure = (s) => s.length * 10 // every character is 10 wide

test('breakParagraph wraps at spaces', () => {
  assert.deepEqual(breakParagraph('the quick brown fox', 100, measure), ['the quick', 'brown fox'])
})

test('breakParagraph breaks words that are too long for the box', () => {
  assert.deepEqual(breakParagraph('abcdefgh', 30, measure), ['abc', 'def', 'gh'])
})

test('breakParagraph keeps an empty paragraph as one empty line', () => {
  assert.deepEqual(breakParagraph('', 100, measure), [''])
})

test('layoutText without a box width only splits on new lines', () => {
  const lines = layoutText({ text: 'one two\nthree', boxWidth: 0, align: 'left' }, measure)
  assert.deepEqual(lines.map((l) => l.text), ['one two', 'three'])
  assert.deepEqual(lines.map((l) => l.paraEnd), [true, false])
})

test('layoutText wraps inside a box and marks paragraph ends', () => {
  const lines = layoutText({ text: 'aaa bbb ccc\nddd', boxWidth: 70, align: 'left' }, measure)
  assert.deepEqual(lines.map((l) => l.text), ['aaa bbb', 'ccc', 'ddd'])
  assert.deepEqual(lines.map((l) => l.paraEnd), [false, true, false])
})

test('justify applies to every line of a paragraph except its last', () => {
  const lines = layoutText({ text: 'aaa bbb ccc ddd eee', boxWidth: 70, align: 'justify' }, measure)
  assert.deepEqual(lines.map((l) => l.justify), [true, true, false])
})

test('layoutText uppercases before measuring', () => {
  assert.equal(layoutText({ text: 'hi', uppercase: true, boxWidth: 0, align: 'left' }, measure)[0].text, 'HI')
})

test('lineTops adds paragraph spacing only after paragraph ends', () => {
  const lines = [{ paraEnd: false }, { paraEnd: true }, { paraEnd: false }]
  assert.deepEqual(lineTops(lines, 10, 5), { tops: [0, 10, 25], height: 35 })
})
