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

## Previous Change Log

Condensed from the old git history. Version bumps, reverts, merges, and empty commits omitted.

- First-pass HTML5 port, then wired CSS, puzzles, and the JS modules (LevelData, GameSave, LevelIndex, Sprite, Blox, BitmapManager, BloxField, PuzzleLoader, GameView, BloxInput, BloxPhysics, BloXor + UI).
- Moved puzzles to `assets/data`; added images, thumbs, help HTML; ignored Thumbs.db.
- Softened keyboard/mouse debug tilt for slight-nudge play.
- Letterbox the 3:2 board so left/right walls stay on screen.
- Level preview thumbs, HTML descriptions, locked-level `???` and unlock gate.
- Packed movers stay in sync by copying vel on snap.
- Recheck `checkBumpY` on the Y else-branch the same way as X.
- Ignore sub-precision cell offsets so dust does not occupy two cells.
- Quantize snaps; only count a stop when vel is 0.
- Gamepad stick tilt using the Steam `joyLev`/`joyPow` curve; poll every tick including wait-to-start.
- Soften stick tilt; keys/stick menu focus nav; Enter pauses in play; focus ring.
- Device tilt in `BloxInput` via `devicemotion`; prefer gravity motion over orientation.
- Fullscreen from title PLAY; resize on fullscreen change.
- Draw the 480×320 world through the canvas transform; do not scale physics. Pointer hits map through that transform.
- Gamepad B opens pause. Level list only autoscrolls on key/stick focus moves.
- Title art on the start screen.
- GML-style bomb interact: rotating hilite, A/Space enters select, stick/keys step to nearest in that half-plane.
- Wait-to-start goes through `startFromWait`; consume start-A so it cannot open bomb select.
- Latch / absorb held face buttons across play, pause, and resume.
- Blank tap opens pause. Tilt axis signs: landscape flip Y only, portrait flip X only.
- Wake lock while playing; long-press empty space to pause.
- Dropped orientation lock. Tall viewports CSS-rotate the stage onto the wide axis; touch and tilt map through that rotate.
- Single title-gate path into fullscreen + wide-axis stage. Gate lives inside the stage and only shows when a portrait flash is possible.
- One `VERSION` string busts CSS and all scripts.
- Tilt constants moved into `BloxInput`.
- `SoundManager` for ogg SFX. Silence audio on lost focus / pause without flipping mute. `pagehide` runs even if `visibilityState` is still visible. Save on lost focus.
- Do not leave wait-to-start until tilt has real samples.
- Separate tilt vs stick friction so held leans keep accelerating.
- Sandwich jitter: static wall pin wins over mover glue. Do not face-snap glue on side-path wiggle grazes.
- Title gate also covers first-load portrait flash.
- Level select one-line stats; mute moved to pause. Later: two-line stats, O/X marks, compact pause and detail stats, pause title is the level name.
- Win: OXO copies fly toward screen center keeping spacing; score panel delayed; yellow bests.
- Skip tilt calibrate overlay for keyboard and gamepad; start those levels immediately.
- Hide key tilt behind `?keysOn=1`; drop drag-to-tilt.
- Play HUD: comma scores, TILTS/TIME labels; dismiss pause on outside tap.
- Title is Play only (no Continue). Center the highlighted level in the select list. Tagline under art, contact under Play.
- Zero stick tilt when keys are off.
- Level-detail stats: centered columns, first-beat date only.
- HUD went from hard shadow + long-press hint, to chips (padding/opacity passes), then split TILTS and TIME chips.
- Face-snap wall shove pushes the mover chain or refuses the snap.
- Wake lock stays on during pause; 60s grace after level complete; clear grace on score OK.
- Open unbeaten levels use the half-size generic block icon.
- Corner finish: snap only the gap axis by the lip amount, and only on embed+lip; do not revert the other axis. Corner round is a const.
- Do not snap-and-zero against an already-ticked mover (this was tried, then the opposite kept: already-ticked movers snap again).
- Still-hitting sets vel to `hit.vel` instead of zero.
- One-way bump tests use start pos, not `potNew`. Snap face is picked from pre-move pos, not `potNew`. One-ways block reverse plan snaps from the gate cell.
- Sandwich: shove the mover pack to rest before snapping self.
- Dropped `bloxDistMin1`; lattice constants live on `BloXor`.
- First-beat score rows stay white (no record highlight).
- Stripped leftover level/data files; removed the blank BOM line in `PuzzleIndex.txt`.
