import { useEffect, useRef, useState } from 'react'
import Toolbar from './Toolbar.jsx'
import Canvas from './Canvas.jsx'
import Properties from './Properties.jsx'
import Layers from './Layers.jsx'
import Library from './Library.jsx'
import { STARTERS, buildElements, buildPoster, makeItem, makeShape, makeText, newId } from './starters.js'
import { exportPng } from './exportPng.js'
import { DEFAULT_POSTER, MARGIN } from './constants.js'

const STORAGE_KEY = 'margin-composition'
const LIBRARY_KEY = 'margin-library'

function cleanPoster(saved) {
  const poster = { ...DEFAULT_POSTER, ...saved }
  const sizeOk = (n) => Number.isFinite(n) && n >= 200 && n <= 2000
  if (!sizeOk(poster.width) || !sizeOk(poster.height)) {
    poster.width = DEFAULT_POSTER.width
    poster.height = DEFAULT_POSTER.height
  }
  if (typeof poster.background !== 'string') poster.background = DEFAULT_POSTER.background
  if (![1, 2, 3].includes(poster.exportScale)) poster.exportScale = DEFAULT_POSTER.exportScale
  poster.transparent = poster.transparent === true
  return poster
}

function cleanDoc(data) {
  if (!data || !Array.isArray(data.elements)) return null
  return {
    poster: cleanPoster(data.poster),
    starterId: STARTERS.some((s) => s.id === data.starterId) ? data.starterId : 'quiet-hours',
    elements: data.elements
      .filter((el) => el && (el.type === 'shape' || typeof el.text === 'string'))
      .map((el) => makeItem(el)),
  }
}

function loadSaved() {
  try {
    return cleanDoc(JSON.parse(localStorage.getItem(STORAGE_KEY)))
  } catch (e) {
    return null
  }
}

function loadLibrary() {
  try {
    const list = JSON.parse(localStorage.getItem(LIBRARY_KEY))
    if (!Array.isArray(list)) return []
    return list
      .filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string')
      .map((item) => ({ ...item, ...cleanDoc(item), savedAt: item.savedAt || Date.now() }))
      .filter((item) => item.elements)
  } catch (e) {
    return []
  }
}

