import { fontStack } from './constants.js'

export function fontString(el) {
  return `${el.italic ? 'italic ' : ''}${el.fontWeight} ${el.fontSize}px ${fontStack(el.fontFamily)}`
}

export function lineWidth(ctx, line, spacing) {
  if (spacing === 0) return ctx.measureText(line).width
  return [...line].reduce((sum, ch) => sum + ctx.measureText(ch).width + spacing, 0)
}

// Splits one paragraph into lines no wider than max. Over-long words are broken.
export function breakParagraph(para, max, measure) {
  const out = []
  let line = ''
  para.split(' ').forEach((word) => {
    const candidate = line === '' ? word : line + ' ' + word
    if (measure(candidate) <= max) {
      line = candidate
      return
    }
    if (line !== '') {
      out.push(line)
      line = ''
    }
    let rest = word
    while (rest.length > 1 && measure(rest) > max) {
      let n = rest.length - 1
      while (n > 1 && measure(rest.slice(0, n)) > max) n--
      out.push(rest.slice(0, n))
      rest = rest.slice(n)
    }
    line = rest
  })
  out.push(line)
  return out
}

// The one place that decides where lines break. The screen and the export both use it,
// so they always agree. measure(text) returns the width of a string in poster pixels.
export function layoutText(el, measure) {
  const text = el.uppercase ? el.text.toUpperCase() : el.text
  const paragraphs = text.split('\n')
  const lines = []
  paragraphs.forEach((para, p) => {
    const pieces = el.boxWidth ? breakParagraph(para, el.boxWidth, measure) : [para]
    pieces.forEach((piece, i) => {
      const last = i === pieces.length - 1
      lines.push({
        text: piece,
        paraEnd: last && p < paragraphs.length - 1,
        justify: Boolean(el.boxWidth) && el.align === 'justify' && !last && piece.includes(' '),
      })
    })
  })
  return lines
}

// Where each line starts (top) and the total height, with extra space after paragraphs
export function lineTops(lines, lineHeight, gap) {
  let y = 0
  const tops = lines.map((line) => {
    const top = y
    y += lineHeight + (line.paraEnd ? gap : 0)
    return top
  })
  return { tops, height: y }
}

let shared = null

// A measuring function for the screen, using an off-screen canvas
export function textMeasurer(el) {
  if (!shared) shared = document.createElement('canvas').getContext('2d')
  const font = fontString(el)
  const spacing = el.fontSize * el.letterSpacing
  return (s) => {
    shared.font = font
    return lineWidth(shared, s, spacing)
  }
}
