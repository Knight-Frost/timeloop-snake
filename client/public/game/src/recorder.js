// Records the snake's state every tick so ghosts can replay it later.

export class Recorder {
  constructor() {
    this._snapshots = [];  // [{positions: [{x,y},...], direction: 'UP'}, ...]
  }

  // Call every tick while the player is moving
  record(snakePositions, directionName) {
    this._snapshots.push({
      positions: snakePositions.slice(),  // shallow copy is fine - positions are replaced each tick
      direction: directionName,
    });
  }

  // Returns the full recording and resets for the next loop
  seal() {
    const recording = this._snapshots;
    this._snapshots = [];
    return recording;
  }

  get tickCount() { return this._snapshots.length; }

  reset() { this._snapshots = []; }
}