function App() {
  const [initial] = useState(
    () => loadSaved() || { starterId: 'quiet-hours', elements: buildElements('quiet-hours'), poster: buildPoster('quiet-hours') }
  )
  const [starterId, setStarterId] = useState(initial.starterId)
  const [history, setHistory] = useState({
    past: [],
    doc: { elements: initial.elements, poster: initial.poster },
    future: [],
  })
  const [selectedIds, setSelectedIds] = useState([])
  const [toast, setToast] = useState('')
  const [tab, setTab] = useState('style')
  const [library, setLibrary] = useState(loadLibrary)

  const textRef = useRef(null)
  const toastTimer = useRef(null)
  const lastEdit = useRef({ key: null, time: 0 })

  const elements = history.doc.elements
  const poster = history.doc.poster
  const selection = elements.filter((el) => selectedIds.includes(el.id))
  const hasSelection = selection.length > 0

  function notify(message) {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 1800)
  }

  // Every change goes through here so undo and redo work.
  // The "doc" is the whole poster: its elements plus the poster settings.
  // Changes with the same key in quick succession (dragging, typing, sliders)
  // are merged into a single undo step.
  function commit(change, key = null) {
    const now = Date.now()
    const merge = key && lastEdit.current.key === key && now - lastEdit.current.time < 1500
    lastEdit.current = { key, time: now }
    setHistory((h) => ({
      past: merge ? h.past : [...h.past, h.doc].slice(-100),
      doc: change(h.doc),
      future: [],
    }))
  }

  // Click selects one item, shift-click adds or removes it, null clears everything
  function select(id, additive = false) {
    if (id === null) setSelectedIds([])
    else if (additive) setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
    else setSelectedIds([id])
  }

  function changeElements(ids, changes, key = null) {
    commit(
      (doc) => ({ ...doc, elements: doc.elements.map((el) => (ids.includes(el.id) ? { ...el, ...changes } : el)) }),
      key && key + '-' + ids.join('+')
    )
  }

  // moves looks like { someId: { x: 10, y: 20 }, otherId: { x: 40, y: 60 } }
  function moveElements(moves, key = null) {
    commit(
      (doc) => ({ ...doc, elements: doc.elements.map((el) => (moves[el.id] ? { ...el, ...moves[el.id] } : el)) }),
      key
    )
  }

  function changePoster(changes, key = null) {
    commit((doc) => ({ ...doc, poster: { ...doc.poster, ...changes } }), key && 'poster-' + key)
  }

  function addItem(el) {
    commit((doc) => ({ ...doc, elements: [...doc.elements, el] }))
    setSelectedIds([el.id])
    setTab('style')
  }

  function addText() {
    const offset = (elements.length % 6) * 24
    addItem(makeText({ x: 60 + offset, y: 80 + offset }))
    setTimeout(() => {
      textRef.current?.focus()
      textRef.current?.select()
    }, 0)
  }

  function addShape(kind) {
    const offset = (elements.length % 6) * 24
    const size = kind === 'rule' ? { width: 240, height: 3 } : { width: 160, height: 160, color: '#ffe94a' }
    addItem(makeShape({ kind, x: 60 + offset, y: 120 + offset, ...size }))
  }

  function duplicate() {
    if (!hasSelection) return
    const copies = selection.map((el) => ({ ...el, id: newId(), x: el.x + 20, y: el.y + 20 }))
    commit((doc) => ({ ...doc, elements: [...doc.elements, ...copies] }))
    setSelectedIds(copies.map((el) => el.id))
    notify(copies.length > 1 ? 'Duplicated ' + copies.length + ' items' : 'Duplicated')
  }

  function remove() {
    if (!hasSelection) return
    const ids = selection.map((el) => el.id)
    commit((doc) => ({ ...doc, elements: doc.elements.filter((el) => !ids.includes(el.id)) }))
    setSelectedIds([])
    notify(ids.length > 1 ? 'Deleted ' + ids.length + ' items' : 'Deleted')
  }

  function moveLayer(step, id) {
    const target = id || (selection.length === 1 ? selection[0].id : null)
    if (!target) {
      notify('Select one item to change its layer')
      return
    }
    const from = elements.findIndex((el) => el.id === target)
    const to = from + step
    if (to < 0 || to >= elements.length) {
      notify(step > 0 ? 'Already in front' : 'Already at the back')
      return
    }
    commit((doc) => {
      const next = [...doc.elements]
      ;[next[from], next[to]] = [next[to], next[from]]
      return { ...doc, elements: next }
    })
    notify(step > 0 ? 'Brought forward' : 'Sent backward')
  }

  // Lines items up against the poster edges (with a margin) or its centre
  function align(where) {
    const moves = {}
    selection.forEach((el) => {
      const node = document.querySelector(`[data-id="${el.id}"]`)
      if (!node) return
      const w = node.offsetWidth
      const h = node.offsetHeight
      let x = el.x
      let y = el.y
      if (where === 'left') x = MARGIN
      if (where === 'center') x = (poster.width - w) / 2
      if (where === 'right') x = poster.width - MARGIN - w
      if (where === 'top') y = MARGIN
      if (where === 'middle') y = (poster.height - h) / 2
      if (where === 'bottom') y = poster.height - MARGIN - h
      moves[el.id] = { x: Math.round(x), y: Math.round(y) }
    })
    moveElements(moves)
    notify('Aligned')
  }

  function undo() {
    if (history.past.length === 0) return
    lastEdit.current = { key: null, time: 0 }
    setHistory((h) => ({
      past: h.past.slice(0, -1),
      doc: h.past[h.past.length - 1],
      future: [h.doc, ...h.future],
    }))
    notify('Undone')
  }

  function redo() {
    if (history.future.length === 0) return
    lastEdit.current = { key: null, time: 0 }
    setHistory((h) => ({
      past: [...h.past, h.doc],
      doc: h.future[0],
      future: h.future.slice(1),
    }))
    notify('Redone')
  }

  function loadStarter(id) {
    const starter = STARTERS.find((s) => s.id === id)
    setStarterId(id)
    commit(() => ({ elements: buildElements(id), poster: buildPoster(id) }))
    setSelectedIds([])
    notify(starter.name + ' loaded')
  }

  function reset() {
    commit(() => ({ elements: buildElements(starterId), poster: buildPoster(starterId) }))
    setSelectedIds([])
    notify('Reset')
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ starterId, elements, poster, savedAt: Date.now() }))
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
    commit(() => ({ elements: saved.elements, poster: saved.poster }))
    setSelectedIds([])
    notify('Restored')
  }

  function saveToLibrary(rawName) {
    const name = rawName.trim() || 'Untitled'
    const existing = library.find((item) => item.name === name)
    const entry = { id: existing ? existing.id : newId(), name, savedAt: Date.now(), starterId, elements, poster }
    const next = existing ? library.map((item) => (item.id === existing.id ? entry : item)) : [entry, ...library]
    try {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(next))
      setLibrary(next)
      notify(existing ? 'Replaced "' + name + '"' : 'Saved "' + name + '"')
    } catch (e) {
      notify('Could not save')
    }
  }

  function openFromLibrary(id) {
    const item = library.find((entry) => entry.id === id)
    if (!item) return
    setStarterId(item.starterId)
    commit(() => ({ elements: item.elements.map((el) => ({ ...el })), poster: item.poster }))
    setSelectedIds([])
    notify('Opened "' + item.name + '"')
  }

  function deleteFromLibrary(id) {
    const item = library.find((entry) => entry.id === id)
    if (!item || !window.confirm('Delete "' + item.name + '"? This can\'t be undone.')) return
    const next = library.filter((entry) => entry.id !== id)
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(next))
    setLibrary(next)
    notify('Deleted "' + item.name + '"')
  }

  function editText() {
    setTab('style')
    setTimeout(() => textRef.current?.focus(), 0)
  }

  async function exportImage() {
    try {
      await exportPng(elements, poster)
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
      } else if (mod && key === 'a') {
        e.preventDefault()
        setSelectedIds(elements.map((el) => el.id))
      } else if (mod) {
        return
      } else if (key === 't') {
        e.preventDefault()
        addText()
      } else if (key === 'escape') {
        setSelectedIds([])
      } else if (!hasSelection) {
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
        const moves = {}
        selection.forEach((el) => {
          moves[el.id] = { x: el.x + dx, y: el.y + dy }
        })
        moveElements(moves, 'nudge')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <div className="app">
      <Toolbar
        hasSelection={hasSelection}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        starterId={starterId}
        onStarter={loadStarter}
        onAdd={addText}
        onAddShape={addShape}
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
          poster={poster}
          selectedIds={selectedIds}
          onSelect={select}
          onMove={moveElements}
          onEdit={editText}
        />
        <aside className="sidebar">
          <div className="tabs" role="tablist">
            {[
              ['style', 'Style'],
              ['layers', 'Layers'],
              ['posters', 'Posters'],
            ].map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} className="tab" onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="sidebar-body">
            {tab === 'style' && (
              <Properties
                selection={selection}
                poster={poster}
                textRef={textRef}
                onChange={(changes, key) =>
                  changeElements(
                    selection.map((el) => el.id),
                    changes,
                    key
                  )
                }
                onPosterChange={changePoster}
                onAlign={align}
              />
            )}
            {tab === 'layers' && (
              <Layers
                elements={elements}
                selectedIds={selectedIds}
                onSelect={select}
                onToggle={(id) => changeElements([id], { hidden: !elements.find((el) => el.id === id).hidden })}
                onMove={(id, step) => moveLayer(step, id)}
              />
            )}
            {tab === 'posters' && (
              <Library
                library={library}
                onSave={saveToLibrary}
                onOpen={openFromLibrary}
                onDelete={deleteFromLibrary}
              />
            )}
          </div>
        </aside>
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
