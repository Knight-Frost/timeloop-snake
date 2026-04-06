// All game config lives here. Change stuff here, not scattered around.

export const GRID_COLS = 30;
export const GRID_ROWS = 24;
export const CELL_SIZE = 28;

export const BOARD_WIDTH  = GRID_COLS * CELL_SIZE;   // 840px
export const BOARD_HEIGHT = GRID_ROWS * CELL_SIZE;   // 672px

// Milliseconds between each snake step. Lower = faster.
export const TICK_MS = 140;

// Ticks before a new ghost spawns. 100 ticks × 140ms ≈ 14 seconds.
export const LOOP_TICKS = 100;

// Cap how many ghosts can exist at once
export const MAX_GHOSTS = 4;

// Direction deltas on the grid
export const DIR = {
  UP:    { x:  0, y: -1 },
  DOWN:  { x:  0, y:  1 },
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x:  1, y:  0 },
};

// Used to block 180° reversals
export const OPPOSITE = {
  UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT',
};

export const COLORS = {
  background: '#08080f',
  gridLine:   '#12122a',

  snakeHead:  '#39ff14',
  snakeBody:  '#2adb0e',

  foodCore:   '#ff4444',
  foodGlow:   '#ff000066',

  // One color per ghost slot - cycles if somehow more than 4
  ghostPalette: [
    { body: '#4488ff', alpha: 0.55 },
    { body: '#cc44ff', alpha: 0.55 },
    { body: '#ffaa00', alpha: 0.55 },
    { body: '#00ffcc', alpha: 0.55 },
  ],

  uiText:       '#e0e0ff',
  uiOverlay:    '#00000099',
  uiAccent:     '#39ff14',
  uiSubtle:     '#55557a',
  timerWarning: '#ffaa00',
};

export const FONTS = {
  score:    'bold 20px "Courier New", monospace',
  timer:    '16px "Courier New", monospace',
  title:    'bold 48px "Courier New", monospace',
  subtitle: '20px "Courier New", monospace',
  body:     '15px "Courier New", monospace',
};

export const STATE = {
  MENU:      'MENU',
  RUNNING:   'RUNNING',
  PAUSED:    'PAUSED',
  GAME_OVER: 'GAME_OVER',
};
