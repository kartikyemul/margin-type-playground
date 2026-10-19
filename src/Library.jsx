import { useRef, useState } from 'react'

function Library({ library, onSave, onOpen, onDelete, onExportJson, onImportJson }) {
  const [name, setName] = useState('')
  const fileRef = useRef(null)

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

      <div className="field">
        <span className="label">Share or back up</span>
        <div className="inline">
          <button className="btn" onClick={onExportJson}>
            Download JSON
          </button>
          <button className="btn" onClick={() => fileRef.current.click()}>
            Import JSON
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files[0]
            if (file) onImportJson(file)
            e.target.value = ''
          }}
        />
        <p className="hint small top">A JSON file holds the whole poster, so you can send it to someone else.</p>
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
              <button className="mini" onClick={() => onOpen(item.id)}>
                Open
              </button>
              <button className="mini" onClick={() => onDelete(item.id)}>
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
