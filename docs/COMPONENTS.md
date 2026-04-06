# Component Reference

Full reference for every module in `src/`. Each section covers the class or object's public interface - what it exposes and how to use it.

---

## constants.js

Not a class - a set of named exports used across every other module. All game tuning happens here.

### Grid and Board

| Export | Value | Description |
|---|---|---|
| `GRID_COLS` | `30` | Number of columns in the grid |
| `GRID_ROWS` | `24` | Number of rows in the grid |
| `CELL_SIZE` | `28` | Pixel width and height of each grid cell |
| `BOARD_WIDTH` | `840` | Canvas pixel width (GRID_COLS × CELL_SIZE) |
| `BOARD_HEIGHT` | `672` | Canvas pixel height (GRID_ROWS × CELL_SIZE) |

### Timing

| Export | Value | Description |
|---|---|---|
| `TICK_MS` | `140` | Milliseconds between each snake step |
| `LOOP_TICKS` | `100` | Ticks before a ghost is spawned |
| `MAX_GHOSTS` | `4` | Maximum simultaneous ghost snakes |

### Directions

`DIR` - an object mapping direction names to `{ x, y }` deltas:

```js
DIR.UP    = { x:  0, y: -1 }
DIR.DOWN  = { x:  0, y:  1 }
DIR.LEFT  = { x: -1, y:  0 }
DIR.RIGHT = { x:  1, y:  0 }
```

`OPPOSITE` - maps each direction name to its reverse. Used to prevent 180° turns:

```js
OPPOSITE.UP    = 'DOWN'
OPPOSITE.DOWN  = 'UP'
OPPOSITE.LEFT  = 'RIGHT'
OPPOSITE.RIGHT = 'LEFT'
```

### State Names

```js
STATE.MENU      = 'MENU'
STATE.RUNNING   = 'RUNNING'
STATE.PAUSED    = 'PAUSED'
STATE.GAME_OVER = 'GAME_OVER'
```

### Colors

`COLORS` - an object with named color values used throughout the renderer. Key entries:

| Key | Value | Used for |
|---|---|---|
| `background` | `#08080f` | Canvas fill |
| `gridLine` | `#12122a` | Subtle grid lines |
| `snakeHead` | `#39ff14` | Player head (neon green) |
| `snakeBody` | `#2adb0e` | Player body |
| `foodCore` | `#ff4444` | Food circle center |
| `ghostPalette` | Array of 4 entries | Ghost body color and alpha per slot |
| `uiText` | `#e0e0ff` | General HUD text |
| `uiAccent` | `#39ff14` | Highlighted UI text |
| `timerWarning` | `#ffaa00` | Loop timer color when near spawn |

Each ghost palette entry: `{ body: string, alpha: number }`.

---

## InputHandler

Listens for `keydown` events and exposes a clean consume-based API. The game calls consume methods each tick or frame and gets back what was pressed since the last call.

### Constructor

```js
new InputHandler()
```

Attaches a `keydown` listener to `window` immediately.

### Public Methods

| Method | Returns | Description |
|---|---|---|
| `consumeNextDirection(currentDirName)` | `string` or `null` | Returns the next queued direction that is not a 180° reversal, or `null` if queue is empty |
| `consumePause()` | `boolean` | `true` once per P/Escape press, then `false` until pressed again |
| `consumeRestart()` | `boolean` | `true` once per R/Enter/Space press |
| `consumeStart()` | `boolean` | `true` once per Enter/Space press |

**Direction queue:** Up to 2 direction names are buffered between ticks. This prevents missed inputs during fast directional changes. Directions that would cause a 180° reversal are discarded when consumed.

### Key Bindings

| Keys | Action |
|---|---|
| Arrow Up, W | Enqueue `'UP'` |
| Arrow Down, S | Enqueue `'DOWN'` |
| Arrow Left, A | Enqueue `'LEFT'` |
| Arrow Right, D | Enqueue `'RIGHT'` |
| P, Escape | Set pause flag |
| R | Set restart flag |
| Enter, Space | Set start and restart flags |

---

## Recorder

Accumulates snapshots of the snake's state every tick. When a loop interval ends, the recording is sealed and returned as a plain array for a `GhostSnake` to consume.

### Constructor

```js
new Recorder()
```

### Public Methods

| Method | Returns | Description |
|---|---|---|
| `record(positions, directionName)` | `void` | Appends a snapshot to the current recording |
| `seal()` | `Array` | Returns the full snapshot array and resets the recorder |
| `reset()` | `void` | Discards the current recording without returning it |

### Properties

| Property | Type | Description |
|---|---|---|
| `tickCount` | `number` (getter) | Number of snapshots in the current recording |

### Snapshot Format

Each entry in the returned array:

```js
{
  positions: [ { x: number, y: number }, ... ],   // shallow copy of snake positions
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
}
```

---

## Snake

Manages the player snake's position array, current direction, and pending growth.

### Constructor

```js
new Snake()
```

Calls `reset()` internally.

### Public Methods

| Method | Returns | Description |
|---|---|---|
| `reset()` | `void` | Restores the snake to starting state (center, 3 cells, facing right) |
| `setDirection(dirName)` | `void` | Sets the current direction name (`'UP'`, etc.) |
| `step()` | `boolean` | Advances one cell. Returns `false` if the move causes a wall or self-collision |
| `grow()` | `void` | Queues one cell of growth (applied on next step) |
| `occupies(x, y)` | `boolean` | Returns `true` if any part of the snake is at grid position (x, y) |

### Properties

