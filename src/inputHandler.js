// Handles keyboard input. Queues up to 2 direction changes so fast taps aren't lost.

import { OPPOSITE } from './constants.js';

export class InputHandler {
  constructor() {
    this._queue = [];          // Buffered direction names (max 2)
    this._pausePressed   = false;
    this._restartPressed = false;
    this._startPressed   = false;
    this._attachListeners();
  }

  // Returns the next valid queued direction, skipping any 180° reversals.
  consumeNextDirection(currentDirName) {
    while (this._queue.length > 0) {
      const next = this._queue.shift();
      if (next !== OPPOSITE[currentDirName]) return next;
    }
    return null;
  }

  consumePause()   { const v = this._pausePressed;   this._pausePressed   = false; return v; }
  consumeRestart() { const v = this._restartPressed; this._restartPressed = false; return v; }
  consumeStart()   { const v = this._startPressed;   this._startPressed   = false; return v; }

  _attachListeners() {
    window.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':    case 'w': case 'W': this._enqueue('UP');    break;
        case 'ArrowDown':  case 's': case 'S': this._enqueue('DOWN');  break;
        case 'ArrowLeft':  case 'a': case 'A': this._enqueue('LEFT');  break;
        case 'ArrowRight': case 'd': case 'D': this._enqueue('RIGHT'); break;
        case 'p': case 'P': case 'Escape': this._pausePressed   = true; break;
        case 'r': case 'R':                this._restartPressed = true; break;
        case 'Enter': case ' ':
          this._startPressed   = true;
          this._restartPressed = true;
          break;
      }
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
        e.preventDefault();
      }
    });
  }

  _enqueue(dirName) {
    if (this._queue.length < 2) this._queue.push(dirName);
  }
}
