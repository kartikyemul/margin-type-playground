// How much picture data one poster may hold (counted in characters of stored text),
// so saving doesn't run into the browser's storage limit.
export const IMAGE_BUDGET = 3000000

export function imagesSize(elements) {
  return elements.reduce((sum, el) => (el.type === 'image' ? sum + el.src.length : sum), 0)
}

export function hasRoomFor(elements, src) {
  return imagesSize(elements) + src.length <= IMAGE_BUDGET
}

const MAX_SIDE = { 'image/jpeg': 1800, 'image/png': 1400 }
const TYPES = ['image/png', 'image/jpeg', 'image/webp']

// Reads a picture file and shrinks it so a few of them fit in the browser's storage.
export async function readImage(file) {
  if (!TYPES.includes(file.type)) throw new Error('type')
  if (file.size > 20000000) throw new Error('size')

  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('read'))
      el.src = url
    })

    const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png'
    const ratio = Math.min(1, MAX_SIDE[type] / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio))
    canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio))
    const ctx = canvas.getContext('2d')
    if (type === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    return { src: canvas.toDataURL(type, 0.85), width: img.naturalWidth, height: img.naturalHeight }
  } finally {
    URL.revokeObjectURL(url)
  }
}
