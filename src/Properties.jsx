import { FONTS } from './constants.js'

const WEIGHTS = [
  { label: 'Regular', value: 400 },
  { label: 'Bold', value: 700 },
  { label: 'Black', value: 900 },
]

const ALIGNMENTS = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
]

const COLORS = ['#000000', '#8a8a8a', '#d62828', '#1f3fd1']

const SHORTCUTS = [
  ['T', 'Add text'],
  ['Ctrl D', 'Duplicate'],
  ['Delete', 'Remove'],
  ['Arrows', 'Nudge (Shift for more)'],
  ['[  ]', 'Send back, bring forward'],
  ['Ctrl Z', 'Undo'],
  ['Ctrl Shift Z', 'Redo'],
  ['Ctrl S', 'Save'],
  ['Esc', 'Deselect'],
]

function Properties({ element, onChange, textRef }) {
  if (!element) {
    return (
      <aside className="properties">
        <p className="hint">Select text on the poster to style it, or add something new. Double-click text to edit it.</p>
        <dl className="shortcuts">
          {SHORTCUTS.map(([keys, label]) => (
            <div className="shortcut" key={keys}>
              <dt>
                <kbd>{keys}</kbd>
              </dt>
              <dd>{label}</dd>
            </div>
          ))}
        </dl>
        <p className="hint small">On a Mac, use Cmd instead of Ctrl.</p>
      </aside>
    )
  }

  return (
    <aside className="properties">
      <div className="field">
        <label htmlFor="text">Text</label>
        <textarea
          id="text"
          ref={textRef}
          rows={4}
          value={element.text}
          onChange={(e) => onChange({ text: e.target.value }, 'text')}
        />
      </div>

      <div className="field">
        <label htmlFor="font">Font</label>
        <select id="font" value={element.fontFamily} onChange={(e) => onChange({ fontFamily: e.target.value })}>
          {FONTS.map((f) => (
            <option key={f.name} value={f.name}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="size">Size {element.fontSize}</label>
        <input
          id="size"
          type="range"
          min="8"
          max="300"
          value={element.fontSize}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) }, 'size')}
        />
      </div>

      <div className="field">
        <span className="label">Weight</span>
        <div className="segmented">
          {WEIGHTS.map((w) => (
            <button
              key={w.value}
              aria-pressed={element.fontWeight === w.value}
              onClick={() => onChange({ fontWeight: w.value })}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="label">Alignment</span>
        <div className="segmented">
          {ALIGNMENTS.map((a) => (
            <button key={a.value} aria-pressed={element.align === a.value} onClick={() => onChange({ align: a.value })}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="label">Color</span>
        <div className="swatches">
          {COLORS.map((c) => (
            <button
              key={c}
              className="swatch"
              style={{ background: c }}
              aria-label={'Color ' + c}
              aria-pressed={element.color === c}
              onClick={() => onChange({ color: c })}
            />
          ))}
          <input
            type="color"
            aria-label="Custom color"
            value={element.color}
            onChange={(e) => onChange({ color: e.target.value }, 'color')}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="rotation">Rotation {element.rotation}°</label>
        <input
          id="rotation"
          type="range"
          min="-180"
          max="180"
          value={element.rotation}
          onChange={(e) => onChange({ rotation: Number(e.target.value) }, 'rotation')}
        />
      </div>

      <div className="field">
        <label className="check">
          <input
            type="checkbox"
            checked={element.highlight}
            onChange={(e) => onChange({ highlight: e.target.checked })}
          />
          Highlight
        </label>
      </div>
    </aside>
  )
}

export default Properties
