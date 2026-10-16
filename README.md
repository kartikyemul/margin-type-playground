# Margin

A small typography playground. Add text to a poster, move it around, style it, and export the result as a PNG.

## Run it

You need Node 18 or newer.

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

## Notes

- Save and Restore use your browser's localStorage. Your last saved poster also loads when you reopen the app.
- Fonts come from Google Fonts, so you need to be online the first time for them to show up.
- Shortcuts are listed in the side panel when nothing is selected.

## Files

- `src/App.jsx` holds the state, undo/redo, saving and keyboard shortcuts
- `src/Toolbar.jsx` is the top bar
- `src/Canvas.jsx` draws the poster and handles dragging
- `src/Properties.jsx` is the side panel for the selected text
- `src/starters.js` has the starter posters
- `src/exportPng.js` draws the poster to a canvas and downloads it
- `src/constants.js` has shared sizes and fonts
