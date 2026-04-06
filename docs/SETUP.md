# Setup Guide

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Modern browser | Any current version | Chrome, Firefox, Safari, or Edge |
| Python 3 | 3.x | Used only to run a local HTTP server |

No package manager, build tool, or framework is required. The game runs entirely in the browser using standard JavaScript.

---

## Why a Local Server Is Required

The game uses ES6 modules (`import` / `export` statements). Browsers enforce a security rule that blocks module loading over the `file://` protocol. If you open `index.html` by double-clicking it, the game will not load and the browser console will show a CORS or module error.

Running a local HTTP server solves this by serving files over `http://localhost`, which browsers treat as a standard origin.

---

## Running the Game

**Step 1 - Navigate to the project folder**

```bash
cd /path/to/Game
```

**Step 2 - Start a local HTTP server**

Using Python 3 (recommended):

```bash
python3 -m http.server 8765
```

The terminal will show:

```
Serving HTTP on 0.0.0.0 port 8765 (http://0.0.0.0:8765/) ...
```

**Step 3 - Open the game**

Open a browser and go to:

```
http://localhost:8765
```

The menu screen appears immediately. Press Enter or Space to start.

**Step 4 - Stop the server**

Press `Ctrl + C` in the terminal when you are done.

---

## Alternative Servers

If Python is not available, any static file server works:

| Tool | Command |
|---|---|
| Python 3 | `python3 -m http.server 8765` |
| Node.js npx | `npx serve .` |
| VS Code | Install "Live Server" extension, right-click `index.html`, Open with Live Server |
| PHP | `php -S localhost:8765` |

---

## File Structure After Setup

No files are generated or modified by running the game. The project is entirely static.

```
Game/
├── index.html       Open this via the server - do not open directly
├── styles.css
├── docs/
└── src/
    ├── constants.js
    ├── inputHandler.js
    ├── recorder.js
    ├── snake.js
    ├── ghostSnake.js
    ├── food.js
    ├── renderer.js
    └── game.js
```

---

## Common Setup Issues

| Issue | Likely Cause | Solution |
|---|---|---|
| Blank page, no canvas | Opened `index.html` directly via `file://` | Use a local HTTP server as described above |
| "Failed to fetch" or module error in console | Same as above | Start the server and reload |
| Port 8765 already in use | Another process is using the port | Use a different port: `python3 -m http.server 9000` |
| Server starts but browser shows "connection refused" | Firewall or wrong address | Ensure you're visiting `http://localhost:8765`, not `https://` |
| Game loads but controls do nothing | Browser focus is elsewhere | Click on the canvas area once, then use the keyboard |

---

## Browser Compatibility

The game uses only standard browser APIs: Canvas 2D, ES6 modules, `requestAnimationFrame`, and `addEventListener`. All modern browsers support these. Internet Explorer is not supported.
