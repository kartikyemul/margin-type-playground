import { STARTERS } from './starters.js'

function Toolbar({
  hasSelection,
  canUndo,
  canRedo,
  starterId,
  onStarter,
  onAdd,
  onAddShape,
  onAddImage,
  exportLabel,
  gridOn,
  onGrid,
  onDuplicate,
  onDelete,
  onForward,
  onBackward,
  onUndo,
  onRedo,
  onReset,
  onSave,
  onRestore,
  onExport,
}) {
  return (
    <header className="toolbar">
      <span className="wordmark">Margin</span>

      <span className="group-label">Add</span>
      <button className="btn" onClick={onAdd} aria-label="Add text" title="Add text (T)">
        Text
      </button>
      <button className="btn" onClick={onAddImage} aria-label="Add image" title="Add a PNG or JPEG (or drop or paste one)">
        Image
      </button>
      <button className="btn" onClick={() => onAddShape('rule')} aria-label="Add rule" title="Add a thin line">
        Rule
      </button>
      <button className="btn" onClick={() => onAddShape('block')} aria-label="Add block" title="Add a solid block of color">
        Block
      </button>

      <span className="divider" />

      <button className="btn" onClick={onDuplicate} disabled={!hasSelection} title="Duplicate (Ctrl D)">
        Duplicate
      </button>
      <button className="btn" onClick={onDelete} disabled={!hasSelection} title="Delete (Delete)">
        Delete
      </button>

      <span className="divider" />

      <button className="btn" onClick={onForward} disabled={!hasSelection} title="Bring forward (])">
        Forward
      </button>
      <button className="btn" onClick={onBackward} disabled={!hasSelection} title="Send backward ([)">
        Back
      </button>

      <span className="divider" />

      <button className="btn" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl Z)">
        Undo
      </button>
      <button className="btn" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl Shift Z)">
        Redo
      </button>
      <button className="btn" onClick={onReset} title="Go back to the starter composition">
        Reset
      </button>

      <span className="divider" />

      <button className="btn" onClick={onGrid} aria-pressed={gridOn} title="Show a grid and snap to it">
        Grid
      </button>

      <label className="starter">
        <span className="visually-hidden">Starter</span>
        <select className="btn" aria-label="Starter composition" value={starterId} onChange={(e) => onStarter(e.target.value)}>
          {STARTERS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <span className="spacer" />

      <button className="btn" onClick={onSave} title="Save in this browser (Ctrl S)">
        Save
      </button>
      <button className="btn" onClick={onRestore} title="Load the saved composition">
        Restore
      </button>
      <button className="btn primary" onClick={onExport}>
        {exportLabel}
      </button>
    </header>
  )
}

export default Toolbar
