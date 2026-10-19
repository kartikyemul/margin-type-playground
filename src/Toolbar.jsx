import { STARTERS } from './starters.js'

function Toolbar({
  hasSelection,
  canUndo,
  canRedo,
  starterId,
  onStarter,
  onAdd,
  onAddShape,
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

      <button className="btn" onClick={onAdd} title="Add text (T)">
        Add text
      </button>
      <button className="btn" onClick={() => onAddShape('rule')} title="Add a thin line">
        Add rule
      </button>
      <button className="btn" onClick={() => onAddShape('block')} title="Add a solid block of color">
        Add block
      </button>
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
        Export PNG
      </button>
    </header>
  )
}

export default Toolbar
