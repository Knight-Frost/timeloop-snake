# Roadmap

Suggested improvements organized by category. Each item notes what would need to change in the codebase.

---

## Gameplay

### Difficulty Scaling

Currently the game stays at the same speed indefinitely. Increasing difficulty over time would make runs feel progressive.

Options:
- Decrease `TICK_MS` slightly every N food items eaten (faster snake)
- Decrease `LOOP_TICKS` after each ghost spawn (more frequent spawns)
- Both combined: speed and spawn rate ramp together

Implementation: add a `difficultyLevel` counter to `Game`; update `TICK_MS` equivalent dynamically rather than reading from constants.

---

### Grace Period After Ghost Spawn

At the moment a ghost appears, it starts in the same position the player was in 14 seconds ago. If the player happens to be near that position, the collision can feel unfair.

A short invincibility window (2–3 ticks) immediately after each spawn would give the player time to react. This would require a `spawnInvincible` countdown in `Game._tick()` checked before the ghost collision loop.

---

### Ghost Fade-Out Instead of Hard Disappearance

When a ghost's recording ends, it simply disappears. A gradual alpha fade over the final 10–15 ticks would make the disappearance feel more intentional.

Implementation: add a `fadeTicksRemaining` property to `GhostSnake`; pass it to the renderer to reduce `globalAlpha` proportionally as the ghost nears its end.

---

### Speed Boost Power-Up

A second type of collectible that temporarily increases tick speed could add variety. The food system is minimal and easy to extend: add a `SpecialFood` class that inherits or mirrors `Food`, and check for it separately in `Game._tick()`.

---

## Persistence

### High Score via localStorage

Storing the best score between sessions requires two lines of code:

```js
// On game over
localStorage.setItem('highScore', Math.max(score, localStorage.getItem('highScore') ?? 0));

// On render
const highScore = localStorage.getItem('highScore') ?? 0;
```

Display it on the menu screen and game over screen in `Renderer`.

---

### Run Statistics

Storing how many loops the player survived, the maximum ghost count reached, and the highest score per ghost count would give returning players more context about their improvement.

---

## Visual and Audio

### Sound Effects

The game has no audio. A minimal Web Audio API implementation could add:

- A short tone on food collection
- A lower tone on ghost spawn
- A descending tone on game over

No external files required - all can be generated with `AudioContext.createOscillator()`.

---

### Snake Animation Between Ticks

Currently the snake jumps from cell to cell each tick with no in-between animation. Interpolating the snake's visual position between ticks (using the accumulator value as a 0–1 progress factor) would produce smooth, continuous movement.

This requires separating the "logical position" (used for collision) from the "rendered position" (used for drawing) in `Snake`, and passing the interpolation factor to `Renderer`.

---

### Distinct Ghost Head Marker

Ghost heads look similar to ghost bodies (just a slightly stronger glow). A different shape - a small triangle or outlined circle - on ghost heads would make the replay easier to read and follow.

---

### Loop Timer as Visual Bar

The current loop timer is a text counter. Replacing or supplementing it with a thin progress bar along the top edge of the board would make the remaining time glanceable without reading numbers.

---

## Controls and Platform

### Mobile Touch Support

The game has no touch controls. Adding swipe detection via `touchstart` and `touchend` events in `InputHandler` would make it playable on phones, though the canvas would need responsive sizing.

---

### Gamepad Support

The Gamepad API is available in all modern browsers. Adding d-pad and analog stick support to `InputHandler` would require polling `navigator.getGamepads()` each tick rather than listening for events.

---

### Configurable Controls

Letting the player remap keys would require a settings screen and storing the key map in `localStorage`. The `InputHandler` would read the key map at startup instead of hardcoding the switch cases.

---

## Code Quality and Architecture

### Formal State Machine

The current state machine is a switch statement in `_handleStateInput()`. For a larger game with more states and more complex transitions, a dedicated `StateMachine` class with defined transitions would prevent invalid state combinations and make the flow easier to audit.

---

### Event System

As the game grows, passing data between modules via arguments becomes unwieldy. A simple publish/subscribe event bus would allow modules to emit events (`food:eaten`, `ghost:spawned`, `player:died`) and react to them without direct coupling.

---

### Automated Tests

Because each module (Snake, GhostSnake, Recorder, Food, InputHandler) has no browser dependencies, they can be tested with any standard JavaScript test runner. A test suite would catch regressions when tuning timing or collision logic.

Priority test cases:
- `Snake.step()` returns `false` on wall collision at all four edges
- `Snake.step()` returns `false` on self-collision
- `Recorder.seal()` returns the correct number of snapshots
- `GhostSnake` finishes after exactly `recording.length` steps
- `Food.spawn()` never places food on an occupied cell

---

## Summary Table

| Item | Effort | Impact |
|---|---|---|
| High score (localStorage) | Low | Medium |
| Grace period after spawn | Low | High |
| Ghost fade-out | Low | Medium |
| Sound effects | Medium | High |
| Difficulty scaling | Medium | High |
| Loop timer as progress bar | Medium | Medium |
| Smooth snake interpolation | Medium | High |
| Mobile touch support | Medium | High |
| Speed boost power-up | Medium | Medium |
| Gamepad support | Medium | Low |
| Automated tests | High | High (long-term) |
| Formal state machine | High | Low (short-term) |
