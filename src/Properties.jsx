import { FONTS, FORMATS } from './constants.js'
import { IMAGE_BUDGET } from './images.js'

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

const COLORS = ['#000000', '#8a8a8a', '#d62828', '#1f3fd1', '#ffe94a']
const COLOR_NAMES = { '#000000': 'black', '#8a8a8a': 'grey', '#d62828': 'red', '#1f3fd1': 'blue', '#ffe94a': 'yellow', '#ffffff': 'white', '#e9e9e9': 'light grey' }
const BACKGROUNDS = ['#ffffff', '#e9e9e9', '#ffe94a', '#000000']
const EXPORT_SCALES = [1, 2, 3]
const GRID_SIZES = [10, 20, 40]

const SHORTCUTS = [
  ['T', 'Add text'],
  ['Ctrl D', 'Duplicate'],
  ['Delete', 'Remove'],
  ['Drag empty space', 'Select with a box'],
  ['Shift click', 'Select several'],
  ['Ctrl A', 'Select all'],
  ['Arrows', 'Nudge (Shift for more)'],
  ['+  -', 'Larger, smaller'],
  ['R', 'Rotate (Shift for the other way)'],
  ['Tab', 'Move between items'],
  ['[  ]', 'Send back, bring forward'],
  ['Ctrl Z', 'Undo'],
  ['Ctrl Shift Z', 'Redo'],
  ['Ctrl S', 'Save'],
  ['Esc', 'Deselect'],
  ['Alt drag', 'Move without snapping'],
  ['Shift rotate', 'Turn in 15° steps'],
]

