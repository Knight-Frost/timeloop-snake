# Developer Guide

---

## Prerequisites

No build tools. No package manager. The entire project is plain JavaScript (ES6 modules) served over HTTP. To run it locally, see [SETUP.md](SETUP.md).

---

## Code Conventions

- All configuration values live in `constants.js`. Nothing else uses magic numbers.
- Each class has one responsibility. Nothing crosses concerns between input, logic, and rendering.
- State is owned by `game.js`. All other modules receive what they need as arguments.
- The renderer is purely a sink - it reads data and draws it. It never writes back.
- Positions are always plain objects `{ x, y }` where `x` is column index and `y` is row index, both zero-based.

---

## File Overview

| File | Responsibility |
|---|---|
| `index.html` | Creates the canvas element and bootstraps the `Game` class |
| `styles.css` | Centers the canvas on the page, adds neon border and glow |
| `src/constants.js` | All configuration: grid dimensions, timing, colors, fonts, state names |
| `src/inputHandler.js` | Listens for keyboard events, buffers direction inputs, exposes consume methods |
| `src/recorder.js` | Accumulates per-tick snapshots of the snake, seals them into a recording |
| `src/snake.js` | Manages the player's position array, direction, and growth |
| `src/ghostSnake.js` | Holds a sealed recording and advances a playhead through it each tick |
| `src/food.js` | Spawns food on random empty cells, drives the pulse animation counter |
| `src/renderer.js` | Draws everything onto the canvas - background, grid, snake, ghosts, food, HUD |
| `src/game.js` | Game loop, state machine, tick logic, ghost spawning - the central coordinator |

---

## How to Modify Common Things

### Change the snake speed

In `src/constants.js`:

```js
export const TICK_MS = 140;  // milliseconds between steps - lower is faster
```

A value around 80–100 is noticeably fast. 200+ starts to feel slow.

### Change how often ghosts spawn

In `src/constants.js`:

```js
export const LOOP_TICKS = 100;  // ticks per loop interval
```

At 140ms per tick, 100 ticks is approximately 14 seconds. Reduce to 60 for a more aggressive game, or raise to 150 for a more relaxed one.

### Change the maximum number of simultaneous ghosts

In `src/constants.js`:

```js
export const MAX_GHOSTS = 4;
```

When this limit is reached, the oldest ghost is dropped when a new one spawns.

### Change ghost colors

In `src/constants.js`, edit the `ghostPalette` array:

```js
ghostPalette: [
  { body: '#4488ff', alpha: 0.55 },  // ghost 1
  { body: '#cc44ff', alpha: 0.55 },  // ghost 2
  { body: '#ffaa00', alpha: 0.55 },  // ghost 3
  { body: '#00ffcc', alpha: 0.55 },  // ghost 4
],
```

`body` is any CSS color. `alpha` controls transparency (0 = invisible, 1 = fully opaque).

### Change the grid size

In `src/constants.js`:

```js
export const GRID_COLS = 30;
export const GRID_ROWS = 24;
export const CELL_SIZE = 28;  // pixels per cell
```

`BOARD_WIDTH` and `BOARD_HEIGHT` are derived automatically. The canvas resizes to match.

---

## How to Add a New Game Feature

### Example: add a score multiplier

**Step 1 - Add the state to `game.js`**

```js
this.multiplier = 1;
```

**Step 2 - Modify the scoring logic in `game.js._tick()`**

```js
if (this.food.isEatenBy(this.snake)) {
  this.snake.grow();
  this.score += this.multiplier;   // was: this.score++
  this.food.spawn(this.snake, this.ghosts);
}
```

**Step 3 - Pass it to the renderer in `game.js._render()`**

```js
this.renderer.drawGame(this.snake, this.ghosts, this.food, this.score, this.loopTick, this.spawnFlash, this.multiplier);
```

**Step 4 - Display it in `renderer.js._drawHUD()`**

Add a parameter and draw the value using the existing `ctx.fillText` pattern.

---

## How the Ghost System Works (for Developers)

This is the key mechanic. Understanding it makes everything else clear.

**Recording phase:**

Each tick, before the snake moves, `Recorder.record()` is called with the snake's current positions and direction. This appends a snapshot to an internal array.

```js
// in game.js._tick()
this.recorder.record(this.snake.positions, this.snake.directionName);
```

**Seal phase:**

When the loop counter reaches `LOOP_TICKS`, `recorder.seal()` is called. This returns the full array of snapshots and resets the recorder for the next interval.

**Ghost creation:**

A `GhostSnake` is instantiated with the sealed recording. It immediately sets its `positions` to `recording[0].positions` and its `playhead` to 0.

**Ghost playback:**

Each tick, `ghost.step()` is called. This increments `playhead` and updates `positions` to `recording[playhead].positions`. The ghost is always one step behind the player, because player and ghost ticks are interleaved identically.

**Collision checking:**

After the player moves, but before ghosts step, the game checks whether the player's new head position overlaps any ghost's current positions:

```js
for (const ghost of this.ghosts) {
  if (!ghost.isFinished && ghost.occupies(this.snake.head.x, this.snake.head.y)) {
    this.state = STATE.GAME_OVER;
    return;
  }
}
```

---

## Adding a New Screen or State

**Step 1 - Add the state name to `constants.js`**

```js
export const STATE = {
  MENU:      'MENU',
  RUNNING:   'RUNNING',
  PAUSED:    'PAUSED',
  GAME_OVER: 'GAME_OVER',
  MY_NEW_STATE: 'MY_NEW_STATE',   // add here
};
```

**Step 2 - Handle transitions in `game.js._handleStateInput()`**

```js
case STATE.MY_NEW_STATE:
  if (someCondition) this.state = STATE.RUNNING;
  break;
```

**Step 3 - Add a draw method to `renderer.js`**

```js
drawMyNewScreen() {
  this._drawOverlay();
  // ...draw your content...
}
```

**Step 4 - Call it from `game.js._render()`**

```js
case STATE.MY_NEW_STATE:
  this.renderer.drawMyNewScreen();
  break;
```

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| Full position snapshots in recorder | Simpler replay logic - no re-simulation needed. Ghost reads positions directly. |
| Fixed-timestep accumulator | Consistent game speed across all hardware and frame rates |
| Input direction queue (max 2) | Prevents dropped inputs on fast turns without enabling abuse of buffering |
| Food spawns from empty-cell list | Avoids infinite retry loops on a nearly-full board |
| Ghost cap with oldest-removal | Keeps the game playable - too many ghosts would make survival impossible |
| `constants.js` as single config source | One place to tune gameplay; no magic numbers scattered through logic files |
