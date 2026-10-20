import { useEffect, useRef, useState } from 'react'
import { HIGHLIGHT, fontStack } from './constants.js'
import { describe } from './starters.js'
import { normalizeAngle, rectsOverlap, snapAxis, snapToGrid } from './geometry.js'

const SHAPE_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
const TEXT_HANDLES = ['nw', 'ne', 'se', 'sw']

const CURSORS = { n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize' }

function Canvas({ elements, poster, selectedIds, onSelect, onSelectMany, onMove, onEdit, onDropFiles }) {
  const stageRef = useRef(null)
  const drag = useRef(null)
  const handleDrag = useRef(null)
  const dragCount = useRef(0)
  const marquee = useRef(null)
  const [marqueeBox, setMarqueeBox] = useState(null)
  const [scale, setScale] = useState(0.7)
  const [guides, setGuides] = useState({ x: null, y: null })

  const grid = poster.snapGrid ? poster.gridSize : 0

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
      // no guide nearby, so fall back to the grid if it's switched on
      if (guideX === null) x = snapToGrid(x, grid)
      if (guideY === null) y = snapToGrid(y, grid)
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

  // Resize and rotate handles (only shown when a single item is selected)
  function startHandle(e, el, kind) {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const node = e.currentTarget.parentElement
    const rect = node.getBoundingClientRect()
    dragCount.current += 1
    handleDrag.current = {
      kind,
      el,
      session: dragCount.current,
      startX: e.clientX,
      startY: e.clientY,
      w: node.offsetWidth,
      h: node.offsetHeight,
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
    }
  }

  function moveHandle(e) {
    const d = handleDrag.current
    if (!d) return

    if (d.kind === 'rotate') {
      let deg = (Math.atan2(e.clientY - d.cy, e.clientX - d.cx) * 180) / Math.PI + 90
      deg = normalizeAngle(deg)
      if (e.shiftKey) deg = Math.round(deg / 15) * 15
      onMove({ [d.el.id]: { rotation: Math.round(deg) } }, 'rotate-' + d.session)
      return
    }

    // turn the pointer movement into the item's own (rotated) directions
    const rad = (d.el.rotation * Math.PI) / 180
    const dx = (e.clientX - d.startX) / scale
    const dy = (e.clientY - d.startY) / scale
    const lx = dx * Math.cos(rad) + dy * Math.sin(rad)
    const ly = -dx * Math.sin(rad) + dy * Math.cos(rad)
    const sx = d.kind.includes('e') ? 1 : d.kind.includes('w') ? -1 : 0
    const sy = d.kind.includes('s') ? 1 : d.kind.includes('n') ? -1 : 0

    let w = d.w
    let h = d.h
    const changes = {}

    if (d.el.type === 'shape') {
      const snap = (v) => (grid ? Math.max(grid, Math.round(v / grid) * grid) : Math.max(1, Math.round(v)))
      if (sx !== 0) w = snap(d.w + sx * lx)
      if (sy !== 0) h = snap(d.h + sy * ly)
      changes.width = w
      changes.height = h
    } else if (d.el.type === 'image') {
      // pictures keep their proportions
      const diagonal = Math.hypot(d.w, d.h)
      const along = (lx * sx * d.w + ly * sy * d.h) / diagonal
      const ratio = Math.min(4000 / d.w, Math.max(20 / d.w, 1 + along / diagonal))
      w = d.w * ratio
      h = d.h * ratio
      changes.width = Math.round(w)
      changes.height = Math.round(h)
    } else {
      // text scales its font size, following the diagonal
      const diagonal = Math.hypot(d.w, d.h)
      const along = (lx * sx * d.w + ly * sy * d.h) / diagonal
      const size = Math.round(Math.min(400, Math.max(8, d.el.fontSize * (1 + along / diagonal))))
      const ratio = size / d.el.fontSize
      w = d.w * ratio
      h = d.h * ratio
      changes.fontSize = size
    }

    // keep the opposite edge or corner where it was
    const shiftX = (sx * (w - d.w)) / 2
    const shiftY = (sy * (h - d.h)) / 2
    const cx = d.el.x + d.w / 2 + shiftX * Math.cos(rad) - shiftY * Math.sin(rad)
    const cy = d.el.y + d.h / 2 + shiftX * Math.sin(rad) + shiftY * Math.cos(rad)
    changes.x = Math.round(cx - w / 2)
    changes.y = Math.round(cy - h / 2)
    onMove({ [d.el.id]: changes }, 'resize-' + d.session)
  }

  function endHandle() {
    handleDrag.current = null
  }

  // Dragging on empty space draws a box and selects whatever it touches
  function startMarquee(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (!e.shiftKey) onSelect(null)
    marquee.current = {
      startX: e.clientX,
      startY: e.clientY,
      base: e.shiftKey ? selectedIds : [],
      moved: false,
      last: '',
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function moveMarquee(e) {
    const m = marquee.current
    if (!m) return
    if (!m.moved && Math.hypot(e.clientX - m.startX, e.clientY - m.startY) < 4) return
    m.moved = true

    const box = {
      left: Math.min(m.startX, e.clientX),
      top: Math.min(m.startY, e.clientY),
      right: Math.max(m.startX, e.clientX),
      bottom: Math.max(m.startY, e.clientY),
    }
    const stage = stageRef.current.getBoundingClientRect()
    setMarqueeBox({ left: box.left - stage.left, top: box.top - stage.top, width: box.right - box.left, height: box.bottom - box.top })

    const hits = []
    stageRef.current.querySelectorAll('.item').forEach((node) => {
      if (rectsOverlap(box, node.getBoundingClientRect())) hits.push(node.dataset.id)
    })
    const ids = [...new Set([...m.base, ...hits])]
    const key = ids.join(',')
    if (key !== m.last) {
      m.last = key
      onSelectMany(ids)
    }
  }

  function endMarquee() {
    marquee.current = null
    setMarqueeBox(null)
  }

  function itemProps(el) {
    const label = el.type === 'shape' || el.type === 'image' ? describe(el) : 'Text: ' + describe(el)
    const canEdit = el.type !== 'shape' && el.type !== 'image'
    return {
      role: 'button',
      tabIndex: 0,
      'aria-label': label,
      'aria-pressed': selectedIds.includes(el.id),
      onFocus: (e) => {
        // tabbing onto an item selects it; clicking already handles its own selection
        if (e.currentTarget.matches(':focus-visible') && !selectedIds.includes(el.id)) onSelect(el.id)
      },
      onKeyDown: (e) => {
        if (e.key === ' ') {
          e.preventDefault()
          onSelect(el.id, e.shiftKey)
        } else if (e.key === 'Enter' && canEdit) {
          e.preventDefault()
          onSelect(el.id)
          onEdit()
        }
      },
      'data-id': el.id,
      onPointerDown: (e) => startDrag(e, el),
      onPointerMove: moveDrag,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    }
  }

  function renderHandles(el) {
    const size = 11 / scale
    const reach = 26 / scale
    const dirs = el.type === 'shape' ? SHAPE_HANDLES : TEXT_HANDLES // text and pictures only scale from the corners
    const handleProps = (kind) => ({
      onPointerDown: (e) => startHandle(e, el, kind),
      onPointerMove: moveHandle,
      onPointerUp: endHandle,
      onPointerCancel: endHandle,
    })

    return (
      <>
        <div className="rotate-line" aria-hidden="true" style={{ top: -reach, height: reach, width: 1 / scale }} />
        <div
          className="handle rotate"
          style={{ left: '50%', top: -reach, width: size, height: size }}
          title="Rotate (hold Shift for 15° steps)"
          aria-hidden="true"
          {...handleProps('rotate')}
        />
        {dirs.map((dir) => (
          <div
            key={dir}
            className="handle"
            aria-hidden="true"
            style={{
              left: dir.includes('w') ? 0 : dir.includes('e') ? '100%' : '50%',
              top: dir.includes('n') ? 0 : dir.includes('s') ? '100%' : '50%',
              width: size,
              height: size,
              cursor: CURSORS[dir],
            }}
            {...handleProps(dir)}
          />
        ))}
      </>
    )
  }

  const onlyId = selectedIds.length === 1 ? selectedIds[0] : null

  return (
    <div
      className="stage"
      ref={stageRef}
      role="region"
      aria-label="Poster canvas. Tab moves between items, arrow keys nudge, plus and minus resize, R rotates."
      onPointerDown={startMarquee}
      onPointerMove={moveMarquee}
      onPointerUp={endMarquee}
      onPointerCancel={endMarquee}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        onDropFiles(e.dataTransfer.files)
      }}
    >
      <div className="poster-frame" style={{ width: poster.width * scale + 2, height: poster.height * scale + 2 }}>
        <div
          className="poster"
          role="group"
          aria-label={`Poster, ${poster.width} by ${poster.height}, ${elements.filter((el) => !el.hidden).length} items`}
          style={{
            width: poster.width,
            height: poster.height,
            background: poster.background,
            transform: `scale(${scale})`,
          }}
        >
          {poster.showGrid && (
            <svg className="grid" width={poster.width} height={poster.height} aria-hidden="true">
              <defs>
                <pattern id="grid-pattern" width={poster.gridSize} height={poster.gridSize} patternUnits="userSpaceOnUse">
                  <path d={`M ${poster.gridSize} 0 H 0 V ${poster.gridSize}`} fill="none" stroke="#808080" strokeOpacity="0.35" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            </svg>
          )}
          {elements
            .filter((el) => !el.hidden)
            .map((el) => {
              const selected = selectedIds.includes(el.id)
              const handles = el.id === onlyId ? renderHandles(el) : null

              if (el.type === 'image') {
                return (
                  <div
                    key={el.id}
                    className={'item image-el' + (selected ? ' selected' : '')}
                    style={{
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      opacity: el.opacity,
                      transform: `rotate(${el.rotation}deg)`,
                    }}
                    {...itemProps(el)}
                  >
                    <img src={el.src} alt="" draggable={false} />
                    {handles}
                  </div>
                )
              }

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
                  >
                    {handles}
                  </div>
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
                  {handles}
                </div>
              )
            })}
          {guides.x !== null && <div className="guide guide-v" style={{ left: guides.x }} />}
          {guides.y !== null && <div className="guide guide-h" style={{ top: guides.y }} />}
        </div>
      </div>
      {marqueeBox && <div className="marquee" style={marqueeBox} />}
    </div>
  )
}

export default Canvas
