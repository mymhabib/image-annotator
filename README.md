# Image Annotator

A lightweight, single-file screenshot annotator that runs entirely in your browser. Paste a screenshot, mark it up, and copy it back to your clipboard. Built for support work and documentation.

**No install, no extension, no server, no uploads.** Everything happens locally in the page, and the app makes no network requests.

## Features

- **Arrows, boxes and numbered callouts**, each with its own color
- **Pixelate** and **smooth blur** for hiding sensitive information
- **Crop**
- Click any shape at any time to move it or resize it with handles
- Adjustable line thickness, arrow head size and number size (slider, typed %, reset)
- Sharp on Retina displays, exported at the image's full resolution
- Undo (up to 100 steps, including crops)
- Copy to clipboard, save as PNG, or open in a new tab

## Usage

1. Take a screenshot (for example `⌘ + Shift + 5` on macOS).
2. Open `index.html` in your browser (or the hosted page, see below).
3. Paste with `⌘V` / `Ctrl+V`. You can also drag an image onto the page or use the open button.
4. Annotate.
5. Copy with `⌘C` / `Ctrl+C` and paste it wherever you need it.

Open it in as many tabs as you like. Each tab keeps its own image and history.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page markup |
| `style.css` | Styles |
| `app.js` | All the app logic |
| `favicon.svg` | Tab icon |

Keep these files together in the same folder. Opening `index.html` locally works without a server.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `V` | Select tool |
| `A` | Arrow |
| `R` | Box |
| `B` | Pixelate |
| `G` | Smooth blur |
| `N` | Numbered callout |
| `C` | Crop (`Enter` applies, `Esc` cancels) |
| `⌘Z` / `Ctrl+Z` | Undo |
| `⌘C` / `Ctrl+C` | Copy image |
| `⌘S` / `Ctrl+S` | Save PNG |
| `Delete` / `Backspace` | Delete the selected shape |
| `Esc` | Deselect |
| `Shift` (while drawing an arrow) | Snap to 45° steps |
| `Alt` / `Option` (while dragging) | Draw a new shape on top of an existing one |

## Notes

- **Pixelate vs. smooth blur:** pixelate hides small text more reliably, so prefer it for passwords, emails and tokens.
- **Small screenshots:** images narrower than 1600px are exported at 2x so annotations stay smooth.
- **Copy to clipboard** needs a browser that allows image clipboard writes (Chrome, Edge and Safari do). If it is blocked, use Save.

## Host it for free with GitHub Pages

1. Go to **Settings → Pages** in this repository.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select the `main` branch and the `/ (root)` folder, then save.
4. After a minute or two the app is live at `https://mymhabib.github.io/<repository-name>/`.

## License

[MIT](LICENSE) © 2026 [mymhabib](https://github.com/mymhabib)
