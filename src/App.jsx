import { useEffect, useRef, useState } from 'react'
import Toolbar from './Toolbar.jsx'
import Canvas from './Canvas.jsx'
import Properties from './Properties.jsx'
import { STARTERS, buildElements, makeText, newId } from './starters.js'
import { exportPng } from './exportPng.js'

const STORAGE_KEY = 'margin-composition'

function loadSaved() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (data && Array.isArray(data.elements)) {
      return {
        starterId: STARTERS.some((s) => s.id === data.starterId) ? data.starterId : 'quiet-hours',
        elements: data.elements.filter((el) => el && typeof el.text === 'string').map((el) => makeText(el)),
      }
    }
  } catch (e) {
    // ignore broken saved data
  }
  return null
}

function App() {
  const [initial] = useState(() => loadSaved() || { starterId: 'quiet-hours', elements: buildElements('quiet-hours') })
  const [starterId, setStarterId] = useState(initial.starterId)
  const [history, setHistory] = useState({ past: [], elements: initial.elements, future: [] })
  const [selectedId, setSelectedId] = useState(null)
  const [toast, setToast] = useState('')

  const textRef = useRef(null)
  const toastTimer = useRef(null)
  const lastEdit = useRef({ key: null, time: 0 })

  const elements = history.elements
  const selected = elements.find((el) => el.id === selectedId)

  function notify(message) {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 1800)
  }

  // Every change goes through here so undo and redo work.
  // Changes with the same key in quick succession (dragging, typing, sliders)
  // are merged into a single undo step.
  function commit(change, key = null) {
    const now = Date.now()
    const merge = key && lastEdit.current.key === key && now - lastEdit.current.time < 1500
    lastEdit.current = { key, time: now }
    setHistory((h) => ({
      past: merge ? h.past : [...h.past, h.elements].slice(-100),
      elements: change(h.elements),
      future: [],
    }))
  }

  function changeElement(id, changes, key = null) {
    commit((list) => list.map((el) => (el.id === id ? { ...el, ...changes } : el)), key && key + '-' + id)
  }

  function addText() {
    const offset = (elements.length % 6) * 24
    const el = makeText({ x: 60 + offset, y: 80 + offset })
    commit((list) => [...list, el])
    setSelectedId(el.id)
    setTimeout(() => {
      textRef.current?.focus()
      textRef.current?.select()
    }, 0)
  }

  function duplicate() {
    if (!selected) return
    const copy = { ...selected, id: newId(), x: selected.x + 20, y: selected.y + 20 }
    commit((list) => [...list, copy])
    setSelectedId(copy.id)
    notify('Duplicated')
  }

  function remove() {
    if (!selected) return
    commit((list) => list.filter((el) => el.id !== selected.id))
    setSelectedId(null)
    notify('Deleted')
  }

  function moveLayer(step) {
    if (!selected) return
    const from = elements.findIndex((el) => el.id === selected.id)
    const to = from + step
    if (to < 0 || to >= elements.length) {
      notify(step > 0 ? 'Already in front' : 'Already at the back')
      return
    }
    commit((list) => {
      const next = [...list]
      ;[next[from], next[to]] = [next[to], next[from]]
      return next
    })
    notify(step > 0 ? 'Brought forward' : 'Sent backward')
  }

  function undo() {
    if (history.past.length === 0) return
    lastEdit.current = { key: null, time: 0 }
    setHistory((h) => ({
      past: h.past.slice(0, -1),
      elements: h.past[h.past.length - 1],
      future: [h.elements, ...h.future],
    }))
    notify('Undone')
  }

  function redo() {
    if (history.future.length === 0) return
    lastEdit.current = { key: null, time: 0 }
    setHistory((h) => ({
      past: [...h.past, h.elements],
      elements: h.future[0],
      future: h.future.slice(1),
    }))
    notify('Redone')
  }

  function loadStarter(id) {
    const starter = STARTERS.find((s) => s.id === id)
    setStarterId(id)
    commit(() => buildElements(id))
    setSelectedId(null)
    notify(starter.name + ' loaded')
  }

  function reset() {
    commit(() => buildElements(starterId))
    setSelectedId(null)
    notify('Reset')
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ starterId, elements, savedAt: Date.now() }))
      notify('Saved')
    } catch (e) {
      notify('Could not save')
    }
  }

  function restore() {
    const saved = loadSaved()
    if (!saved) {
      notify('Nothing saved yet')
      return
    }
    setStarterId(saved.starterId)
    commit(() => saved.elements)
    setSelectedId(null)
    notify('Restored')
  }

  async function exportImage() {
    try {
      await exportPng(elements)
      notify('PNG exported')
    } catch (e) {
      notify('Export failed')
    }
  }

  useEffect(() => {
    function onKeyDown(e) {
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()

      if (mod && key === 's') {
        e.preventDefault()
        save()
        return
      }

      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (key === 'escape') e.target.blur()
        return
      }

      if (mod && key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (mod && key === 'y') {
        e.preventDefault()
        redo()
      } else if (mod && key === 'd') {
        e.preventDefault()
        duplicate()
      } else if (mod) {
        return
      } else if (key === 't') {
        e.preventDefault()
        addText()
      } else if (key === 'escape') {
        setSelectedId(null)
      } else if (!selected) {
        return
      } else if (key === 'delete' || key === 'backspace') {
        e.preventDefault()
        remove()
      } else if (key === ']') {
        moveLayer(1)
      } else if (key === '[') {
        moveLayer(-1)
      } else if (key.startsWith('arrow')) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const dx = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0
        const dy = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0
        changeElement(selected.id, { x: selected.x + dx, y: selected.y + dy }, 'nudge')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <div className="app">
      <Toolbar
        hasSelection={!!selected}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        starterId={starterId}
        onStarter={loadStarter}
        onAdd={addText}
        onDuplicate={duplicate}
        onDelete={remove}
        onForward={() => moveLayer(1)}
        onBackward={() => moveLayer(-1)}
        onUndo={undo}
        onRedo={redo}
        onReset={reset}
        onSave={save}
        onRestore={restore}
        onExport={exportImage}
      />
      <main className="workspace">
        <Canvas
          elements={elements}
          selectedId={selected ? selected.id : null}
          onSelect={setSelectedId}
          onChange={changeElement}
          onEdit={() => textRef.current?.focus()}
        />
        <Properties
          element={selected}
          textRef={textRef}
          onChange={(changes, key) => changeElement(selected.id, changes, key)}
        />
      </main>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}

export default App
