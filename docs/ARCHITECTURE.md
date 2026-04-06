# Architecture

---

## Overview

The game is structured around three distinct concerns that are kept strictly separate:

- **Logic** - what the game state is and how it changes each tick
- **Rendering** - how the current state is drawn onto the canvas
- **Input** - translating raw keyboard events into actions the game can consume

No module crosses these boundaries. The renderer never modifies game state. The input handler never reads positions. The game logic never touches the canvas.

---

## System Diagram

```
[Keyboard Events]
       |
       v
 [InputHandler]
       |
       | consumeNextDirection()
       | consumePause() / consumeRestart() / consumeStart()
       v
    [Game]  <---------- requestAnimationFrame (60fps)
       |
       |-- each tick (every 140ms):
       |     |
       |     |--> [Snake].step()          move player
       |     |--> [Recorder].record()     snapshot state
       |     |--> [GhostSnake].step()     advance all ghosts
       |     |--> [Food].isEatenBy()      check food collision
       |     |--> [Food].spawn()          respawn if eaten
       |     |--> loop counter check
       |           |
       |           +--> [Recorder].seal()      end interval
       |           +--> new [GhostSnake](...)  spawn ghost
       |
       |-- each render frame (60fps):
             |
             v
         [Renderer]
               |-- drawGame(snake, ghosts, food, score, loopTick, spawnFlash)
               |-- drawMenu() / drawPaused() / drawGameOver()
```

---

## Game Loop

The game uses a fixed-timestep accumulator pattern inside `requestAnimationFrame`.

`requestAnimationFrame` fires approximately 60 times per second. However, the snake should only move every 140 milliseconds - not every frame. The accumulator solves this:

```
each frame:
  accumulator += elapsed time since last frame

  while accumulator >= 140ms:
    run one game tick
    accumulator -= 140ms

  render current state
```

This means:
- On a 60fps display, a tick fires roughly every 8–9 frames
- If the tab is backgrounded and resumes, accumulated time is consumed in rapid ticks to catch up
- Movement speed is consistent regardless of display refresh rate

---

## State Machine

The game has four states. Transitions are driven by input and collision results.

```
          Enter/Space
[MENU] ─────────────> [RUNNING]
                          |
              P/Escape    |    P/Escape
           +──────────────+──────────────+
           |                              |
           v                              v
       [PAUSED] <──────────────────── [PAUSED]
           |
           | R or Enter/Space
           v
       [RUNNING]

[RUNNING] ──(collision)──> [GAME_OVER]
[GAME_OVER] ──(R/Enter/Space)──> [RUNNING]
```

State transitions happen in `Game._handleStateInput()`, which runs every render frame (not every tick). This ensures pause and restart feel instant even between ticks.

---

## Recording System

This is the mechanism behind the time-loop mechanic.

```
Tick 1:  Recorder.record(snake.positions, direction)  --> snapshots[0]
Tick 2:  Recorder.record(snake.positions, direction)  --> snapshots[1]
...
Tick 100: loop counter hits LOOP_TICKS
           recording = Recorder.seal()   <-- snapshots handed off, recorder resets
           GhostSnake(recording, colorIndex) created
           Recorder starts fresh for next interval
```

Each snapshot is a plain object:

```js
{
  positions: [ {x, y}, {x, y}, ... ],  // shallow copy of snake positions array
  direction: 'RIGHT'                    // direction at that tick
}
```

The `positions` array is shallow-copied with `.slice()`. Since Snake rebuilds its positions array each tick (unshift + pop), the previous tick's positions are not mutated, so the shallow copy is safe and avoids unnecessary allocation.

---

## Ghost Lifecycle

```
[Recorder.seal()] --> recording array (100 snapshots)
        |
        v
[new GhostSnake(recording, colorIndex)]
        |
        | playhead = 0
        | positions = recording[0].positions
        |
        | each tick: playhead++
        |            positions = recording[playhead].positions
        |
        | when playhead >= recording.length:
        |   isFinished = true  --> ghost stops moving, stops colliding
        v
[ghost removed from active list on next spawn if MAX_GHOSTS exceeded]
```

A ghost with `isFinished = true` is not drawn and does not register collisions. It remains in the ghosts array until the cap forces it out, which means it does not need explicit cleanup.

---

## Data Flow: Eating Food

```
[Snake.step()] returns true (alive)
       |
[Food.isEatenBy(snake)]  --> head position matches food position?
       |
       yes
       |
[Snake.grow()]           --> _pendingGrowth++
[score++]
[Food.spawn(snake, ghosts)]
       |
       --> builds list of all empty grid cells
       --> picks random cell
       --> food.position updated
```

The growth is deferred. `grow()` increments `_pendingGrowth`. On the next `step()` call, the tail is not removed when `_pendingGrowth > 0`, which causes the snake to appear one cell longer.

---

## Component Dependency Map

```
constants.js  <── imported by everything (no dependencies itself)

inputHandler.js
  └── constants.js (OPPOSITE)

snake.js
  └── constants.js (DIR, GRID_COLS, GRID_ROWS)

recorder.js
  └── (no imports)

ghostSnake.js
  └── (no imports — receives recording data, not module references)

food.js
  └── constants.js (GRID_COLS, GRID_ROWS)

renderer.js
  └── constants.js (CELL_SIZE, BOARD_WIDTH, BOARD_HEIGHT, GRID_COLS,
                    GRID_ROWS, COLORS, FONTS, LOOP_TICKS)

game.js
  └── constants.js (STATE, TICK_MS, LOOP_TICKS, MAX_GHOSTS)
  └── snake.js
  └── ghostSnake.js
  └── food.js
  └── recorder.js
  └── renderer.js
  └── inputHandler.js
```

`game.js` is the only module that holds references to all others. Every other module is standalone and testable in isolation.
