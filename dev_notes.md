# BloXoR — dev notes

## How to work in this repo

- **No ES modules.** Classic `<script>` tags, one shared global scope. Do not add `import` / `export`.
- Direct Android port. Do not change physics numbers, win test, scoring, or unlock rules to "clean them up."
- After JS/CSS changes, bump `window.VERSION` in `index.html` and the same `?v=` on every asset.

## Version

Single app version lives in `index.html` only (`window.VERSION`). Start-screen label is filled from that.

## Physics (do not rewrite)

- Fixed step: `FRAME_SLEEP_MSEC = 38`.
- Axis order: if `abs(downx) > abs(downy)` resolve X then Y, else Y then X. Both orders stay. That is how slides along walls and corners stay smooth.
- Recurse: if you bump a mover that has not updated this tick, `updateTheBlox` them first, then recheck.
- Cap velocity to `bloxDistMin1` so pieces cannot tunnel a cell.
- Occupancy: a blox can sit on 1–4 field lists. Remap by list reference after every move.
- One-ways are filters inside `checkBumpX` / `checkBumpY`, not a second physics system.
- Magic: `bloxDistMin1 - 1.96`, `HOLE_FALLIN_DIST = bloxDist * 0.57`, `FLAT_SPAN` / `FLAT_START`.

## Input

- Android: accelerometer → `downx/y/z` with 3-sample smooth and deadzone.
- HTML first pass: arrows/WASD and pointer-drag (the old `handleEmuTiltTouch`). `downz` stays 0 unless a later DeviceOrientation pass is added. Do not invent a Z from stick length — that changes friction.
- In-play tap only detonates `BOMB` under the pointer.

## Assets

```text
assets/images/    pngs named like Android drawables (whole_bg_ls, blx_o, …)
assets/data/      PuzzleIndex.txt, each level Name.txt, later helptext.html
assets/audio/     sfx_slide, sfx_click1, sfx_thud, sfx_fall, sfx_boom, sfx_boom2, sfx_win, sfx_bloxor
```

No fourth bucket unless a custom font shows up.

## File map

```text
index.html
css/style.css
dev_notes.md
js/
assets/images/
assets/data/
assets/audio/
```

## Script order

VERSION → Coord → GfxState → BitmapManager → Sprite → SoundManager → Blox → LevelData → GameSave → BloxField → BloxPhysics → BloxInput → PuzzleLoader → LevelIndex → GameView → BloXor → main

## Puzzle format

`assets/data/PuzzleIndex.txt`: `Name<TAB>description`

`assets/data/Name.txt`: `Type<TAB>x<TAB>y[<TAB>bolts]`
Types: Wall, 1W_L/R/U/D, Break, BloxO, BloxX, Gener, Bomb, BombI, Hole, PotBr, Bridge
Grid: x 0..10, y 0..6

Original Android names: `BloXoRActivity`, `BloXoRMainView`, `Blox`, `Sprite`, `GfxState`, `BitmapManager`, `Coord`, `LevelData`.
