# Dev notes

## How to work in this repo

- **No ES modules.** Classic `<script>` tags, one shared global scope. Do not add `import` / `export`.
- Going for OO approach with most files being 1:1 to Objects.
- Keep files smaller, consider refactoring into more objects if getting over ~10k with hard limit of 20k.
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

**When shipping (or after any JS/CSS change you need users to pick up):**

1. Bump `window.VERSION` in that inline script.
2. Bump the **same** string on every asset query param:
   - `css/style.css?v=X.Y.Z`
   - each `<script src="js/….js?v=X.Y.Z">`
3. The start-screen label is filled from `window.VERSION` — do not hardcode a second label string.

JS reads `VERSION` as a global (`window.VERSION`). Saves store `appVersion: VERSION` for diagnostics only.

---

## Dev details

tbd

---


```

Original Android port reference (names only): `WordCrackerActivity`, `WordCrackerMainView`, `LetterGrid`, `LetterList`, `Letter`, `Sprite`, `GfxState`, `BitmapManager`, `Coord`.
