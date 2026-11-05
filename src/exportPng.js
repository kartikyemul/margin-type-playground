import { HIGHLIGHT } from './constants.js'
import { fontString, layoutText, lineTops, lineWidth } from './layout.js'
import { downloadBlob } from './download.js'

export async function exportPng(elements, poster) {
  const scale = poster.exportScale || 3
  const type = poster.exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png'
  const visible = elements.filter((el) => !el.hidden)

  const canvas = document.createElement('canvas')
  canvas.width = poster.width * scale
  canvas.height = poster.height * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)
  if (!poster.transparent || type === 'image/jpeg') {
    ctx.fillStyle = poster.background
    ctx.fillRect(0, 0, poster.width, poster.height)
  }

  try {
    await Promise.all(
      visible
        .filter((el) => el.type !== 'shape')
        .map((el) => document.fonts.load(fontString(el), el.text))
    )
  } catch (e) {
    // fall back to whatever fonts are available
  }

  const pictures = {}
  await Promise.all(
    visible
      .filter((el) => el.type === 'image')
      .map(
        (el) =>
          new Promise((resolve) => {
            const img = new Image()
            img.onload = () => {
              pictures[el.id] = img
              resolve()
            }
            img.onerror = resolve
            img.src = el.src
          })
      )
  )

  visible.forEach((el) => {
    if (el.type === 'shape') drawShape(ctx, el)
    else if (el.type === 'image') drawPicture(ctx, el, pictures[el.id])
    else drawText(ctx, el)
  })

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.92))
  downloadBlob(blob, type === 'image/jpeg' ? 'margin-poster.jpg' : 'margin-poster.png')
}

function drawPicture(ctx, el, img) {
  if (!img) return
  ctx.save()
  ctx.translate(el.x + el.width / 2, el.y + el.height / 2)
  ctx.rotate((el.rotation * Math.PI) / 180)
  ctx.globalAlpha = el.opacity
  ctx.drawImage(img, -el.width / 2, -el.height / 2, el.width, el.height)
  ctx.restore()
}

function drawShape(ctx, el) {
  ctx.save()
  ctx.translate(el.x + el.width / 2, el.y + el.height / 2)
  ctx.rotate((el.rotation * Math.PI) / 180)
  ctx.fillStyle = el.color
  ctx.fillRect(-el.width / 2, -el.height / 2, el.width, el.height)
  ctx.restore()
}

function drawLine(ctx, text, x, y, spacing) {
  if (spacing === 0) {
    ctx.fillText(text, x, y)
    return
  }
  let cursor = x
  for (const ch of text) {
    ctx.fillText(ch, cursor, y)
    cursor += ctx.measureText(ch).width + spacing
  }
}

function drawText(ctx, el) {
  const spacing = el.fontSize * el.letterSpacing
  ctx.font = fontString(el)
  ctx.textBaseline = 'alphabetic'

  const measure = (s) => lineWidth(ctx, s, spacing)
  const lines = layoutText(el, measure)
  const lineHeight = el.fontSize * el.lineHeight
  const { tops, height } = lineTops(lines, lineHeight, el.paragraphSpacing * el.fontSize)
  const widths = lines.map((line) => measure(line.text))
  const blockWidth = el.boxWidth || Math.max(...widths, 1)

  const metrics = ctx.measureText('Hg')
  const ascent = metrics.fontBoundingBoxAscent ?? el.fontSize * 0.8
  const descent = metrics.fontBoundingBoxDescent ?? el.fontSize * 0.2
  const baseline = (lineHeight - (ascent + descent)) / 2 + ascent

  ctx.save()
  ctx.translate(el.x + blockWidth / 2, el.y + height / 2)
  ctx.rotate((el.rotation * Math.PI) / 180)
  ctx.translate(-blockWidth / 2, -height / 2)

  lines.forEach((line, i) => {
    const top = tops[i]

    if (line.justify) {
      // spread the words so the line reaches both edges of the box
      const words = line.text.split(' ')
      const wordWidths = words.map(measure)
      const gap = (blockWidth - wordWidths.reduce((a, b) => a + b, 0)) / (words.length - 1)
      if (el.highlight) {
        ctx.fillStyle = HIGHLIGHT
        ctx.fillRect(0, top, blockWidth, lineHeight)
      }
      ctx.fillStyle = el.color
      let cursor = 0
      words.forEach((word, k) => {
        drawLine(ctx, word, cursor, top + baseline, spacing)
        cursor += wordWidths[k] + gap
      })
      return
    }

    let left = 0
    if (el.align === 'center') left = (blockWidth - widths[i]) / 2
    if (el.align === 'right') left = blockWidth - widths[i]
    if (el.highlight && widths[i] > 0) {
      ctx.fillStyle = HIGHLIGHT
      ctx.fillRect(left, top, widths[i], lineHeight)
    }
    ctx.fillStyle = el.color
    drawLine(ctx, line.text, left, top + baseline, spacing)
  })

  ctx.restore()
}