function PosterSettings({ poster, onPosterChange, imageBytes }) {
  const format = FORMATS.find((f) => f.width === poster.width && f.height === poster.height) || FORMATS[0]

  return (
    <>
      <div className="field">
        <label htmlFor="format">Poster format</label>
        <select
          id="format"
          value={format.name}
          onChange={(e) => {
            const f = FORMATS.find((x) => x.name === e.target.value)
            onPosterChange({ width: f.width, height: f.height })
          }}
        >
          {FORMATS.map((f) => (
            <option key={f.name} value={f.name}>
              {f.name} ({f.width} × {f.height})
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <span className="label">Background</span>
        <div className="swatches" role="group" aria-label="Background color">
          {BACKGROUNDS.map((c) => (
            <button
              key={c}
              className="swatch"
              style={{ background: c }}
              aria-label={'Background ' + (COLOR_NAMES[c] || c)}
              aria-pressed={poster.background === c}
              onClick={() => onPosterChange({ background: c })}
            />
          ))}
          <input
            type="color"
            aria-label="Custom background"
            value={poster.background}
            onChange={(e) => onPosterChange({ background: e.target.value }, 'background')}
          />
        </div>
      </div>

      <div className="field">
        <span className="label">Grid</span>
        <label className="check">
          <input type="checkbox" checked={poster.showGrid} onChange={(e) => onPosterChange({ showGrid: e.target.checked })} />
          Show grid
        </label>
        <label className="check">
          <input type="checkbox" checked={poster.snapGrid} onChange={(e) => onPosterChange({ snapGrid: e.target.checked })} />
          Snap to grid
        </label>
        <div className="segmented" role="group" aria-label="Grid size">
          {GRID_SIZES.map((n) => (
            <button key={n} aria-pressed={poster.gridSize === n} onClick={() => onPosterChange({ gridSize: n })}>
              {n} px
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="label">Export as</span>
        <div className="segmented" role="group" aria-label="Export as">
          <button aria-pressed={poster.exportFormat === 'png'} onClick={() => onPosterChange({ exportFormat: 'png' })}>
            PNG
          </button>
          <button aria-pressed={poster.exportFormat === 'jpeg'} onClick={() => onPosterChange({ exportFormat: 'jpeg' })}>
            JPG
          </button>
        </div>
      </div>

      <div className="field">
        <span className="label">Export size</span>
        <div className="segmented" role="group" aria-label="Export size">
          {EXPORT_SCALES.map((n) => (
            <button key={n} aria-pressed={poster.exportScale === n} onClick={() => onPosterChange({ exportScale: n })}>
              {n}×
            </button>
          ))}
        </div>
        <p className="hint small top">
          {poster.width * poster.exportScale} × {poster.height * poster.exportScale} px
        </p>
        {imageBytes > 0 && (
          <p className="hint small top">
            Pictures use {(imageBytes / 1000000).toFixed(1)} of {IMAGE_BUDGET / 1000000} MB the poster can hold.
          </p>
        )}
        <label className="check">
          <input
            type="checkbox"
            checked={poster.transparent && poster.exportFormat === 'png'}
            disabled={poster.exportFormat === 'jpeg'}
            onChange={(e) => onPosterChange({ transparent: e.target.checked })}
          />
          Transparent background (PNG only)
        </label>
      </div>
    </>
  )
}

function Properties({ selection, poster, textRef, onChange, onPosterChange, onAlign, onScale, onFit, imageBytes }) {
  if (selection.length === 0) {
    return (
      <div>
        <PosterSettings poster={poster} onPosterChange={onPosterChange} imageBytes={imageBytes} />
        <p className="hint">
          Select something on the poster to style it, or add something new. Double-click text to edit it.
        </p>
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
      </div>
    )
  }

  const first = selection[0]
  const painted = selection.find((el) => el.type !== 'image') // text and shapes have a color
  const picture = selection.find((el) => el.type === 'image')
  const text = selection.find((el) => el.type !== 'shape' && el.type !== 'image')
  const shape = selection.find((el) => el.type === 'shape')
  const single = selection.length === 1

  return (
    <div>
      {!single && <p className="hint">{selection.length} items selected. Changes apply to all of them.</p>}

      {single && text && (
        <div className="field">
          <label htmlFor="text">Text</label>
          <textarea
            id="text"
            ref={textRef}
            rows={4}
            value={text.text}
            onChange={(e) => onChange({ text: e.target.value }, 'text')}
          />
        </div>
      )}

      <div className="field">
        <span className="label">Align to poster</span>
        <div className="segmented" role="group" aria-label="Align horizontally">
          <button onClick={() => onAlign('left')}>Left</button>
          <button onClick={() => onAlign('center')}>Center</button>
          <button onClick={() => onAlign('right')}>Right</button>
        </div>
        <div className="segmented" role="group" aria-label="Align vertically">
          <button onClick={() => onAlign('top')}>Top</button>
          <button onClick={() => onAlign('middle')}>Middle</button>
          <button onClick={() => onAlign('bottom')}>Bottom</button>
        </div>
      </div>

      <div className="field">
        <span className="label">Size</span>
        <div className="segmented" role="group" aria-label="Size">
          <button onClick={() => onScale(1 / 1.1)} aria-label="Make smaller">
            Smaller
          </button>
          <button onClick={() => onScale(1.1)} aria-label="Make larger">
            Larger
          </button>
        </div>
      </div>

      {picture && (
        <div className="field">
          <span className="label">Picture</span>
          <div className="segmented" role="group" aria-label="Fit picture to poster">
            <button onClick={() => onFit('fit')}>Fit poster</button>
            <button onClick={() => onFit('fill')}>Fill poster</button>
          </div>
        </div>
      )}

      {shape && (
        <>
          <div className="field">
            <label htmlFor="width">Width {shape.width}</label>
            <input
              id="width"
              type="range"
              min="1"
              max={poster.width}
              value={shape.width}
              onChange={(e) => onChange({ width: Number(e.target.value) }, 'width')}
            />
          </div>
          <div className="field">
            <label htmlFor="height">Height {shape.height}</label>
            <input
              id="height"
              type="range"
              min="1"
              max={poster.height}
              value={shape.height}
              onChange={(e) => onChange({ height: Number(e.target.value) }, 'height')}
            />
          </div>
        </>
      )}

      {text && (
        <>
          <div className="field">
            <label htmlFor="font">Font</label>
            <select id="font" value={text.fontFamily} onChange={(e) => onChange({ fontFamily: e.target.value })}>
              {FONTS.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="size">Size {text.fontSize}</label>
            <input
              id="size"
              type="range"
              min="8"
              max="300"
              value={text.fontSize}
              onChange={(e) => onChange({ fontSize: Number(e.target.value) }, 'size')}
            />
          </div>

          <div className="field">
            <label htmlFor="spacing">Letter spacing {text.letterSpacing.toFixed(2)}</label>
            <input
              id="spacing"
              type="range"
              min="-0.1"
              max="0.5"
              step="0.01"
              value={text.letterSpacing}
              onChange={(e) => onChange({ letterSpacing: Number(e.target.value) }, 'spacing')}
            />
          </div>

          <div className="field">
            <label htmlFor="leading">Line spacing {text.lineHeight.toFixed(2)}</label>
            <input
              id="leading"
              type="range"
              min="0.8"
              max="2"
              step="0.05"
              value={text.lineHeight}
              onChange={(e) => onChange({ lineHeight: Number(e.target.value) }, 'leading')}
            />
          </div>

          <div className="field">
            <span className="label">Weight</span>
            <div className="segmented" role="group" aria-label="Weight">
              {WEIGHTS.map((w) => (
                <button
                  key={w.value}
                  aria-pressed={text.fontWeight === w.value}
                  onClick={() => onChange({ fontWeight: w.value })}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="label">Style</span>
            <div className="segmented" role="group" aria-label="Style">
              <button aria-pressed={text.italic} onClick={() => onChange({ italic: !text.italic })}>
                Italic
              </button>
              <button aria-pressed={text.uppercase} onClick={() => onChange({ uppercase: !text.uppercase })}>
                Uppercase
              </button>
            </div>
          </div>

          <div className="field">
            <span className="label">Alignment</span>
            <div className="segmented" role="group" aria-label="Text alignment">
              {ALIGNMENTS.map((a) => (
                <button key={a.value} aria-pressed={text.align === a.value} onClick={() => onChange({ align: a.value })}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {picture && (
        <div className="field">
          <label htmlFor="opacity">Opacity {Math.round(picture.opacity * 100)}%</label>
          <input
            id="opacity"
            type="range"
            min="5"
            max="100"
            value={Math.round(picture.opacity * 100)}
            onChange={(e) => onChange({ opacity: Number(e.target.value) / 100 }, 'opacity')}
          />
        </div>
      )}

      {painted && (
      <div className="field">
        <span className="label">Color</span>
        <div className="swatches" role="group" aria-label="Color">
          {COLORS.map((c) => (
            <button
              key={c}
              className="swatch"
              style={{ background: c }}
              aria-label={'Color ' + (COLOR_NAMES[c] || c)}
              aria-pressed={painted.color === c}
              onClick={() => onChange({ color: c })}
            />
          ))}
          <input
            type="color"
            aria-label="Custom color"
            value={painted.color}
            onChange={(e) => onChange({ color: e.target.value }, 'color')}
          />
        </div>
      </div>
      )}

      <div className="field">
        <label htmlFor="rotation">Rotation {first.rotation}°</label>
        <input
          id="rotation"
          type="range"
          min="-180"
          max="180"
          value={first.rotation}
          onChange={(e) => onChange({ rotation: Number(e.target.value) }, 'rotation')}
        />
      </div>

      {text && (
        <div className="field">
          <label className="check">
            <input
              type="checkbox"
              checked={text.highlight}
              onChange={(e) => onChange({ highlight: e.target.checked })}
            />
            Highlight
          </label>
        </div>
      )}
    </div>
  )
}

export default Properties
