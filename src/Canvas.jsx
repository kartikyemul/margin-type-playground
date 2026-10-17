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

function Canvas({ elements, poster, selectedIds, onSelect, onMove, onEdit }) {
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
    const wasSelected = selectedIds.includes(el.id)

    // Shift-click adds or removes an item and doesn't start a drag
    if (e.shiftKey) {
      onSelect(el.id, true)
      return
    }

    // Grabbing something already selected keeps the whole group together
    let ids = [el.id]
    if (wasSelected) ids = selectedIds
    else onSelect(el.id)

    e.currentTarget.setPointerCapture(e.pointerId)
    dragCount.current += 1
    const starts = {}
    elements.forEach((item) => {
      if (ids.includes(item.id)) starts[item.id] = { x: item.x, y: item.y }
    })
    drag.current = {
      id: el.id,
      ids,
      starts,
      startX: e.clientX,
      startY: e.clientY,
      session: dragCount.current,
      moved: false,
      collapse: wasSelected && ids.length > 1,
    }
  }

  function moveDrag(e) {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.hypot(dx, dy) < 3) return
    d.moved = true

    const origin = d.starts[d.id]
    let x = origin.x + dx / scale
    let y = origin.y + dy / scale
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

    // everything in the group moves by the same amount as the one being dragged
    const moveX = x - origin.x
    const moveY = y - origin.y
    const moves = {}
    d.ids.forEach((id) => {
      const start = d.starts[id]
      moves[id] = {
        x: Math.round(Math.max(-300, Math.min(poster.width - 30, start.x + moveX))),
        y: Math.round(Math.max(-200, Math.min(poster.height - 30, start.y + moveY))),
      }
    })
    onMove(moves, 'drag-' + d.session)
  }

  function endDrag() {
    const d = drag.current
    // a plain click on part of a group picks just that item
    if (d && !d.moved && d.collapse) onSelect(d.id)
    drag.current = null
    setGuides({ x: null, y: null })
  }

  function itemProps(el) {
    return {
      'data-id': el.id,
      onPointerDown: (e) => startDrag(e, el),
      onPointerMove: moveDrag,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    }
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
            .map((el) => {
              const selected = selectedIds.includes(el.id)

              if (el.type === 'shape') {
                return (
                  <div
                    key={el.id}
                    className={'item shape-el' + (selected ? ' selected' : '')}
                    style={{
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      background: el.color,
                      transform: `rotate(${el.rotation}deg)`,
                    }}
                    {...itemProps(el)}
                  />
                )
              }

              return (
                <div
                  key={el.id}
                  className={'item text-el' + (selected ? ' selected' : '')}
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
                  {...itemProps(el)}
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
              )
            })}
          {guides.x !== null && <div className="guide guide-v" style={{ left: guides.x }} />}
          {guides.y !== null && <div className="guide guide-h" style={{ top: guides.y }} />}
        </div>
      </div>
    </div>
  )
}

export default Canvas
