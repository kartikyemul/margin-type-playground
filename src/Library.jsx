import { useState } from 'react'
import { timeLabel } from './versions.js'

function Library({ library, onSave, onOpen, onDelete, versions = [], onRestoreVersion }) {
  const [name, setName] = useState('')

  function submit() {
    onSave(name)
    setName('')
  }

  return (
    <div>
      <div className="field">
        <label htmlFor="poster-name">Name</label>
        <div className="inline">
          <input
            id="poster-name"
            type="text"
            value={name}
            placeholder="Untitled"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <button className="btn" onClick={submit}>
            Save as
          </button>
        </div>
        <p className="hint small">Using an existing name replaces that poster.</p>
      </div>

      {library.length === 0 ? (
        <p className="hint">Nothing here yet. Saved posters will show up in this list.</p>
      ) : (
        <ul className="rows">
          {library.map((item) => (
            <li key={item.id} className="row">
              <span className="row-name static">
                {item.name}
                <span className="date">{new Date(item.savedAt).toLocaleDateString()}</span>
              </span>
              <button className="mini" aria-label={'Open ' + item.name} onClick={() => onOpen(item.id)}>
                Open
              </button>
              <button className="mini" aria-label={'Delete ' + item.name} onClick={() => onDelete(item.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="section-title">Recent versions</h3>
      {versions.length === 0 ? (
        <p className="hint small">Versions appear here as you work, so you can always go back.</p>
      ) : (
        <ul className="rows">
          {versions.map((v) => (
            <li key={v.savedAt} className="row">
              <span className="row-name static">
                {v.label || 'Autosave'}
                <span className="date">
                  {timeLabel(v.savedAt)} · {v.elements.length} items
                </span>
              </span>
              <button
                className="mini"
                aria-label={'Go back to ' + (v.label || 'Autosave') + ', ' + timeLabel(v.savedAt)}
                onClick={() => onRestoreVersion(v.savedAt)}
              >
                Go back
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Library
