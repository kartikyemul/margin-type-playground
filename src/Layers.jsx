function labelFor(el) {
  if (el.type === 'shape') return el.kind === 'rule' ? 'Rule' : 'Block'
  return el.text.split('\n')[0].trim() || 'Empty text'
}

function Layers({ elements, selectedIds, onSelect, onToggle, onMove }) {
  if (elements.length === 0) {
    return <p className="hint">Nothing here yet. Add some text, a rule or a block from the toolbar.</p>
  }

  const last = elements.length - 1

  return (
    <>
      <p className="hint small top">Shift-click to select several.</p>
      <ul className="rows">
        {[...elements].reverse().map((el) => {
          const index = elements.indexOf(el)
          const current = selectedIds.includes(el.id)
          return (
            <li key={el.id} className={'row' + (current ? ' current' : '') + (el.hidden ? ' off' : '')}>
              <button className="row-name" onClick={(e) => onSelect(el.id, e.shiftKey)}>
                {labelFor(el)}
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
    </>
  )
}

export default Layers
