import { useEffect, useRef, useState } from 'react'
import Toolbar from './Toolbar.jsx'
import Canvas from './Canvas.jsx'
import Properties from './Properties.jsx'
import Layers from './Layers.jsx'
import Library from './Library.jsx'
import { STARTERS, buildElements, buildPoster, makeImage, makeShape, makeText, newId } from './starters.js'
import { IMAGE_BUDGET, hasRoomFor, imagesSize, readImage } from './images.js'
import { cleanDoc, expandGroups, keepPrefs } from './doc.js'
import { addVersion, dueForSnapshot, timeLabel } from './versions.js'
import { fitRect, normalizeAngle, scaleBox } from './geometry.js'
import { exportPng } from './exportPng.js'
import { MARGIN } from './constants.js'

const STORAGE_KEY = 'margin-composition'
const LIBRARY_KEY = 'margin-library'
const AUTOSAVE_KEY = 'margin-autosave'
const VERSIONS_KEY = 'margin-versions'

const TABS = [
  ['style', 'Style'],
  ['layers', 'Layers'],
  ['posters', 'Posters'],
]

function loadSaved() {
  try {
    return cleanDoc(JSON.parse(localStorage.getItem(STORAGE_KEY)))
  } catch (e) {
    return null
  }
}

function loadAutosave() {
  try {
    return cleanDoc(JSON.parse(localStorage.getItem(AUTOSAVE_KEY)))
  } catch (e) {
    return null
  }
}

