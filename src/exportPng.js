import { CANVAS_W, CANVAS_H, LINE_HEIGHT, HIGHLIGHT, fontStack } from './constants.js'

const SCALE = 3

export async function exportPng(elements) {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_W * SCALE
  canvas.height = CANVAS_H * SCALE
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  try {
    await Promise.all(
      elements.map((el) =>
        document.fonts.load(`${el.fontWeight} ${el.fontSize}px ${fontStack(el.fontFamily)}`, el.text)
      )
    )
  } catch (e) {
    // fall back to whatever fonts are available
  }

  elements.forEach((el) => drawText(ctx, el))

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'margin-poster.png'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function drawText(ctx, el) {
  const lines = el.text.split('\n')
  const lineHeight = el.fontSize * LINE_HEIGHT

  ctx.font = `${el.fontWeight} ${el.fontSize}px ${fontStack(el.fontFamily)}`
  ctx.textBaseline = 'alphabetic'

  const widths = lines.map((line) => ctx.measureText(line).width)
  const blockWidth = Math.max(...widths, 1)
  const blockHeight = lineHeight * lines.length

  const metrics = ctx.measureText('Hg')
  const ascent = metrics.fontBoundingBoxAscent ?? el.fontSize * 0.8
  const descent = metrics.fontBoundingBoxDescent ?? el.fontSize * 0.2
  const baseline = (lineHeight - (ascent + descent)) / 2 + ascent

  ctx.save()
  ctx.translate(el.x + blockWidth / 2, el.y + blockHeight / 2)
  ctx.rotate((el.rotation * Math.PI) / 180)
  ctx.translate(-blockWidth / 2, -blockHeight / 2)

  lines.forEach((line, i) => {
    let left = 0
    if (el.align === 'center') left = (blockWidth - widths[i]) / 2
    if (el.align === 'right') left = blockWidth - widths[i]
    const top = i * lineHeight

    if (el.highlight && widths[i] > 0) {
      ctx.fillStyle = HIGHLIGHT
      ctx.fillRect(left, top, widths[i], lineHeight)
    }
    ctx.fillStyle = el.color
    ctx.fillText(line, left, top + baseline)
  })

  ctx.restore()
}
