# User Guide

---

## Objective

Guide the snake to eat as much food as possible without hitting a wall, yourself, or any ghost snake. The longer you survive, the more ghosts accumulate - and each ghost is a replay of exactly how you played before.

---

## Controls

| Key | Action |
|---|---|
| Arrow Up / W | Move up |
| Arrow Down / S | Move down |
| Arrow Left / A | Move left |
| Arrow Right / D | Move right |
| P or Escape | Pause the game |
| R | Restart immediately |
| Enter or Space | Start from menu / Restart from game over |

The snake cannot reverse direction directly. If you are moving right, pressing left is ignored. You can, however, queue two quick turns - for example, pressing Up and then Left in quick succession. The game buffers up to two direction inputs between movement steps, so fast turns are not lost.

---

## Game States

```
[Menu] ---(Enter/Space)---> [Running] ---(P/Escape)---> [Paused]
                                |                            |
                                |         (P/Escape or R) --+
                                |
                          (collision)
                                |
                                v
                          [Game Over] ---(Enter/Space/R)---> [Running]
```

| State | What You See |
|---|---|
| Menu | Title screen with instructions |
| Running | Live gameplay |
| Paused | Game frozen, "PAUSED" overlay |
| Game Over | Final score and ghost count, restart prompt |

---

## The Board

The playing field is a 30 x 24 grid of cells. The snake, food, and ghosts all occupy cells on this grid. Movement is step-by-step - the snake advances exactly one cell per game tick.

---

## The Snake

- Starts 3 cells long in the center of the board, moving right
- Each food eaten adds one cell to the length
- If the head touches a wall or any part of the body, the game ends

---

## Food

- One red pulsing circle is always present on the board
- Eating it adds one point to your score and grows the snake by one cell
- New food spawns immediately on a random cell that is not occupied by the snake or any ghost

---

## The HUD

Two pieces of information are displayed at the top of the board at all times:

```
Score: 12                          LOOP: 067 / 100
```

| Element | Position | Meaning |
|---|---|---|
| Score | Top left | Number of food items eaten |
| Loop counter | Top right | Ticks elapsed in the current loop interval |

The loop counter turns amber when 20 or fewer ticks remain before the next ghost spawn. This gives you a moment to prepare.

---

## The Time-Loop Mechanic

This is the core feature that sets this game apart from standard Snake.

**How it works:**

1. A hidden timer counts up from 0 to 100 ticks (approximately 14 seconds)
2. During this interval, every movement you make is recorded
3. When the counter reaches 100, two things happen simultaneously:
   - A ghost snake appears and begins replaying your exact movements from that interval
   - The timer resets to 0 and recording begins again for the next loop
4. This repeats indefinitely - each completed loop spawns a new ghost

**What ghosts look like:**

Each ghost is semi-transparent and uses a distinct color so you can tell them apart:

| Ghost Number | Color |
|---|---|
| 1st | Blue |
| 2nd | Purple |
| 3rd | Amber |
| 4th | Teal |

When a ghost is spawned, "GHOST SPAWNED" flashes briefly in the center of the screen.

**Ghost behavior:**

- A ghost replays the exact positions from your previous loop interval, one step per game tick
- Its body length changes over time, matching how long your snake was during that interval
- Ghosts advance in sync with the player - one step per tick, same timing
- A ghost disappears when its recording runs out
- If more than 4 ghosts are active at once, the oldest is removed to make room

**Collision with a ghost:**

If your snake's head enters any cell occupied by a ghost, the game ends immediately - the same as hitting a wall.

---

## Strategy

- **Watch the loop counter.** When it turns amber, a ghost is about to appear. Clear a path through the area where you were 14 seconds ago.
- **Your past movements are your biggest obstacle.** If you spent the previous loop zigzagging across the center, the center will be dangerous when that ghost spawns.
- **Use the edges early.** Straightforward paths along the walls are easier to predict and easier to avoid later.
- **Food placement matters.** If food spawns in a spot that will conflict with a future ghost, consider whether it is worth the risk.
- **Later ghosts are harder.** By the third and fourth ghost, the board has multiple overlapping replay paths. Surviving requires awareness of what all previous loops looked like.

---

## Scoring

| Action | Points |
|---|---|
| Eat food | +1 |

The game over screen shows your total score and how many ghosts were spawned during the run.
