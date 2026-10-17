import { useEffect, useRef, useState } from 'react'
import { HIGHLIGHT, MARGIN, fontStack } from './constants.js'

// Snap one axis: the element's start, middle or end can lock onto the margin or the centre.
function snapAxis(pos, size, total, threshold) {
  const options = [
    { at: pos, goal: MARGIN },
    { at: pos + size / 2, goal: total / 2 },
    { at: pos + size, goal: total - MARGIN },
  ]
  let best = null
  options.forEach((o) => {
    const diff = o.goal - o.at
    if (Math.abs(diff) <= threshold && (!best || Math.abs(diff) < Math.abs(best.diff))) {
      best = { diff, goal: o.goal }
    }
  })
  return best ? { pos: pos + best.diff, guide: best.goal } : { pos, guide: null }
}

function Canvas({ elements, poster, selectedId, onSelect, onChange, onEdit }) {
  const stageRef = useRef(null)
  const drag = useRef(null)
  const dragCount = useRef(0)
  const [scale, setScale] = useState(0.7)
  const [guides, setGuides] = useState({ x: null, y: null })

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const fit = Math.min((width - 2) / poster.width, (height - 2) / poster.height)
      setScale(Math.max(0.2, Math.min(fit, 1.4)))
    })
    observer.observe(stageRef.current)
    return () => observer.disconnect()
  }, [poster.width, poster.height])

  function startDrag(e, el) {
    e.stopPropagation()
    onSelect(el.id)
    e.currentTarget.setPointerCapture(e.pointerId)
    dragCount.current += 1
    drag.current = {
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      x: el.x,
      y: el.y,
      session: dragCount.current,
      moved: false,
    }
  }

  function moveDrag(e) {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.hypot(dx, dy) < 3) return
    d.moved = true

    let x = d.x + dx / scale
    let y = d.y + dy / scale
    let guideX = null
    let guideY = null

    if (!e.altKey) {
      const threshold = 6 / scale
      const sx = snapAxis(x, e.currentTarget.offsetWidth, poster.width, threshold)
      const sy = snapAxis(y, e.currentTarget.offsetHeight, poster.height, threshold)
      x = sx.pos
      y = sy.pos
      guideX = sx.guide
      guideY = sy.guide
    }
    setGuides({ x: guideX, y: guideY })

    x = Math.max(-300, Math.min(poster.width - 30, x))
    y = Math.max(-200, Math.min(poster.height - 30, y))
    onChange(d.id, { x: Math.round(x), y: Math.round(y) }, 'drag-' + d.session)
  }

  function endDrag() {
    drag.current = null
    setGuides({ x: null, y: null })
  }

  return (
    <div className="stage" ref={stageRef} onPointerDown={() => onSelect(null)}>
      <div className="poster-frame" style={{ width: poster.width * scale + 2, height: poster.height * scale + 2 }}>
        <div
          className="poster"
          style={{
            width: poster.width,
            height: poster.height,
            background: poster.background,
            transform: `scale(${scale})`,
          }}
        >
          {elements
            .filter((el) => !el.hidden)
            .map((el) => (
            <div
              key={el.id}
              className={'text-el' + (el.id === selectedId ? ' selected' : '')}
              style={{
                left: el.x,
                top: el.y,
                fontFamily: fontStack(el.fontFamily),
                fontSize: el.fontSize,
                fontWeight: el.fontWeight,
                fontStyle: el.italic ? 'italic' : 'normal',
                textTransform: el.uppercase ? 'uppercase' : 'none',
                color: el.color,
                textAlign: el.align,
                letterSpacing: el.letterSpacing + 'em',
                '--lh': el.lineHeight,
                transform: `rotate(${el.rotation}deg)`,
              }}
              onPointerDown={(e) => startDrag(e, el)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onDoubleClick={onEdit}
            >
              {el.text.split('\n').map((line, i) => (
                <div className="line" key={i}>
                  <span className="line-text" style={el.highlight ? { background: HIGHLIGHT } : undefined}>
                    {line || '\u200b'}
                  </span>
                </div>
              ))}
            </div>
          ))}
          {guides.x !== null && <div className="guide guide-v" style={{ left: guides.x }} />}
          {guides.y !== null && <div className="guide guide-h" style={{ top: guides.y }} />}
        </div>
      </div>
    </div>
  )
}

export default Canvas
