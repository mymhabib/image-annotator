# Image Annotator

A lightweight, single-file screenshot annotator that runs entirely in your browser. Paste a screenshot, mark it up, and copy it back to your clipboard. Built for support work and documentation.

**No install, no extension, no server, no uploads.** Everything happens locally in the page, and the app makes no network requests.

## Features

- **Arrows, lines, boxes and numbered callouts**, each with its own color and its own thickness setting
- **Pixelate** and **smooth blur** for hiding sensitive information
- **Crop**
- Click any shape at any time to move it or resize it with handles
- Adjustable thickness, arrow head size and number size (slider, typed %, reset)
- Paste another image onto your screenshot (movable, resizable layer), and copy/paste shapes
- Sharp on Retina displays, exported at the image's full resolution
- Undo (up to 100 steps, including crops)
- Copy to clipboard, save as PNG, or open in a new tab

## Usage

1. Take a screenshot (for example `⌘ + Shift + 5` on macOS).
2. Open `index.html` in your browser (or the hosted page, see below).
3. Paste with `⌘V` / `Ctrl+V`. You can also drag an image onto the page or use the open button.
4. Annotate.
5. Click the copy button in the toolbar (or press `⌘C` / `Ctrl+C` with nothing selected) to copy the annotated image, then paste it wherever you need it.

Open it in as many tabs as you like. Each tab keeps its own image and history.

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
| `C` | Crop (`Enter` applies, `Esc` cancels) |
| `⌘Z` / `Ctrl+Z` | Undo |
| `⌘C` / `Ctrl+C` | Copy the selected shape (copies the whole image if nothing is selected) |
| `⌘V` / `Ctrl+V` | Paste a screenshot (first time), then paste a copied shape or another image onto it |
| `⌘⇧V` / `Ctrl+Shift+V` | Replace the current image with the clipboard image |
| `⌘S` / `Ctrl+S` | Save PNG |
| `Delete` / `Backspace` | Delete the selected shape |
| Arrow keys | Nudge the selected shape (`Shift` = 10x) |
| `Esc` | Deselect |
| `Shift` (while drawing an arrow or line) | Snap to 45° steps |
| `Alt` / `Option` (while dragging) | Draw a new shape on top of an existing one |

## Notes

- **Pixelate vs. smooth blur:** pixelate hides small text more reliably, so prefer it for passwords, emails and tokens.
- **Small screenshots:** images narrower than 1600px are exported at 2x so annotations stay smooth.
- **Copy to clipboard** needs a browser that allows image clipboard writes (Chrome, Edge and Safari do). If it is blocked, use Save.