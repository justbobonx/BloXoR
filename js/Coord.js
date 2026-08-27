class Coord {
  constructor(x = 0, y = 0) {
    if (x instanceof Coord) {
      this.x = x.x;
      this.y = x.y;
      return;
    }
    this.x = x;
    this.y = y;
  }

  clone() {
    return new Coord(this.x, this.y);
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  toString() {
    return this.x + ',' + this.y;
  }
}
