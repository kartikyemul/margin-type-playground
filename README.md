# Margin

A small typography playground for making editorial posters and zine-style layouts in the browser. Add text, pictures, rules and blocks to a canvas, move and style them, then export the result as a PNG or JPG.

Everything runs in your browser. There is no account, no server and nothing is uploaded anywhere.

## Features

- **Text, pictures, rules and blocks.** Drag to move. Select one item to get handles for resizing and rotating (hold Shift to turn in 15° steps).
- **Pictures.** Add PNG or JPEG files with the Image button, drag them onto the poster, or paste them. They are shrunk when added so a few fit in browser storage, each poster holds about 3 MB of pictures, and a picture can be fitted to or made to fill the poster.
- **Typography.** Five fonts, size, letter and line spacing, weight, italic, uppercase, alignment (including justify), color and highlight. Drag a side handle, or tick Fixed width box, and text wraps inside a box with paragraph spacing.
- **Layout help.** Snap to the centre and margins, an optional grid, align to the poster, multi-select with Shift-click or by dragging a box, and layers you can reorder or hide.
- **Posters.** Presets for portrait, square, landscape, story, phone wallpaper, Instagram and A4 or A3, or any size from 200 to 2000 px. Plus a background color, starter compositions, undo and redo, and named posters saved in your browser.
- **Nothing gets lost.** Your work is autosaved as you go and comes back when you reopen the page, and recent versions are kept so you can go back (Posters tab).
- **Zoom and pan.** Zoom buttons, Fit and 100%, Ctrl + scroll or a pinch, and hold Space and drag to move around.
- **Lock and group.** Lock an item so it can't be grabbed or moved, and group items so they select and move together.
- **Export.** PNG or JPG at 1×, 2× or 3×, with an optional transparent PNG background. Editor controls never appear in the export.

## Getting started

You need Node 20 or newer.

```
git clone https://github.com/YOUR-USERNAME/margin-type-playground.git
cd margin-type-playground
npm install
npm run dev
```

Open the address Vite prints, usually http://localhost:5173. To try it on a phone on the same Wi-Fi, run `npm run dev -- --host` and open the Network address.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Make a production build in `dist` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the unit tests |

## Keyboard shortcuts

On a Mac, use Cmd instead of Ctrl.

| Keys | Action |
| --- | --- |
| `T` | Add text |
| `Tab` / `Shift Tab` | Move between items on the poster |
| `Space` | Select the focused item (with Shift, add it to the selection) |
| `Enter` | Edit the focused text |
| `Ctrl A` | Select everything |
| `L` | Lock or unlock the selection |
| `Ctrl G` / `Ctrl Shift G` | Group, ungroup |
| `0` / `1` | Fit the poster, or zoom to 100% |
| `Ctrl` + scroll | Zoom |
| `Space` + drag | Pan around when zoomed in |
| `Arrow keys` | Nudge (Shift moves further, or a full grid step when snapping) |
| `+` / `-` | Make the selection larger or smaller |
| `R` / `Shift R` | Rotate by 15° |
| `[` / `]` | Send backward, bring forward |
| `Ctrl D` | Duplicate |
| `Delete` | Remove |
| `Ctrl Z` / `Ctrl Shift Z` | Undo, redo |
| `Ctrl S` | Save to the quick slot |
| `Esc` | Deselect |
| `Alt` while dragging | Move without snapping |

## Accessibility

- Every item on the poster can be reached with Tab, is announced with a name, and can be moved, resized, rotated, reordered and removed from the keyboard. The mouse handles have keyboard equivalents in the Size buttons, the Rotation slider and the shortcuts above.
- Buttons, sliders, toggles and color swatches have labels. Related buttons are grouped, and the side panel uses proper tabs with arrow-key navigation.
- Action messages ("Saved", "Aligned") are announced politely to screen readers.
- Focus is always visible, and there is no animation.

This has been checked with automated and manual tests, but not with a full audit by assistive technology users. Reports and fixes are welcome.

## How it's put together

```
src/
  App.jsx          state, undo and redo, saving, adding pictures, shortcuts
  Toolbar.jsx      the top bar
  Canvas.jsx       the poster: dragging, handles, grid, selection box
  Properties.jsx   the Style tab
  Layers.jsx       the Layers tab
  Library.jsx      the Posters tab
  starters.js      starter posters, and tidying of every saved item
  doc.js           cleaning up saved posters
  geometry.js      snapping, fitting, scaling and zoom maths
  layout.js        where text lines break (shared by the screen and the export)
  versions.js      the recent-versions list
  images.js        reading and shrinking pictures, and the size budget
  exportPng.js     draws the poster to a canvas and downloads it
  constants.js     sizes, fonts and defaults
test/              unit tests
```

The poster is plain data: a list of items plus a few poster settings. Each change makes a new copy of that data, which is what undo and redo step through. The PNG and JPG export redraws that same data on an HTML canvas, so it matches what you see without copying the screen.

Anything read back from storage is cleaned before use (colors, numbers, fonts and picture data are checked), so a damaged save can't break the editor.

## Tests

```
npm test
```

This uses Node's built-in test runner, so there is nothing extra to install. The tests cover the geometry maths, text wrapping and justifying, the cleaning of saved data, groups, the starter posters, the picture budget and the version history. The interface itself is checked by hand. A quick pass after a change:

1. Add text, a picture, a rule and a block, then drag, resize and rotate each.
2. Drag a box over several items, move them together, then undo.
3. Turn on Grid and drag with and without Alt held.
4. Export a PNG and a JPG and open them.
5. Make a change, wait a couple of seconds, reload the page and check the poster comes back on its own.
   Then load a starter and use Go back in the Posters tab.
6. Use only the keyboard to select an item, nudge it, resize it and delete it.

## Contributing

Issues and pull requests are welcome. Please keep it small and dependency-light: plain JavaScript, React and plain CSS, no extra libraries unless there is a strong reason. Before opening a pull request, run `npm test` and `npm run build`.

## License

MIT. See [LICENSE](LICENSE).
