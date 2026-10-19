import { HIGHLIGHT, fontStack } from './constants.js'
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
        .map((el) => document.fonts.load(`${fontStyle(el)} ${el.fontSize}px ${fontStack(el.fontFamily)}`, el.text))
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

function fontStyle(el) {
  return `${el.italic ? 'italic ' : ''}${el.fontWeight}`
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

function lineWidth(ctx, line, spacing) {
  if (spacing === 0) return ctx.measureText(line).width
  return [...line].reduce((sum, ch) => sum + ctx.measureText(ch).width + spacing, 0)
}

function drawLine(ctx, line, x, y, spacing) {
  if (spacing === 0) {
    ctx.fillText(line, x, y)
    return
  }
  let cursor = x
  for (const ch of line) {
    ctx.fillText(ch, cursor, y)
    cursor += ctx.measureText(ch).width + spacing
  }
}

function drawText(ctx, el) {
  const lines = (el.uppercase ? el.text.toUpperCase() : el.text).split('\n')
  const lineHeight = el.fontSize * el.lineHeight
  const spacing = el.fontSize * el.letterSpacing

  ctx.font = `${fontStyle(el)} ${el.fontSize}px ${fontStack(el.fontFamily)}`
  ctx.textBaseline = 'alphabetic'

  const widths = lines.map((line) => lineWidth(ctx, line, spacing))
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
    drawLine(ctx, line, left, top + baseline, spacing)
  })

  ctx.restore()
}
