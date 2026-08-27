class GfxState {
  constructor(gs) {
    if (gs) {
      this.tint = gs.tint;
      this.alpha = gs.alpha;
      this.scale = gs.scale;
      this.rotation = gs.rotation;
    } else {
      this.tint = 0xFFFFFFFF;
      this.alpha = 1;
      this.scale = 1;
      this.rotation = 0;
    }
  }

  clone() {
    return new GfxState(this);
  }

  getRotAs0to1() {
    return this.rotation / 360;
  }
}
