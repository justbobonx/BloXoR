# WordCracker — dev notes

## How to work in this repo

- **No ES modules.** Classic `<script>` tags, one shared global scope. Do not add `import` / `export`.
- **Orchestrator:** `WordCracker` holds shared state; behavior lives in collaborators:
  - `WordInput` — pointer + highlight paths
  - `WordBoard` — kill/clear, hints, give up, scoring
  - `GameSave` — localStorage + timer pause
  - `GameView` — layout, HUD, draw loop
  - `LevelBuilder` — grid size + word placement
  - `ColorWheel` — highlight colors
- Prefer editing the right child file; avoid stuffing logic back into a monolith `WordCracker.js`.
- After structural changes, hard-refresh (cache-bust must match — see below).

---

## Version + cache-bust strategy

**Single app version lives in `index.html` only:**

```html
<script>
  window.VERSION = '0.6.7';
  document.getElementById('startVersion').textContent = 'v' + window.VERSION;
</script>
```

**When shipping (or after any JS/CSS change you need players to pick up):**

1. Bump `window.VERSION` in that inline script.
2. Bump the **same** string on every asset query param:
   - `css/style.css?v=X.Y.Z`
   - each `<script src="js/….js?v=X.Y.Z">`
3. The start-screen label is filled from `window.VERSION` — do not hardcode a second label string.

JS reads `VERSION` as a global (`window.VERSION`). Saves store `appVersion: VERSION` for diagnostics only.

**Save key** is not versioned with the app label: `GameSave.SAVE_KEY = 'wordcracker_save_v1'` (static on the class).

---

## Script load order (`index.html`)

1. Inline `window.VERSION`
2. `Coord.js`
3. `GfxState.js`
4. `BitmapManager.js`
5. `Sprite.js`
6. `LetterList.js`
7. `Letter.js`
8. `LetterGrid.js`
9. `ColorWheel.js`
10. `LevelBuilder.js`
11. `WordInput.js`
12. `WordBoard.js`
13. `GameSave.js`
14. `GameView.js`
15. `WordCracker.js`
16. `main.js`

---

## Important runtime lists

| Name | Role |
|------|------|
| `curWordList` | Solution strings for the current level |
| `letterGrid.correctList` | Solution words as letter chains on the board |
| `userWords` | Player highlight chains |
| `hintedList` | Correct chains that have received at least one hint letter (persisted) |
| `letter.wordLetterList` | Which solution chain a cell belongs to |
| `letter.userLetterList` | Which player word a cell is in |

`hintedList` is saved as letter-index arrays and rematched to `correctList` on load/resize.

---

## Hints + locks

- One hint button = one more **prefix** letter on one solution word.
- **Hint limit** per word: `ceil(length / 2)` (3–4 → 2, 5–6 → 3, …).
- **hintScore** (weight): 0 if first letter `currentScore >= 1` or locked count ≥ limit. Else average over letters of `1 - (1 if locked/solved else currentScore)`. Weighted random among score > 0.
- Place the next unlocked prefix letter. Peel it off any existing user path first. If a locked prefix already exists as a user word, append to that word.
- `Letter.isLocked()` → `currentScore === 1 || locked` (cannot clear or steal into another path).
- Hint-locked letters stay touchable so the player can continue that word (any position). Fully solved (`score === 1`) are not touchable.
- Move onto a **locked** letter that is **not** in the current path ends the gesture (commit/kill current word); further moves ignored until next down.
- No eligible word → return with **no** `hintsGiven` penalty. Each placed letter increments `hintsGiven`.

---

## Score vs touch visual

- **`currentScore`** is only calculated word quality (`setScore`). Do not use it to fake a press highlight.
- **`touched`** is a flag (`setTouched` / `setUntouched`).
- **`displayScale()`** at draw time: full size if touched, else `baseScale * (0.6 + score * 0.4)`.
- Only the **currently pressed** letter is full scale during a drag; the rest of the path uses live partial `scoreWord()` while highlighting.

---

## Scoring (high level)

- Mid-level progress: average of `userWords` `scoreWord()` results ÷ solution count, × 100 → `levelScore` (often HUD-hidden).
- Clear board: `levelScore = floor(1000 * levelBonus)`; `totScore += levelScore` in `endLevel`.
- `levelBonus` updates live from time left and hints; applied on beat.
- Give up: `levelScore = -10 * (100 - levelScore)` then `endLevel`.
- BG steps only when `curCorrect` increases (full correct words). Cap travel to image top; keep **one** formula for play and load (avoid resize re-applying progress).

---

## Save / load / resize pitfalls

1. **`LetterGrid.resetSize` creates new `Letter` instances.** Always remap `userWords`, `correctList`, and `hintedList` by **letter indices**, never keep old object refs in those lists.
2. **`GameView.resize` must snapshot `locked`** (and scores, tints, words) or locks vanish after load/resize.
3. **`LetterList` extends `Array`** — constructor must accept numeric length from `splice`/`map` species.
4. Do not use `bgCurrentY = 0` as the start pose; use layout `baseY`.
5. Start screen exists so boot runs after the canvas has real dimensions.

---

## Input / selection (current)

- Path is 8-way neighbors only.
- Down on an unhighlighted letter: new word, new color.
- Down on a letter already in a user word (including hint-locked): pick up that word/color; tip is the pressed letter.
- Quick tap (down+up, no move) on a non-locked letter in a word: remove it and split; keep each side only if length ≥ 3.
- Move onto a letter already in the current path: only retarget the tip (no path change).
- Move onto a locked letter not in the current path: finish the current word; ignore further moves until next down.
- Move onto any other neighbor: steal it from another word if needed (split that word), then:
  - tip is last → append
  - tip is first → prepend
  - tip is middle → drop letters after tip (turned off, not a new word), then append
- Release commits (≥ 3) or kills short chains.
- Clear removes incomplete (non-correct) user words; locked remnants of hints are kept.

---

## Assets (quick)

| Path | Role |
|------|------|
| `assets/images/wordcracker-bg-1.jpg` | Active tall BG (`bg` in BitmapManager) |
| `assets/images/letters.png` | 7×4 sheet, 96px cells |
| `assets/images/letter_*.png`, `shine_circle.png` | Layers / connectors |
| `assets/data/letters.txt` | Packed words by length (one line per length) |
| `assets/fonts/komika.ttf` | UI font |

---

## File map

```text
index.html          VERSION + scripts + start UI + HUD
dev_notes.md        this file
README.md           short public overview
css/style.css
js/Coord.js … Sprite.js, Letter*, ColorWheel, LevelBuilder,
   WordInput, WordBoard, GameSave, GameView, WordCracker, main.js
assets/…
```

Original Android port reference (names only): `WordCrackerActivity`, `WordCrackerMainView`, `LetterGrid`, `LetterList`, `Letter`, `Sprite`, `GfxState`, `BitmapManager`, `Coord`.
