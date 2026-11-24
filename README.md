# Image Annotator

A simple tool to annotate screenshots right in your browser. Add arrows, boxes, numbered callouts, blur sensitive info, and copy the result.

## Features

- Arrows, boxes, and numbered callouts, each with its own color
- Pixelate and smooth blur to hide sensitive information
- Crop screenshots
- Move and resize shapes anytime
- Adjustable line thickness, arrow size, and number size
- Undo up to 100 steps
- Copy to clipboard, save as PNG, or open in a new tab
- Sharp exports at full image resolution
- Works entirely in your browser. No installation, extensions, server, or uploads.

## How to use

1. Take a screenshot (`⌘ + Shift + 5` on macOS).
2. Open `index.html` in your browser.
3. Paste your screenshot (`⌘V` / `Ctrl+V`).
4. Annotate however you like.
5. Copy (`⌘C` / `Ctrl+C`) or save as PNG.

You can also drag and drop an image or use the Open button.

Each browser tab has its own image and undo history.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `V` | Select tool |
| `A` | Arrow |
| `L` | Line |
| `R` | Box |
| `B` | Pixelate |
| `G` | Smooth blur |
| `N` | Numbered callout |
| `C` | Crop |
| `Enter` | Apply crop |
| `Esc` | Cancel crop / Deselect |
| `⌘Z` / `Ctrl+Z` | Undo |
| `⌘C` / `Ctrl+C` | Copy image |
| `⌘S` / `Ctrl+S` | Save PNG |
| `Delete` / `Backspace` | Delete selected shape |
| `Shift` (while drawing an arrow) | Snap to 45° steps |
| `Alt` / `Option` (while dragging) | Draw over an existing shape |