# BloXoR — current state

HTML5 canvas port of the Android / GameMaker tilt puzzle. Repo: `justbobonx/BloXoR`. Direct logic port — do not “improve” physics.

Served as static files. Owner has all original assets in-tree.

## Version bust (required after every JS/CSS change)

One line in `index.html`:

```js
window.VERSION = '0.3.12';
```

CSS and every script are injected as `file?v=` + that string. Change **only** that line after an update. Do not sprinkle versions on individual tags. `index.html` itself relies on the no-cache meta; if Pages serves a stale index, the new VERSION never runs.

Bump VERSION **last**, only after the JS/CSS blobs from that same change are on `main` and checked. A version bump against a truncated file forces every client onto the broken blob.

## What works now

- Full puzzle set, thumbs, lock/open rules (`NUM_LEVELS_ALLOW_OPEN`).
- Play / continue / level select / detail / pause / score.
- In-play HUD (score, tilts, time).
- Wait-to-start align overlay: stays up until tilt is **live** and flat ~180ms. Space / A / gamepad A still start immediately. Do not treat the default `downx=downy=0` as level — that is “no sample yet.”
- Physics on a fixed **480×320** board. Draw with `ctx.setTransform(viewScale,0,0,viewScale,viewOx,viewOy)`. Do not scale the sim.
- Block coupling: recursive `updateTheBlox` on a bumped mover, then re-check bump; both X-then-Y and Y-then-X orders (larger tilt first). Needed for wall/corner slides and touching movers staying in sync.
- One-ways, holes, bombs, breakers, bolts, pot-bridge → bridge.
- Bomb interact: A / Space / pad A enters selector (`hilite_circle` rotates). Stick/keys step to nearest in that half-plane. A confirms, B/Esc cancels. `absorbButtons()` on every state change so a held A from “Play” does not immediately interact.
- Input priority: drag / stick / keys beat tilt.
- Gamepad: stick = tilt (`joyLev` 0.20, `joyPow` 0.12). A activate, B pause (second B closes pause), Start pause. Menus use d-pad/stick + A.
- Tilt: `accelerationIncludingGravity / 9.81`, 3-sample smooth. Deadzone and gain live on `BloxInput`: `FLAT_SPAN` 0.03, `FLAT_START` 0.01, `TILT_GAIN` 1.5. Equal span/start = no kick after the deadzone. Keys/stick do **not** use these.
- Tilt axis remap: if CSS stage is swapped, treat as landscape-90 then flip Y. If OS landscape, flip Y only; if OS portrait (no swap path), flip X only.
- Always-landscape draw: tall viewport adds `html.stage-swap` and CSS-rotates `#game-container` 90° so the long phone edge is game width. Pointer math uses `pointerCss` (inverse of that rotate). Never fullscreen `#game-container` — that drops the transform. Fullscreen `document.documentElement`.
- `enterPlayChrome()`: request page fullscreen + applyStage. Title gate (`#orientGate` **inside** the stage) only if viewport is tall and we are not already FS+swapped. PLAY / Continue / Resume / Restart / level Play / score OK go through this. B-pause does **not** leave fullscreen. Hidden tab / pagehide: pause if playing, then exit FS; Resume re-enters chrome.
- Wake Lock while InPlay / WaitToStart and visible.
- Long-press (~550ms) on empty board → pause. Short tap on a bomb detonates.
- Sound: one `Audio` per `assets/audio/*.ogg`. First pointer/key wakes the browser, then play/stop/volume/rate. Mute saved. Safari may still refuse ogg.

## Layout of the tree

```
index.html          VERSION + DOM shells
css/style.css       stage-swap, menus, gate
js/main.js          applyStage, resize (use clientWidth/Height, not AABB), focus/visibility
js/BloXor.js        game + BloXorUI
js/BloxPhysics.js   movement, bumps, explode, win check
js/BloxField.js     occupancy grids
js/BloxInput.js     all input + wake lock + tilt constants
js/Blox.js          tile types / sprites
js/GameView.js      layout, draw, wait-to-start gate
js/PuzzleLoader.js / LevelIndex.js / LevelData.js / GameSave.js
js/SoundManager.js / BitmapManager.js / Sprite.js / Coord.js / GfxState.js
assets/images/      tiles, board, title, hilite, thumbs next to puzzles
assets/audio/       sfx_*.ogg
assets/data/        level .txt
```

Save key: `localStorage['BloXoRSaveData']`.

## Rules for later edits

- Least-change fixes. Do not rewrite physics “to clean it up.”
- Keep both axis resolve orders.
- Keep `absorbButtons` on chrome / play / interact / menu transitions.
- After any `js/` or `css/` commit, bump `window.VERSION`.
- `updateMoveCnt` still reads `g.FLAT_SPAN`. Deadzone constants now live on `BloxInput`. If move-count deadzone looks wrong, point it at `this.input.FLAT_SPAN` or restore `g.FLAT_*`.
- GameMaker reference for stick + bomb selector: owner’s Steam GML (`updateMove`, `Step_0`, `interactControl`). Match that feel, don’t invent a new scheme.
- Do not reintroduce `screen.orientation.lock` or a “turn your phone” banner. Users see the landscape stage and turn the handset.

## GitHub writes from chat

Remote edits replace the **whole file**. A 20-line fix still uploads the entire source. Do not send a fragment, stub, or placeholder — GitHub will take it and `main` will serve it.

Do not split `BloxInput.js` / `BloXor.js` just to make uploads smaller. Those sizes are fine.

After every remote write, before the next file or a VERSION bump:

- Blob size is in the same ballpark as the file you meant (not tens of bytes).
- File still starts with the real class / header.
- Unique strings from the intended edit are present (`playingForWake`, the new symbol, etc.).

Prefer one commit that contains every file in the change. Verify, then bump VERSION last.
