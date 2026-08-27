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

## File map

```text
index.html              VERSION + overlays + script order
css/style.css
dev_notes.md
js/Coord.js
js/GfxState.js
js/BitmapManager.js     placeholders, then real assets if present
js/Sprite.js
js/SoundManager.js      stub until sfx land
js/Blox.js              types + string names from Android
js/LevelData.js
js/GameSave.js          localStorage, same tab fields as SharedPreferences
js/BloxField.js         field / underfield occupancy
js/BloxPhysics.js       updateTheBlox + bumps + holes + bombs
js/BloxInput.js
js/PuzzleLoader.js      name.txt  Type<TAB>x<TAB>y[<TAB>bolts]
js/LevelIndex.js        PuzzleIndex.txt
js/GameView.js          scale + draw layers
js/BloXor.js            orchestrator + UI wiring
js/main.js
assets/puzzles/
```

## Script order

VERSION → Coord → GfxState → BitmapManager → Sprite → SoundManager → Blox → LevelData → GameSave → BloxField → BloxPhysics → BloxInput → PuzzleLoader → LevelIndex → GameView → BloXor → main

## Puzzle format

`assets/puzzles/PuzzleIndex.txt`: `Name<TAB>description`

`assets/puzzles/Name.txt`: `Type<TAB>x<TAB>y[<TAB>bolts]`
Types: Wall, 1W_L/R/U/D, Break, BloxO, BloxX, Gener, Bomb, BombI, Hole, PotBr, Bridge
Grid: x 0..10, y 0..6

## Still Android-only (not in this pass)

DeviceOrientation tilt, real bitmaps/sfx, help HTML, level thumbnails, mid-level piece save (that path was commented out in Java too).

Original Android names: `BloXoRActivity`, `BloXoRMainView`, `Blox`, `Sprite`, `GfxState`, `BitmapManager`, `Coord`, `LevelData`.
