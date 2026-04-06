// Player snake: manages position array, direction, and growth.

import { DIR, GRID_COLS, GRID_ROWS } from './constants.js';

export class Snake {
  constructor() {
    this.reset();
  }

  reset() {
    // Start in the middle of the grid, facing right, 3 cells long
    const startX = Math.floor(GRID_COLS / 2);
    const startY = Math.floor(GRID_ROWS / 2);
    this.positions = [
      { x: startX,     y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    this.directionName = 'RIGHT';
    this._pendingGrowth = 0;
  }

  // Apply a new direction (caller already validated it isn't a 180° flip)
  setDirection(dirName) {
    this.directionName = dirName;
  }

  // Advance the snake one cell. Returns false if the snake hit a wall or itself.
  step() {
    const delta = DIR[this.directionName];
    const head  = this.positions[0];
    const newHead = { x: head.x + delta.x, y: head.y + delta.y };

    // Wall check
    if (newHead.x < 0 || newHead.x >= GRID_COLS ||
        newHead.y < 0 || newHead.y >= GRID_ROWS) {
      return false;
    }

    // Self-collision check (skip the tail if we're not growing - it's about to move)
    const checkLength = this._pendingGrowth > 0
      ? this.positions.length
      : this.positions.length - 1;

    for (let i = 0; i < checkLength; i++) {
      if (this.positions[i].x === newHead.x && this.positions[i].y === newHead.y) {
        return false;
      }
    }

    // Move: prepend new head
    this.positions.unshift(newHead);

    // Either grow or slide the tail
    if (this._pendingGrowth > 0) {
      this._pendingGrowth--;
    } else {
      this.positions.pop();
    }

    return true;
  }

  // Queue up a growth (called when food is eaten)
  grow() {
    this._pendingGrowth++;
  }

  get head() { return this.positions[0]; }
  get length() { return this.positions.length; }

  // Check whether this snake occupies a given grid cell
  occupies(x, y) {
    return this.positions.some(p => p.x === x && p.y === y);
  }
}
