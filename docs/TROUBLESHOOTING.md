# Troubleshooting Guide

---

## The Game Does Not Load

**Symptom:** Opening `index.html` directly in a browser shows a blank page or nothing at all.

**Cause:** The game uses ES6 modules (`import` / `export`). Browsers block module loading over the `file://` protocol as a security measure.

**Solution:** Serve the project over HTTP using a local server:

```bash
cd /path/to/Game
python3 -m http.server 8765
```

Then open `http://localhost:8765` in the browser. See [SETUP.md](SETUP.md) for full instructions.

---

## Module Import Error in the Browser Console

**Symptom:** The browser console shows an error like:

```
Cross-Origin Request Blocked
Failed to load module script
```

**Cause:** Same as above - the game is being opened via `file://`.

**Solution:** Use a local HTTP server as described in [SETUP.md](SETUP.md).

---

## The Page Is Blank With No Console Errors

**Symptom:** The page loads over HTTP but shows nothing.

**Steps to check:**

1. Open the browser developer tools (F12 or right-click → Inspect)
2. Check the Console tab for any JavaScript errors
3. Check the Network tab - confirm `game.js`, `renderer.js`, and other `src/` files are loading with status 200

**Common causes:**

| Cause | Fix |
|---|---|
| The server was started in the wrong directory | Stop the server, `cd` into the folder containing `index.html`, then restart |
| A file is missing from `src/` | Compare against the file list in [README.md](README.md) |
| A syntax error in a source file | The console will point to the file and line |

---

## Controls Are Not Responding

**Symptom:** Pressing arrow keys or WASD does nothing.

**Causes and solutions:**

| Cause | Solution |
|---|---|
| Browser focus is on the address bar or another element | Click anywhere on the canvas to give it keyboard focus |
| The game is in the MENU state | Press Enter or Space to start - direction keys do not work on the menu |
| The game is paused | Press P or Escape to resume |
| Arrow keys are scrolling the page instead | The `InputHandler` calls `preventDefault()` on arrow keys - if this is happening, check the console for errors that may have prevented the handler from loading |

---

## The Snake Moves Too Fast or Too Slow

**Symptom:** Movement speed feels wrong.

**Cause:** The `TICK_MS` constant controls speed.

**Solution:** Open `src/constants.js` and adjust:

```js
export const TICK_MS = 140;  // increase to slow down, decrease to speed up
```

Reasonable range: 80ms (fast) to 250ms (slow).

---

## Ghosts Are Not Appearing

**Symptom:** Playing for well over 14 seconds and no ghost has appeared.

**Steps to check:**

1. Watch the loop counter in the top-right corner - it should count up from 000 to 100
2. If the counter is frozen, the game may be paused or stuck in a non-RUNNING state
3. If the counter reaches 100 and resets but no ghost appears, open the console and look for errors in `game.js` around `_spawnGhost()`

**Known edge case:** If the snake dies and the game restarts, the recorder resets. No ghost spawns until the first loop completes on the new run.

---

## Ghost Snakes Are Not Visible

**Symptom:** Ghosts are spawning (flash message appears) but cannot be seen on the board.

**Cause:** Ghost alpha or color values in `constants.js` may have been changed to invisible values.

**Solution:** Restore the default ghost palette in `src/constants.js`:

```js
ghostPalette: [
  { body: '#4488ff', alpha: 0.55 },
  { body: '#cc44ff', alpha: 0.55 },
  { body: '#ffaa00', alpha: 0.55 },
  { body: '#00ffcc', alpha: 0.55 },
],
```

---

## The Game Runs at a Variable Speed After Switching Tabs

**Symptom:** Returning to the game tab after a pause causes the snake to jump or move erratically for a moment.

**Cause:** When a tab is backgrounded, `requestAnimationFrame` is throttled by the browser. When you return, the accumulated elapsed time is large. The game loop fires multiple ticks in rapid succession to catch up.

**This is expected behavior.** The fixed-timestep accumulator is working correctly - it is burning through the backlog of time. After a second or two, the game returns to normal speed.

To avoid this, pause the game (`P`) before switching tabs.

---

## The Canvas Appears Cut Off or Incorrectly Sized

**Symptom:** Part of the board is hidden or the canvas does not fit the window.

**Cause:** Browser zoom level, or a CSS conflict.

**Solutions:**

- Reset browser zoom to 100% (`Ctrl+0` / `Cmd+0`)
- Check that `styles.css` is loading correctly (Network tab in dev tools)
- The canvas is fixed at 840 × 672 pixels. On very small screens it may overflow the viewport - this project is not designed for small displays

---

## A JavaScript Error About a Missing Property

**Symptom:** Console shows something like `Cannot read properties of undefined`.

**Common causes:**

| Error location | Likely cause |
|---|---|
| `ghostSnake.js` | `recording[0]` is undefined - `seal()` was called on an empty recorder |
| `food.js` | `snake` or `ghosts` argument passed to `spawn()` is null |
| `renderer.js` | A method was called with undefined arguments - check `game.js._render()` |

If you have modified any source file, check that all arguments to modified methods are still being passed correctly.
