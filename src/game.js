// Main orchestrator: runs the game loop and coordinates all the pieces.

import { STATE, TICK_MS, LOOP_TICKS, MAX_GHOSTS } from './constants.js';
import { Snake }        from './snake.js';
import { GhostSnake }   from './ghostSnake.js';
import { Food }         from './food.js';
import { Recorder }     from './recorder.js';
import { Renderer }     from './renderer.js';
import { InputHandler } from './inputHandler.js';

export class Game {
  constructor(canvas) {
    this.renderer = new Renderer(canvas);
    this.input    = new InputHandler();

    // These get initialized properly in reset()
    this.snake    = new Snake();
    this.food     = new Food();
    this.recorder = new Recorder();
    this.ghosts   = [];

    this.score        = 0;
    this.loopTick     = 0;    // Ticks elapsed in the current loop interval
    this.totalGhosts  = 0;    // Total ghosts spawned (for game-over screen)
    this.spawnFlash   = 0;    // Counts down to 0 after a ghost spawns (drives the flash animation)
    this.state        = STATE.MENU;

    // Fixed-timestep accumulator: ensures the snake moves at a consistent rate
    // regardless of how fast requestAnimationFrame fires.
    this._lastTimestamp = null;
    this._accumulator   = 0;

    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  // ─── Game lifecycle ──────

  start() {
    this.reset();
    this.state = STATE.RUNNING;
  }

  reset() {
    this.snake.reset();
    this.recorder.reset();
    this.ghosts      = [];
    this.score       = 0;
    this.loopTick    = 0;
    this.totalGhosts = 0;
    this.spawnFlash  = 0;
    this._accumulator = 0;
    this._lastTimestamp = null;

    this.food.spawn(this.snake, []);
  }

  // ─── Main loop (called by requestAnimationFrame ~60fps) ───────────────────

  _loop(timestamp) {
    requestAnimationFrame(this._loop);

    // Initialize timing on first frame
    if (this._lastTimestamp === null) {
      this._lastTimestamp = timestamp;
    }

    const delta = timestamp - this._lastTimestamp;
    this._lastTimestamp = timestamp;

    // Food pulses and spawn flash counts down every render frame
    if (this.state === STATE.RUNNING) {
      this.food.tick();
      if (this.spawnFlash > 0) this.spawnFlash--;
    }

    this._handleStateInput();

    if (this.state === STATE.RUNNING) {
      // Accumulate real time; fire one logic tick per TICK_MS elapsed
      this._accumulator += delta;
      while (this._accumulator >= TICK_MS) {
        this._accumulator -= TICK_MS;
        this._tick();
      }
    }

    this._render();
  }

  // ─── Input handling per-frame (menus, pause, restart) ────────────────────

  _handleStateInput() {
    switch (this.state) {
      case STATE.MENU:
        if (this.input.consumeStart()) this.start();
        break;

      case STATE.RUNNING:
        if (this.input.consumePause()) this.state = STATE.PAUSED;
        break;

      case STATE.PAUSED:
        if (this.input.consumePause())   this.state = STATE.RUNNING;
        if (this.input.consumeRestart()) this.start();
        break;

      case STATE.GAME_OVER:
        if (this.input.consumeRestart()) this.start();
        break;
    }
  }

  // ─── One logic tick ───────────────────────────────────────────────────────

  _tick() {
    // Apply any queued player input
    const nextDir = this.input.consumeNextDirection(this.snake.directionName);
    if (nextDir) this.snake.setDirection(nextDir);

    // Record state before moving (captures the position the player is leaving)
    this.recorder.record(this.snake.positions, this.snake.directionName);

    // Move the player snake
    const alive = this.snake.step();
    if (!alive) {
      this.state = STATE.GAME_OVER;
      return;
    }

    // Check ghost collisions
    for (const ghost of this.ghosts) {
      if (!ghost.isFinished && ghost.occupies(this.snake.head.x, this.snake.head.y)) {
        this.state = STATE.GAME_OVER;
        return;
      }
    }

    // Step all ghosts forward in sync with the player
    for (const ghost of this.ghosts) {
      ghost.step();
    }

    // Check if the player ate food
    if (this.food.isEatenBy(this.snake)) {
      this.snake.grow();
      this.score++;
      this.food.spawn(this.snake, this.ghosts);
    }

    // Advance loop timer - spawn a ghost when it completes
    this.loopTick++;
    if (this.loopTick >= LOOP_TICKS) {
      this._spawnGhost();
      this.loopTick = 0;
    }
  }

  // Seal the recording and create a new ghost from it
  _spawnGhost() {
    const recording = this.recorder.seal();
    if (recording.length === 0) return;

    const colorIndex = this.totalGhosts % 4;
    const ghost = new GhostSnake(recording, colorIndex);
    this.ghosts.push(ghost);
    this.totalGhosts++;
    this.spawnFlash = 40;  // ~40 render frames ≈ 0.67s at 60fps

    // Drop the oldest ghost if over the cap
    if (this.ghosts.length > MAX_GHOSTS) {
      this.ghosts.shift();
    }
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  _render() {
    switch (this.state) {
      case STATE.MENU:
        this.renderer.drawMenu();
        break;

      case STATE.RUNNING:
        this.renderer.drawGame(this.snake, this.ghosts, this.food, this.score, this.loopTick, this.spawnFlash);
        break;

      case STATE.PAUSED:
        // Draw the live game underneath, then overlay the pause screen
        this.renderer.drawGame(this.snake, this.ghosts, this.food, this.score, this.loopTick, 0);
        this.renderer.drawPaused();
        break;

      case STATE.GAME_OVER:
        this.renderer.drawGame(this.snake, this.ghosts, this.food, this.score, this.loopTick, 0);
        this.renderer.drawGameOver(this.score, this.totalGhosts);
        break;
    }
  }
}