function loadVersions() {
  try {
    const list = JSON.parse(localStorage.getItem(VERSIONS_KEY))
    if (!Array.isArray(list)) return []
    return list
      .map((item) => ({ ...item, ...cleanDoc(item), savedAt: Number(item.savedAt) || Date.now(), label: String(item.label || '').slice(0, 60) }))
      .filter((item) => Array.isArray(item.elements))
  } catch (e) {
    return []
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
    () => loadAutosave() || loadSaved() || { starterId: 'quiet-hours', elements: buildElements('quiet-hours'), poster: buildPoster('quiet-hours') }
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
  const [versions, setVersions] = useState(loadVersions)
  const [autosavedAt, setAutosavedAt] = useState(null)
  const versionsRef = useRef(versions)
  versionsRef.current = versions

  const textRef = useRef(null)
  const toastTimer = useRef(null)
  const lastEdit = useRef({ key: null, time: 0 })

  const elements = history.doc.elements
  const poster = history.doc.poster
  const selection = elements.filter((el) => selectedIds.includes(el.id))
  const hasSelection = selection.length > 0
  const movable = selection.filter((el) => !el.locked)

  function canMove() {
    if (!hasSelection) return false
    if (movable.length === 0) {
      notify('Unlock it first (press L)')
      return false
    }
    return true
  }

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
    else if (additive) {
      const group = expandGroups([id], elements)
      setSelectedIds((ids) => (group.every((x) => ids.includes(x)) ? ids.filter((x) => !group.includes(x)) : [...new Set([...ids, ...group])]))
    } else setSelectedIds(expandGroups([id], elements))
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
    const regroup = {}
    const copies = selection.map((el) => {
      if (el.group && !regroup[el.group]) regroup[el.group] = newId()
      return { ...el, id: newId(), x: el.x + 20, y: el.y + 20, group: el.group ? regroup[el.group] : '', locked: false }
    })
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

  function selectMany(ids) {
    setSelectedIds(expandGroups(ids, elements))
  }

  // Grow or shrink the selected items around their centres
  function scaleSelected(factor) {
    if (!canMove()) return
    const moves = {}
    movable.forEach((el) => {
      if (el.type === 'image' || el.type === 'shape') {
        const box = scaleBox(el, factor, el.type === 'image' ? 20 : 1, 4000)
        moves[el.id] = box
      } else {
        const node = document.querySelector(`[data-id="${el.id}"]`)
        const size = Math.round(Math.min(400, Math.max(8, el.fontSize * factor)))
        const ratio = size / el.fontSize
        const w = node ? node.offsetWidth : 0
        const h = node ? node.offsetHeight : 0
        moves[el.id] = {
          fontSize: size,
          x: Math.round(el.x + (w - w * ratio) / 2),
          y: Math.round(el.y + (h - h * ratio) / 2),
        }
      }
    })
    moveElements(moves, 'scale-' + selection.map((el) => el.id).join('+'))
  }

  function rotateSelected(degrees) {
    if (!canMove()) return
    const moves = {}
    movable.forEach((el) => {
      moves[el.id] = { rotation: normalizeAngle(el.rotation + degrees) }
    })
    moveElements(moves, 'turn')
  }

  // Make selected pictures fit inside the poster, or fill it completely
  function arrangeImages(mode) {
    if (!canMove()) return
    const moves = {}
    movable.forEach((el) => {
      if (el.type === 'image') {
        moves[el.id] = { ...fitRect(el.width, el.height, poster.width, poster.height, mode), rotation: 0 }
      }
    })
    moveElements(moves)
    notify(mode === 'fill' ? 'Picture fills the poster' : 'Picture fits the poster')
  }

  // Lines items up against the poster edges (with a margin) or its centre
  function align(where) {
    if (!canMove()) return
    const moves = {}
    movable.forEach((el) => {
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

  function groupSelected() {
    if (selection.length < 2) {
      notify('Select two or more items to group')
      return
    }
    const group = newId()
    const ids = selection.map((el) => el.id)
    commit((doc) => ({ ...doc, elements: doc.elements.map((el) => (ids.includes(el.id) ? { ...el, group } : el)) }))
    notify('Grouped')
  }

  function ungroupSelected() {
    const ids = selection.map((el) => el.id)
    commit((doc) => ({ ...doc, elements: doc.elements.map((el) => (ids.includes(el.id) ? { ...el, group: '' } : el)) }))
    notify('Ungrouped')
  }

  function toggleLock(ids = selection.map((el) => el.id)) {
    if (ids.length === 0) return
    const lock = !elements.filter((el) => ids.includes(el.id)).every((el) => el.locked)
    commit((doc) => ({ ...doc, elements: doc.elements.map((el) => (ids.includes(el.id) ? { ...el, locked: lock } : el)) }))
    notify(lock ? 'Locked' : 'Unlocked')
  }

  // Switches selected text between growing with its words and wrapping inside a fixed-width box
  function toggleBox() {
    const texts = selection.filter((el) => el.type !== 'shape' && el.type !== 'image' && !el.locked)
    if (texts.length === 0) return
    const fixed = texts.every((el) => el.boxWidth)
    const moves = {}
    texts.forEach((el) => {
      const node = document.querySelector(`[data-id="${el.id}"]`)
      const width = Math.min(Math.max(node ? node.offsetWidth : 300, 100), poster.width - 2 * MARGIN)
      moves[el.id] = { boxWidth: fixed ? 0 : Math.round(width) }
    })
    moveElements(moves)
  }

  function storeVersions(next) {
    versionsRef.current = next
    setVersions(next)
    try {
      localStorage.setItem(VERSIONS_KEY, JSON.stringify(next))
    } catch (e) {
      localStorage.removeItem(VERSIONS_KEY)
    }
  }

  // Keeps a copy of the poster as it is now, so you can always come back to it
  function pushVersion(label) {
    if (elements.length === 0) return
    const next = addVersion(versionsRef.current, { label, starterId, elements, poster })
    if (next !== versionsRef.current) storeVersions(next)
  }

  function restoreVersion(savedAt) {
    const item = versions.find((v) => v.savedAt === savedAt)
    if (!item) return
    pushVersion('Before going back')
    setStarterId(item.starterId)
    commit((doc) => ({ elements: item.elements.map((el) => ({ ...el })), poster: keepPrefs(item.poster, doc.poster) }))
    setSelectedIds([])
    notify('Went back to ' + timeLabel(item.savedAt).toLowerCase())
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
    pushVersion('Before loading ' + starter.name)
    setStarterId(id)
    commit((doc) => ({ elements: buildElements(id), poster: keepPrefs(buildPoster(id), doc.poster) }))
    setSelectedIds([])
    notify(starter.name + ' loaded')
  }

  function reset() {
    pushVersion('Before reset')
    commit((doc) => ({ elements: buildElements(starterId), poster: keepPrefs(buildPoster(starterId), doc.poster) }))
    setSelectedIds([])
    notify('Reset')
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ starterId, elements, poster, savedAt: Date.now() }))
      notify('Saved')
    } catch (e) {
      notify('Browser storage is full. Try fewer or smaller pictures.')
    }
  }

  function restore() {
    const saved = loadSaved()
    if (!saved) {
      notify('Nothing saved yet')
      return
    }
    pushVersion('Before restoring')
    setStarterId(saved.starterId)
    commit((doc) => ({ elements: saved.elements, poster: keepPrefs(saved.poster, doc.poster) }))
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
      notify('Browser storage is full. Try fewer or smaller pictures.')
    }
  }

  function openFromLibrary(id) {
    const item = library.find((entry) => entry.id === id)
    if (!item) return
    pushVersion('Before opening ' + item.name)
    setStarterId(item.starterId)
    commit((doc) => ({ elements: item.elements.map((el) => ({ ...el })), poster: keepPrefs(item.poster, doc.poster) }))
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

  const imageInput = useRef(null)

  async function addImages(fileList) {
    const files = [...fileList].filter((file) => file.type.startsWith('image/')).slice(0, 10)
    if (files.length === 0) return
    const added = []
    for (const file of files) {
      try {
        const picture = await readImage(file)
        if (!hasRoomFor([...elements, ...added.filter(Boolean)], picture.src)) {
          notify('No room for that picture. A poster holds about ' + IMAGE_BUDGET / 1000000 + ' MB of pictures.')
          continue
        }
        // fit it inside most of the poster, centred, nudging each extra one
        const fit = Math.min((poster.width * 0.7) / picture.width, (poster.height * 0.7) / picture.height, 1)
        const width = Math.round(picture.width * fit)
        const height = Math.round(picture.height * fit)
        const nudge = added.length * 20
        added.push(
          makeImage({
            src: picture.src,
            width,
            height,
            x: Math.round((poster.width - width) / 2) + nudge,
            y: Math.round((poster.height - height) / 2) + nudge,
          })
        )
      } catch (e) {
        if (e.message === 'size') notify('That image is too big (20 MB max)')
        else if (e.message === 'type') notify('Please choose a PNG or JPEG image')
        else notify("Couldn't read that image")
      }
    }
    const good = added.filter(Boolean)
    if (good.length === 0) return
    commit((doc) => ({ ...doc, elements: [...doc.elements, ...good] }))
    setSelectedIds(good.map((el) => el.id))
    setTab('style')
    notify(good.length > 1 ? good.length + ' images added' : 'Image added')
  }

  // Arrow keys, Home and End move between the tabs
  function onTabKey(e, id) {
    const index = TABS.findIndex(([tabId]) => tabId === id)
    let next = null
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length
    if (e.key === 'ArrowLeft') next = (index + TABS.length - 1) % TABS.length
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = TABS.length - 1
    if (next === null) return
    e.preventDefault()
    setTab(TABS[next][0])
    setTimeout(() => document.getElementById('tab-' + TABS[next][0])?.focus(), 0)
  }

  function toggleGrid() {
    const on = !poster.snapGrid
    changePoster({ showGrid: on, snapGrid: on })
    notify(on ? 'Grid on' : 'Grid off')
  }

  function editText() {
    setTab('style')
    setTimeout(() => textRef.current?.focus(), 0)
  }

  async function exportImage() {
    try {
      await exportPng(elements, poster)
      notify(poster.exportFormat === 'jpeg' ? 'JPG exported' : 'PNG exported')
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
      } else if (mod && key === 'g') {
        e.preventDefault()
        if (e.shiftKey) ungroupSelected()
        else groupSelected()
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
      } else if (key === 'l') {
        e.preventDefault()
        toggleLock()
      } else if (key === '+' || key === '=') {
        e.preventDefault()
        scaleSelected(1.1)
      } else if (key === '-' || key === '_') {
        e.preventDefault()
        scaleSelected(1 / 1.1)
      } else if (key === 'r') {
        e.preventDefault()
        rotateSelected(e.shiftKey ? -15 : 15)
      } else if (key === ']') {
        moveLayer(1)
      } else if (key === '[') {
        moveLayer(-1)
      } else if (key.startsWith('arrow')) {
        e.preventDefault()
        const step = e.shiftKey ? (poster.snapGrid ? poster.gridSize : 10) : 1
        const dx = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0
        const dy = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0
        if (!canMove()) return
        const moves = {}
        movable.forEach((el) => {
          moves[el.id] = { x: el.x + dx, y: el.y + dy }
        })
        moveElements(moves, 'nudge')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  // Quietly keeps the latest poster in the browser, and every few minutes a version to go back to
  useEffect(() => {
    if (history.past.length === 0) return undefined
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ starterId, elements, poster, savedAt: Date.now() }))
        setAutosavedAt(Date.now())
      } catch (e) {
        return
      }
      if (elements.length > 0 && dueForSnapshot(versionsRef.current, 180000)) {
        const next = addVersion(versionsRef.current, { label: 'Autosave', starterId, elements, poster })
        if (next !== versionsRef.current) storeVersions(next)
      }
    }, 1200)
    return () => clearTimeout(timer)
  }, [history.doc])

  useEffect(() => {
    function onPaste(e) {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const files = [...e.clipboardData.files].filter((file) => file.type.startsWith('image/'))
      if (files.length > 0) {
        e.preventDefault()
        addImages(files)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
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
        onAddImage={() => imageInput.current.click()}
        status={autosavedAt ? 'Autosaved ' + new Date(autosavedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
        exportLabel={poster.exportFormat === 'jpeg' ? 'Export JPG' : 'Export PNG'}
        gridOn={poster.snapGrid}
        onGrid={toggleGrid}
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
          onSelectMany={selectMany}
          onDropFiles={addImages}
        />
        <aside className="sidebar">
          <div className="tabs" role="tablist" aria-label="Side panel">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                id={'tab-' + id}
                role="tab"
                aria-selected={tab === id}
                aria-controls="side-panel"
                tabIndex={tab === id ? 0 : -1}
                className="tab"
                onClick={() => setTab(id)}
                onKeyDown={(e) => onTabKey(e, id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="sidebar-body" id="side-panel" role="tabpanel" aria-labelledby={'tab-' + tab}>
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
                onScale={scaleSelected}
                onToggleBox={toggleBox}
                onGroup={groupSelected}
                onUngroup={ungroupSelected}
                onLock={() => toggleLock()}
                onFit={arrangeImages}
                imageBytes={imagesSize(elements)}
              />
            )}
            {tab === 'layers' && (
              <Layers
                elements={elements}
                selectedIds={selectedIds}
                onSelect={select}
                onToggle={(id) => changeElements([id], { hidden: !elements.find((el) => el.id === id).hidden })}
                onMove={(id, step) => moveLayer(step, id)}
                onToggleLock={(id) => toggleLock([id])}
              />
            )}
            {tab === 'posters' && (
              <Library
                library={library}
                onSave={saveToLibrary}
                onOpen={openFromLibrary}
                onDelete={deleteFromLibrary}
                versions={versions}
                onRestoreVersion={restoreVersion}
              />
            )}
          </div>
        </aside>
      </main>
      <input
        ref={imageInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        hidden
        onChange={(e) => {
          addImages(e.target.files)
          e.target.value = ''
        }}
      />
      <div className="toast-region" role="status" aria-live="polite">
        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  )
}

export default App
