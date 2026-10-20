import { describe } from './starters.js'

function Layers({ elements, selectedIds, onSelect, onToggle, onMove }) {
  if (elements.length === 0) {
    return <p className="hint">Nothing here yet. Add some text, an image, a rule or a block from the toolbar.</p>
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
              <button className="row-name" aria-pressed={current} onClick={(e) => onSelect(el.id, e.shiftKey)}>
                {describe(el)}
              </button>
              <button className="mini" onClick={() => onMove(el.id, 1)} disabled={index === last} aria-label={'Bring ' + describe(el) + ' forward'}>
                Up
              </button>
              <button className="mini" onClick={() => onMove(el.id, -1)} disabled={index === 0} aria-label={'Send ' + describe(el) + ' backward'}>
                Down
              </button>
              <button className="mini" aria-label={(el.hidden ? 'Show ' : 'Hide ') + describe(el)} onClick={() => onToggle(el.id)}>
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
