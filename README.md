# Margin

A small typography playground. Add text, rules and blocks to a poster, move and style them, and export the result as a PNG.

## Run it

You need Node 20 or newer.

```
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173).

To make a production build:

```
npm run build
npm run preview
```

## What it does

- Add text, pictures, thin rules and solid blocks. Drag them around, or use the handles on a selected item to resize it and turn it (hold Shift for 15° steps).
- Shift-click or Ctrl/Cmd A selects several items, and they move, style, duplicate and delete together.
- Text snaps to the centre and a 40px margin while dragging. Turn on the Grid button to show a grid and snap to it as well. Hold Alt to move freely.
- Style tab: font, size, spacing, weight, italic, uppercase, color, rotation, highlight, alignment, and poster format and background.
- Layers tab: select, reorder and hide items.
- Posters tab: keep named posters in your browser.
- Add PNG or JPEG pictures with the Image button, by dragging them onto the poster, or by pasting. Pictures are shrunk to fit in your browser's storage, and they resize from the corners so they keep their proportions.
- Export as PNG or JPG at 1x, 2x or 3x. PNG can have a transparent background.
- Undo and redo, plus Save and Restore for one quick slot. Shortcuts are listed in the Style tab when nothing is selected.

## Notes

- Everything is saved in your browser's localStorage. Nothing is sent anywhere.
- Fonts come from Google Fonts, so you need to be online the first time for them to show up.

## Files

- `src/App.jsx` holds the state, undo/redo, saving, adding images and keyboard shortcuts
- `src/Toolbar.jsx` is the top bar
- `src/Canvas.jsx` draws the poster, the grid, and handles dragging, resizing and rotating
- `src/Properties.jsx` is the Style tab
- `src/Layers.jsx` and `src/Library.jsx` are the other two tabs
- `src/starters.js` has the starter posters and tidies up saved items
- `src/images.js` reads and shrinks pictures you add
- `src/exportPng.js` draws the poster to a canvas and downloads it
- `src/constants.js` has shared sizes and fonts

## License

MIT. See the LICENSE file.
