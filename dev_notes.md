# BloXoR — coding notes

HTML5 canvas port of the original tilt puzzle. Static files. Least-change fixes only.

## Do not

- Add `import` / `export`. Classic `<script>` tags, one global scope.
- Rewrite physics, win test, scoring, or unlock rules to “clean them up.”
- Invent a `downz` from stick/key length. That changes friction. Leave Z at 0 until real tilt supplies it.
- Scale the sim. Board is fixed **480×320**. Draw with `ctx.setTransform(viewScale,0,0,viewScale,viewOx,viewOy)`.
- Fullscreen `#game-container` (drops the CSS rotate). Fullscreen `document.documentElement`.
- Reintroduce `screen.orientation.lock` or a “turn your phone” banner.
- Split `BloxInput.js` / `BloXor.js` just to make files smaller.

## Version

One string in `index.html`:

```js
window.VERSION = '…';
```

CSS and every script load as `file?v=` + that value. Bump **only that line**, and only after the JS/CSS for the change is already on `main`. A bump against a bad blob pins every client to it. `index.html` itself depends on the no-cache meta; a stale Pages index never picks up the new VERSION.

## Physics

- Step: `FRAME_SLEEP_MSEC = 38`.
- Lattice lives on `BloXor`: `bloxDist = 40`, grid 11×7, play field 40..440 × 40..280.
- Axis order: if `abs(downx) > abs(downy)` resolve X then Y, else Y then X. **Both orders stay.** That is wall/corner slide feel.
- If you bump a mover that has not updated this tick, `updateTheBlox` them first, then recheck.
- Cap travel so a piece cannot tunnel a cell.
- A blox can sit on 1–4 field lists. Remap by list reference after every move.
- One-ways are filters inside `checkBumpX` / `checkBumpY`, not a second system.
- Keep the magic distances: hole fall-in `bloxDist * 0.57`, plus the lip/embed snap amounts already in `BloxPhysics`.

## Input / chrome

Priority: drag / stick / keys beat tilt.

Tilt: `accelerationIncludingGravity / 9.81`, 3-sample smooth. Deadzone/gain live on `BloxInput` (`FLAT_SPAN` 0.03, `FLAT_START` 0.01, `TILT_GAIN` 1.5). Keys/stick do **not** use those. Equal span/start = no kick after the deadzone.

`updateMoveCnt` still reads `g.FLAT_SPAN`. If tilt-count deadzone looks wrong, point it at `this.input.FLAT_SPAN` or put `FLAT_*` back on the game object.

Wait-to-start: overlay stays up until tilt is **live** and flat ~180ms. Space / A / pad A start immediately. Default `downx=downy=0` is “no sample yet,” not level.

Stage-swap: tall viewport adds `html.stage-swap` and CSS-rotates `#game-container` 90°. Pointer math must go through `pointerCss` (inverse of that rotate). Tilt remap: swapped stage → landscape-90 then flip Y; OS landscape → flip Y; OS portrait with no swap → flip X.

`enterPlayChrome()`: page fullscreen + `applyStage`. Title gate (`#orientGate` inside the stage) only if the viewport is tall and we are not already FS+swapped. PLAY / Continue / Resume / Restart / level Play / score OK go through this. B-pause does **not** leave fullscreen. Hidden tab / pagehide: pause if playing, then exit FS; Resume re-enters chrome.

Call `absorbButtons()` on chrome / play / interact / menu transitions so a held A from “Play” does not fire interact.

In play: long-press (~550ms) on empty board pauses. Short tap on a `BOMB` detonates. A / Space / pad A opens the bomb selector; stick/keys step in that half-plane; A confirms, B/Esc cancels.

Wake Lock while InPlay / WaitToStart and visible.

Stick + bomb selector feel should match the Steam GML (`updateMove`, `Step_0`, `interactControl`), not a new scheme.

## Puzzles

`assets/data/PuzzleIndex.txt`: `Name<TAB>description`  
Skip blank lines. Do not put a BOM on its own line.

`assets/data/Name.txt`: `Type<TAB>x<TAB>y[<TAB>bolts]`  
Types: Wall, 1W_L/R/U/D, Break, BloxO, BloxX, Gener, Bomb, BombI, Hole, PotBr, Bridge  
Grid: x 0..10, y 0..6

Thumbs: `assets/data/Name_t.png`.

Unlock: `NUM_LEVELS_ALLOW_OPEN = 6`.

Save key: `localStorage['BloXoRSaveData']`.

## Sound

One `Audio` per `assets/audio/*.ogg`. First pointer/key wakes the browser. Mute is saved. Safari may still refuse ogg.

## Script order

`index.html` VERSION → Coord → GfxState → BitmapManager → Sprite → SoundManager → Blox → LevelData → GameSave → BloxField → BloxPhysics → BloxInput → PuzzleLoader → LevelIndex → GameView → BloXor → main

Keep that order. New files go in the `document.write` list in `index.html` with `?v=` + VERSION.
