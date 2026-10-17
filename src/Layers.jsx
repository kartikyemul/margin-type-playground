function Layers({ elements, selectedId, onSelect, onToggle, onMove }) {
  if (elements.length === 0) {
    return <p className="hint">No text yet. Add some from the toolbar.</p>
  }

  const last = elements.length - 1

  return (
    <ul className="rows">
      {[...elements].reverse().map((el) => {
        const index = elements.indexOf(el)
        const name = el.text.split('\n')[0].trim() || 'Empty text'
        return (
          <li key={el.id} className={'row' + (el.id === selectedId ? ' current' : '') + (el.hidden ? ' off' : '')}>
            <button className="row-name" onClick={() => onSelect(el.id)}>
              {name}
            </button>
            <button className="mini" onClick={() => onMove(el.id, 1)} disabled={index === last} aria-label="Bring forward">
              Up
            </button>
            <button className="mini" onClick={() => onMove(el.id, -1)} disabled={index === 0} aria-label="Send backward">
              Down
            </button>
            <button className="mini" onClick={() => onToggle(el.id)}>
              {el.hidden ? 'Show' : 'Hide'}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default Layers
