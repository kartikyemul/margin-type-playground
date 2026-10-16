import { useEffect, useRef, useState } from 'react'
import { CANVAS_W, CANVAS_H, HIGHLIGHT, fontStack } from './constants.js'

function Canvas({ elements, selectedId, onSelect, onChange, onEdit }) {
  const stageRef = useRef(null)
  const drag = useRef(null)
  const dragCount = useRef(0)
  const [scale, setScale] = useState(0.7)

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const fit = Math.min((width - 2) / CANVAS_W, (height - 2) / CANVAS_H)
      setScale(Math.max(0.2, Math.min(fit, 1.4)))
    })
    observer.observe(stageRef.current)
    return () => observer.disconnect()
  }, [])

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
    const x = Math.max(-300, Math.min(CANVAS_W - 30, d.x + dx / scale))
    const y = Math.max(-200, Math.min(CANVAS_H - 30, d.y + dy / scale))
    onChange(d.id, { x: Math.round(x), y: Math.round(y) }, 'drag-' + d.session)
  }

  function endDrag() {
    drag.current = null
  }

  return (
    <div className="stage" ref={stageRef} onPointerDown={() => onSelect(null)}>
      <div className="poster-frame" style={{ width: CANVAS_W * scale + 2, height: CANVAS_H * scale + 2 }}>
        <div className="poster" style={{ transform: `scale(${scale})` }}>
          {elements.map((el) => (
            <div
              key={el.id}
              className={'text-el' + (el.id === selectedId ? ' selected' : '')}
              style={{
                left: el.x,
                top: el.y,
                fontFamily: fontStack(el.fontFamily),
                fontSize: el.fontSize,
                fontWeight: el.fontWeight,
                color: el.color,
                textAlign: el.align,
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
        </div>
      </div>
    </div>
  )
}

export default Canvas
