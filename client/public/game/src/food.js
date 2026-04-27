// Food - spawns on a random empty cell, pulses visually via animationTick.

import { GRID_COLS, GRID_ROWS } from './constants.js';

export class Food {
  constructor() {
    this.position = { x: 0, y: 0 };
    this.animationTick = 0;  // Incremented each render frame for pulsing effect
  }

  // Place food somewhere that isn't occupied by the snake or any ghost
  spawn(snake, ghosts) {
    const empty = [];

    for (let x = 0; x < GRID_COLS; x++) {
      for (let y = 0; y < GRID_ROWS; y++) {
        if (snake.occupies(x, y)) continue;
        if (ghosts.some(g => g.occupies(x, y))) continue;
        empty.push({ x, y });
      }
    }

    if (empty.length === 0) return;  // Board is completely full - shouldn't happen

    this.position = empty[Math.floor(Math.random() * empty.length)];
  }

  // Returns true if the snake's head is on the food
  isEatenBy(snake) {
    return snake.head.x === this.position.x &&
           snake.head.y === this.position.y;
  }

  tick() {
    this.animationTick++;
  }
}