| Property | Type | Description |
|---|---|---|
| `positions` | `Array<{x, y}>` | Current grid positions, head at index 0 |
| `directionName` | `string` | Current direction: `'UP'`, `'DOWN'`, `'LEFT'`, or `'RIGHT'` |
| `head` | `{x, y}` (getter) | Shorthand for `positions[0]` |
| `length` | `number` (getter) | Current snake length |

### Self-Collision Handling

When `_pendingGrowth > 0`, the tail cell is included in the collision check during `step()`. This prevents the head from landing on a cell the tail is about to vacate - which would not be a real collision in normal Snake.

---

## GhostSnake

Replays a sealed recording from `Recorder`. Advances one step per tick via a simple playhead index.

### Constructor

```js
new GhostSnake(recording, colorIndex)
```

| Parameter | Type | Description |
|---|---|---|
| `recording` | `Array` | The sealed snapshot array from `Recorder.seal()` |
| `colorIndex` | `number` | Index into `COLORS.ghostPalette` for rendering |

### Public Methods

| Method | Returns | Description |
|---|---|---|
| `step()` | `void` | Advances the playhead by one. Sets `isFinished = true` when the recording ends |
| `occupies(x, y)` | `boolean` | `true` if the ghost's current positions include (x, y) |

### Properties

| Property | Type | Description |
|---|---|---|
| `positions` | `Array<{x, y}>` | Current displayed positions (read from recording) |
| `colorIndex` | `number` | Palette index |
| `isFinished` | `boolean` | `true` when the recording has been fully played |
| `playhead` | `number` | Current index into the recording array |

---

## Food

Manages the single food item on the board.

### Constructor

```js
new Food()
```

### Public Methods

| Method | Returns | Description |
|---|---|---|
| `spawn(snake, ghosts)` | `void` | Places food on a random empty cell (not occupied by snake or any ghost) |
| `isEatenBy(snake)` | `boolean` | `true` if the snake's head is on the food cell |
| `tick()` | `void` | Increments `animationTick` by 1 for use in the pulse animation |

### Properties

| Property | Type | Description |
|---|---|---|
| `position` | `{x, y}` | Current grid position of the food |
| `animationTick` | `number` | Frame counter - incremented every render frame, used to calculate pulse radius |

### Spawn Algorithm

Builds a list of every empty grid cell (not occupied by snake or any ghost), then picks one at random. This is O(GRID_COLS × GRID_ROWS) but avoids the unbounded retry loop of a naive random-then-check approach.

---

## Renderer

Draws everything. Takes data in, produces canvas output. Never modifies any game state.

### Constructor

```js
new Renderer(canvas)
```

Sets `canvas.width = BOARD_WIDTH` and `canvas.height = BOARD_HEIGHT`.

### Public Methods

| Method | Description |
|---|---|
| `drawGame(snake, ghosts, food, score, loopTick, spawnFlash)` | Full game frame: background, grid, food, ghosts, snake, HUD, optional spawn flash |
| `drawMenu()` | Title screen |
| `drawPaused()` | Pause overlay (drawn on top of a `drawGame` call) |
| `drawGameOver(score, ghostCount)` | Game over overlay with score summary |

### Private Helpers

| Method | Description |
|---|---|
| `_clearBackground()` | Fills canvas with background color |
| `_drawGrid()` | Draws 0.5px grid lines across the board |
| `_drawSnake(snake)` | Draws each segment; head gets a brighter glow |
| `_drawGhosts(ghosts)` | Draws all non-finished ghosts with palette color and alpha |
| `_drawFood(food)` | Draws a radial gradient circle with oscillating radius |
| `_drawHUD(score, loopTick)` | Score (top left) and loop counter (top right) |
| `_fillCell(gridX, gridY, inset)` | Fills one grid cell with an inset gap for visual separation |
| `_drawOverlay(opacity)` | Semi-transparent black rectangle over the full canvas |

### Draw Order

Layers are drawn in this order to produce correct visual stacking:

```
1. Background (solid dark fill)
2. Grid lines
3. Food (drawn below everything so ghosts can overlap it)
4. Ghosts (semi-transparent, drawn below the player)
5. Player snake (drawn on top so it is always visible)
6. HUD text (always on top)
7. Spawn flash text (conditional, top of stack)
```

---

## Game

The central coordinator. Owns all game state and runs the main loop.

### Constructor

```js
new Game(canvas)
```

Creates all subsystems, starts the `requestAnimationFrame` loop immediately.

### Public Methods

| Method | Description |
|---|---|
| `start()` | Resets all state and transitions to `STATE.RUNNING` |
| `reset()` | Resets snake, recorder, ghosts, score, and timing without changing state |

### Internal Methods

| Method | Description |
|---|---|
| `_loop(timestamp)` | Called by `requestAnimationFrame`. Drives timing, input, ticks, and render. |
| `_handleStateInput()` | Reads input flags and applies state transitions |
| `_tick()` | One logic step: input → record → move → collide → eat → loop check |
| `_spawnGhost()` | Seals the recorder and creates a new `GhostSnake` |
| `_render()` | Dispatches to the correct renderer method based on current state |

### State Properties

| Property | Type | Description |
|---|---|---|
| `state` | `string` | Current state (`STATE.*`) |
| `score` | `number` | Food eaten this run |
| `loopTick` | `number` | Ticks elapsed in the current loop interval (0–99) |
| `totalGhosts` | `number` | Total ghosts spawned since game start |
| `spawnFlash` | `number` | Counts down from 40 to 0 after each ghost spawn |
| `ghosts` | `Array<GhostSnake>` | All currently active ghost snakes |
