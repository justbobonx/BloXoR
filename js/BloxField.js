class BloxField {
  constructor(game) {
    this.g = game;
    this.field = [];
    this.underfield = [];
    for (let x = 0; x < game.BLoxCntX; x++) {
      this.field[x] = [];
      this.underfield[x] = [];
      for (let y = 0; y < game.BLoxCntY; y++) {
        this.field[x][y] = [];
        this.underfield[x][y] = [];
      }
    }
  }

  clearAll() {
    const g = this.g;
    for (let x = 0; x < g.BLoxCntX; x++) {
      for (let y = 0; y < g.BLoxCntY; y++) {
        this.field[x][y].length = 0;
        this.underfield[x][y].length = 0;
      }
    }
  }

  addBloxToField(aBlox, field) {
    if (field.indexOf(aBlox) < 0) field.push(aBlox);
    if (aBlox.myFieldLocs.indexOf(field) < 0) aBlox.myFieldLocs.push(field);
  }

  removeBloxFromTheWorld(aBlox) {
    const g = this.g;
    BloxField._removeFrom(g.underBloxs, aBlox);
    BloxField._removeFrom(g.surfaceBloxs, aBlox);
    BloxField._removeFrom(g.overBloxs, aBlox);
    BloxField._removeFrom(g.moverBloxs, aBlox);

    if (aBlox === g.bloxO1) g.bloxO1 = null;
    else if (aBlox === g.bloxX) g.bloxX = null;
    else if (aBlox === g.bloxO2) g.bloxO2 = null;

    for (let i = 0; i < aBlox.myFieldLocs.length; i++) {
      BloxField._removeFrom(aBlox.myFieldLocs[i], aBlox);
    }

    if (aBlox.bolted != null) {
      BloxField._removeFrom(g.overBloxs, aBlox.bolted);
      aBlox.bolted = null;
    }
  }

  static _removeFrom(arr, item) {
    const i = arr.indexOf(item);
    if (i >= 0) arr.splice(i, 1);
  }

  _cellOff(delta) {
    const off = delta % this.g.bloxDist;
    if (Math.abs(off) < 1 / this.g.BLOX_POS_PRECISION) return 0;
    return off;
  }

  giveMeListOfFieldPointsFor(x, y, list) {
    const g = this.g;
    list.length = 0;
    const fieldlocx = Math.trunc((x - g.LEFT) / g.bloxDist);
    const fieldlocy = Math.trunc((y - g.TOP) / g.bloxDist);
    const fieldlocxOff = this._cellOff(x - g.LEFT);
    const fieldlocyOff = this._cellOff(y - g.TOP);
    if (!this._valid(fieldlocx, fieldlocy)) return;
    list.push(this.field[fieldlocx][fieldlocy]);
    if (fieldlocxOff > 0 && fieldlocx + 1 < g.BLoxCntX && this._valid(fieldlocx + 1, fieldlocy)) {
      list.push(this.field[fieldlocx + 1][fieldlocy]);
    }
    if (fieldlocyOff > 0 && fieldlocy + 1 < g.BLoxCntY && this._valid(fieldlocx, fieldlocy + 1)) {
      list.push(this.field[fieldlocx][fieldlocy + 1]);
    }
    if (fieldlocxOff > 0 && fieldlocx + 1 < g.BLoxCntX && fieldlocyOff > 0 && fieldlocy + 1 < g.BLoxCntY) {
      list.push(this.field[fieldlocx + 1][fieldlocy + 1]);
    }
  }

  giveMeListOfBloxInTheFieldPointsFor(x, y, list) {
    const g = this.g;
    list.length = 0;
    const fieldlocx = Math.trunc((x - g.LEFT) / g.bloxDist);
    const fieldlocy = Math.trunc((y - g.TOP) / g.bloxDist);
    const fieldlocxOff = this._cellOff(x - g.LEFT);
    const fieldlocyOff = this._cellOff(y - g.TOP);
    if (!this._valid(fieldlocx, fieldlocy)) return;
    this._addAll(list, this.field[fieldlocx][fieldlocy]);
    if (fieldlocxOff > 0 && fieldlocx + 1 < g.BLoxCntX && this._valid(fieldlocx + 1, fieldlocy)) {
      this._addAll(list, this.field[fieldlocx + 1][fieldlocy]);
    }
    if (fieldlocyOff > 0 && fieldlocy + 1 < g.BLoxCntY && this._valid(fieldlocx, fieldlocy + 1)) {
      this._addAll(list, this.field[fieldlocx][fieldlocy + 1]);
    }
    if (fieldlocxOff > 0 && fieldlocx + 1 < g.BLoxCntX && fieldlocyOff > 0 && fieldlocy + 1 < g.BLoxCntY) {
      this._addAll(list, this.field[fieldlocx + 1][fieldlocy + 1]);
    }
  }

  giveMeListOfBloxInTheUnderfieldPointsFor(x, y, list) {
    const g = this.g;
    list.length = 0;
    const fieldlocx = Math.trunc((x - g.LEFT) / g.bloxDist);
    const fieldlocy = Math.trunc((y - g.TOP) / g.bloxDist);
    const fieldlocxOff = this._cellOff(x - g.LEFT);
    const fieldlocyOff = this._cellOff(y - g.TOP);
    if (!this._valid(fieldlocx, fieldlocy)) return;
    this._addAll(list, this.underfield[fieldlocx][fieldlocy]);
    if (fieldlocxOff > 0 && fieldlocx + 1 < g.BLoxCntX && this._valid(fieldlocx + 1, fieldlocy)) {
      this._addAll(list, this.underfield[fieldlocx + 1][fieldlocy]);
    }
    if (fieldlocyOff > 0 && fieldlocy + 1 < g.BLoxCntY && this._valid(fieldlocx, fieldlocy + 1)) {
      this._addAll(list, this.underfield[fieldlocx][fieldlocy + 1]);
    }
    if (fieldlocxOff > 0 && fieldlocx + 1 < g.BLoxCntX && fieldlocyOff > 0 && fieldlocy + 1 < g.BLoxCntY) {
      this._addAll(list, this.underfield[fieldlocx + 1][fieldlocy + 1]);
    }
  }

  _valid(x, y) {
    return x >= 0 && y >= 0 && x < this.g.BLoxCntX && y < this.g.BLoxCntY;
  }

  _addAll(dst, src) {
    for (let i = 0; i < src.length; i++) dst.push(src[i]);
  }
}
