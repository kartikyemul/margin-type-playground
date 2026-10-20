import { useState } from 'react'

function Library({ library, onSave, onOpen, onDelete }) {
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
    </div>
  )
}

export default Library
