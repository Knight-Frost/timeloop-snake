// Ghost snake: replays a sealed recording tick by tick.
// It's just a playhead walking through the snapshot array.

export class GhostSnake {
  // recording: array of {positions, direction} snapshots from Recorder.seal()
  // colorIndex: which palette slot to use for rendering
  constructor(recording, colorIndex) {
    this.recording   = recording;
    this.colorIndex  = colorIndex;
    this.playhead    = 0;         // Current position in the recording
    this.positions   = recording[0]?.positions ?? [];
    this.isFinished  = recording.length === 0;
  }

  // Advance one tick: mirrors the same cadence as the player
  step() {
    if (this.isFinished) return;

    this.playhead++;

    if (this.playhead >= this.recording.length) {
      this.isFinished = true;
      return;
    }

    this.positions = this.recording[this.playhead].positions;
  }

  // Check whether this ghost occupies a given grid cell
  occupies(x, y) {
    return this.positions.some(p => p.x === x && p.y === y);
  }
}
