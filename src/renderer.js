// Draws everything onto the canvas. Pure output: no game logic here.

import {
  CELL_SIZE, BOARD_WIDTH, BOARD_HEIGHT,
  GRID_COLS, GRID_ROWS, COLORS, FONTS, LOOP_TICKS,
} from './constants.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');

    canvas.width  = BOARD_WIDTH;
    canvas.height = BOARD_HEIGHT;
  }

  // ─── Main draw call each frame ───────────────────────────────────────────

  drawGame(snake, ghosts, food, score, loopTick, spawnFlash) {
    const ctx = this.ctx;

    this._clearBackground();
    this._drawGrid();
    this._drawFood(food);
    this._drawGhosts(ghosts);
    this._drawSnake(snake);
    this._drawHUD(score, loopTick);

    // Brief "GHOST SPAWNED" flash - spawnFlash counts down from ~12 to 0
    if (spawnFlash > 0) {
      const alpha = Math.min(1, spawnFlash / 8);
      ctx.globalAlpha = alpha;
      ctx.textAlign   = 'center';
      ctx.fillStyle   = '#cc44ff';
      ctx.font        = FONTS.subtitle;
      ctx.shadowColor = '#cc44ff';
      ctx.shadowBlur  = 20;
      ctx.fillText('GHOST SPAWNED', BOARD_WIDTH / 2, BOARD_HEIGHT / 2 - 10);
      ctx.shadowBlur  = 0;
      ctx.globalAlpha = 1;
    }
  }

  drawMenu() {
    const ctx = this.ctx;
    this._clearBackground();
    this._drawGrid();
    this._drawOverlay();

    ctx.textAlign = 'center';

    // Title with glow
    ctx.shadowColor = COLORS.uiAccent;
    ctx.shadowBlur  = 20;
    ctx.fillStyle   = COLORS.uiAccent;
    ctx.font        = FONTS.title;
    ctx.fillText('TIME LOOP', BOARD_WIDTH / 2, BOARD_HEIGHT / 2 - 80);
    ctx.fillText('SNAKE', BOARD_WIDTH / 2, BOARD_HEIGHT / 2 - 24);
    ctx.shadowBlur  = 0;

    ctx.fillStyle = COLORS.uiSubtle;
    ctx.font      = FONTS.subtitle;
    ctx.fillText('Every 14 seconds, your past self appears', BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 30);
    ctx.fillText('Avoid all ghosts to survive', BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 58);

    ctx.fillStyle = COLORS.uiText;
    ctx.font      = FONTS.body;
    ctx.fillText('WASD or Arrow Keys to move', BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 110);
    ctx.fillText('P to pause    R to restart', BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 135);

    ctx.fillStyle = COLORS.uiAccent;
    ctx.font      = FONTS.subtitle;
    ctx.fillText('Press ENTER or SPACE to start', BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 185);
  }

  drawPaused() {
    // Dim the current frame and overlay text (game state beneath is preserved)
    const ctx = this.ctx;
    this._drawOverlay(0.6);

    ctx.textAlign   = 'center';
    ctx.fillStyle   = COLORS.uiAccent;
    ctx.font        = FONTS.title;
    ctx.shadowColor = COLORS.uiAccent;
    ctx.shadowBlur  = 15;
    ctx.fillText('PAUSED', BOARD_WIDTH / 2, BOARD_HEIGHT / 2);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.uiText;
    ctx.font      = FONTS.body;
    ctx.fillText('Press P or ESC to resume', BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 46);
  }

  drawGameOver(score, ghostCount) {
    const ctx = this.ctx;
    this._drawOverlay(0.75);

    ctx.textAlign   = 'center';
    ctx.font        = FONTS.title;
    ctx.fillStyle   = '#ff4444';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur  = 20;
    ctx.fillText('GAME OVER', BOARD_WIDTH / 2, BOARD_HEIGHT / 2 - 70);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.uiText;
    ctx.font      = FONTS.subtitle;
    ctx.fillText(`Score: ${score}`, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 - 10);
    ctx.fillText(`Ghosts survived: ${ghostCount}`, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 28);

    ctx.fillStyle = COLORS.uiSubtle;
    ctx.font      = FONTS.body;
    ctx.fillText('Press ENTER, SPACE, or R to play again', BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 80);
  }

  // ─── Internal drawing helpers ─────────────────────────────────────────────

  _clearBackground() {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
  }

  _drawGrid() {
    const ctx = this.ctx;
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth   = 0.5;

    for (let x = 0; x <= GRID_COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, BOARD_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(BOARD_WIDTH, y * CELL_SIZE);
      ctx.stroke();
    }
  }

  _drawSnake(snake) {
    const ctx = this.ctx;
    snake.positions.forEach((pos, index) => {
      const isHead = index === 0;

      if (isHead) {
        // Head glows brighter
        ctx.shadowColor = COLORS.snakeHead;
        ctx.shadowBlur  = 12;
        ctx.fillStyle   = COLORS.snakeHead;
      } else {
        ctx.shadowBlur = 0;
        // Fade body slightly toward the tail
        ctx.fillStyle = COLORS.snakeBody;
      }

      this._fillCell(pos.x, pos.y, 3);  // 3px inset so cells look distinct
    });

    ctx.shadowBlur = 0;
  }

  _drawGhosts(ghosts) {
    const ctx = this.ctx;

    ghosts.forEach((ghost) => {
      if (ghost.isFinished || ghost.positions.length === 0) return;

      const palette = COLORS.ghostPalette[ghost.colorIndex % COLORS.ghostPalette.length];

      ctx.globalAlpha = palette.alpha;
      ctx.fillStyle   = palette.body;
      ctx.shadowColor = palette.body;
      ctx.shadowBlur  = 6;

      ghost.positions.forEach((pos, index) => {
        // Head slightly brighter: full alpha is already set globally
        if (index === 0) {
          ctx.shadowBlur = 14;
        } else {
          ctx.shadowBlur = 4;
        }
        this._fillCell(pos.x, pos.y, 4);
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur  = 0;
    });
  }

  _drawFood(food) {
    const ctx = this.ctx;
    const pos = food.position;
    const cx  = pos.x * CELL_SIZE + CELL_SIZE / 2;
    const cy  = pos.y * CELL_SIZE + CELL_SIZE / 2;

    // Pulse: radius oscillates between 5 and 9px
    const pulse  = Math.sin(food.animationTick * 0.12) * 2;
    const radius = 7 + pulse;

    // Outer glow
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius + 4);
    gradient.addColorStop(0,   COLORS.foodCore);
    gradient.addColorStop(0.6, COLORS.foodCore);
    gradient.addColorStop(1,   COLORS.foodGlow);

    ctx.shadowColor = COLORS.foodCore;
    ctx.shadowBlur  = 14;
    ctx.fillStyle   = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  _drawHUD(score, loopTick) {
    const ctx = this.ctx;
    const pad = 12;

    // Score: top left
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.uiText;
    ctx.font      = FONTS.score;
    ctx.fillText(`Score: ${score}`, pad, pad + 18);

    // Loop timer: top right
    // Turns orange when < 20 ticks remain so players can anticipate the spawn
    const ticksLeft = LOOP_TICKS - loopTick;
    const isWarning = ticksLeft <= 20;

    ctx.textAlign = 'right';
    ctx.fillStyle = isWarning ? COLORS.timerWarning : COLORS.uiSubtle;
    ctx.font      = FONTS.timer;
    ctx.fillText(`LOOP: ${String(loopTick).padStart(3, '0')} / ${LOOP_TICKS}`, BOARD_WIDTH - pad, pad + 18);
  }

  // Fill a single grid cell with an inset gap
  _fillCell(gridX, gridY, inset = 2) {
    this.ctx.fillRect(
      gridX * CELL_SIZE + inset,
      gridY * CELL_SIZE + inset,
      CELL_SIZE - inset * 2,
      CELL_SIZE - inset * 2,
    );
  }

  // Semi-transparent black overlay for menus/pause
  _drawOverlay(opacity = 0.5) {
    const ctx = this.ctx;
    ctx.fillStyle = `rgba(0,0,0,${opacity})`;
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
  }
}
