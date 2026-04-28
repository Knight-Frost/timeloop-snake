# Time Loop Snake

A browser-based Snake game with one twist: every 14 seconds, a ghost of your past self appears on the board and replays your exact movements. Survive your own history.

---

## What Makes It Different

Classic Snake ends when you run into a wall or your own tail. In Time Loop Snake, a third threat builds over time: ghost snakes. Each ghost is a perfect recording of where you were and how you moved during the previous loop interval. As the game goes on, more ghosts accumulate, and the board fills with traces of your past. The longer you survive, the more dangerous your own history becomes.

---

## Features

| Feature | Description |
|---|---|
| Classic Snake mechanics | Grid movement, food collection, wall and self-collision |
| Time-loop recording | Every tick of movement is recorded and sealed at loop end |
| Ghost replay | Past movement paths replay as semi-transparent ghost snakes |
| Multiple simultaneous ghosts | Up to 4 ghosts on the board at once |
| Loop timer HUD | Top-right counter shows time remaining before next ghost spawn |
| Warning indicator | Timer turns amber when a ghost spawn is 20 ticks away |
| Ghost spawn flash | "GHOST SPAWNED" text briefly appears on screen at each spawn |
| Input buffering | Queues up to 2 direction presses between ticks - no missed inputs |
| Pause and restart | Full game state control at any point |
| Pulsing food | Food radius oscillates each render frame for visual clarity |
| Neon visual theme | Dark background, glowing snake, ghost trails, radial food glow |

---

## Quick Start

These docs cover the standalone Canvas game module that lives at `client/public/game/` inside the Time Loop Snake platform. To run the full platform locally see the root SETUP_GUIDE.md. The game itself is served as static assets by Vite in development and Nginx in production. It can also be opened standalone by running a local HTTP server in `client/public/game/` (`python3 -m http.server 8765`) and visiting `http://localhost:8765`.

---

## Controls

| Key | Action |
|---|---|
| Arrow Keys or WASD | Move the snake |
| P or Escape | Pause / Resume |
| R | Restart |
| Enter or Space | Start (from menu) / Restart (from game over) |

---

## Project Structure

```
client/public/game/
├── index.html
├── styles.css
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

## Documentation Index

| Document | Contents |
|---|---|
| [SETUP.md](SETUP.md) | Installation and running the game |
| [USER_GUIDE.md](USER_GUIDE.md) | How to play, controls, mechanics |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | Code structure, how to modify or extend |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, game loop, data flow |
| [COMPONENTS.md](COMPONENTS.md) | Per-module reference |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common issues and solutions |
| [ROADMAP.md](ROADMAP.md) | Suggested future improvements |
