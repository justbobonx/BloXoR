class Sprite {
  constructor(bitmap, pos) {
    this.pos = pos ? new Coord(pos) : new Coord(0, 0);
    this.curGState = new GfxState();
    this.animateGfxStart = null;
    this.animateGfxTo = null;
    this.animatePosStart = null;
    this.animatePosTo = null;
    this.animating = false;
    this.removeWhenDoneAnimating = false;
    this.animateStartTime = 0;
    this.animateDuration = 0;
    this.animateCurve = Sprite.AnimateCurveType.LINEAR;
    this.outOfBounds = false;
    this.fallbackColor = null;
    this.fallbackLabel = '';
    this.setBitmap(bitmap || null);
  }

  setBitmap(b) {
    this.bitmap = b || null;
    if (b) {
      this.bOff = new Coord(b.width / 2, b.height / 2);
    } else {
      this.bOff = new Coord(20, 20);
    }
  }

  getWidth() {
    if (this.bitmap) return this.bitmap.width * this.curGState.scale;
    return 40 * this.curGState.scale;
  }

  getHeight() {
    if (this.bitmap) return this.bitmap.height * this.curGState.scale;
    return 40 * this.curGState.scale;
  }

  setPos(newPos) {
    this.pos = newPos;
  }

  isOutOfBounds() {
    return this.outOfBounds;
  }

  isAnimating() {
    return this.animating;
  }

  shouldRemoveWhenDoneAnimating() {
    return this.removeWhenDoneAnimating;
  }

  setRemoveWhenDoneAnimating(v) {
    this.removeWhenDoneAnimating = v;
  }

  setAnimateGfxTo(gs) {
    this.animateGfxTo = gs;
  }

  setAnimatePosTo(c) {
    this.animatePosTo = c;
  }

  setAnimateDuration(ms) {
    this.animateDuration = ms;
  }

  setAnimateCurve(curve) {
    this.animateCurve = curve;
  }

  startAnimation() {
    this.animateStartTime = performance.now();
    if (this.animateGfxTo != null) this.animateGfxStart = new GfxState(this.curGState);
    if (this.animatePosTo != null) this.animatePosStart = new Coord(this.pos);
    this.animating = true;
  }

  interpolate(t, start, end) {
    if (this.animateCurve === Sprite.AnimateCurveType.EASE_IN) {
      return (end - start) * (t * t) + start;
    }
    if (this.animateCurve === Sprite.AnimateCurveType.EASE_OUT) {
      t = t - 1;
      return (end - start) * (-(t * t) + 1) + start;
    }
    return (end - start) * t + start;
  }

  updateAnimation(now) {
    if (!this.animating) return;
    const curDur = now - this.animateStartTime;
    let t = curDur / this.animateDuration;
    if (t > 1.0) t = 1;

    if (this.animateGfxStart != null) {
      this.curGState.alpha = this.interpolate(t, this.animateGfxStart.alpha, this.animateGfxTo.alpha);
      this.curGState.scale = this.interpolate(t, this.animateGfxStart.scale, this.animateGfxTo.scale);
      this.curGState.rotation = this.interpolate(t, this.animateGfxStart.getRotAs0to1(), this.animateGfxTo.getRotAs0to1()) * 360;
    }
    if (this.animatePosStart != null) {
      this.pos.x = this.interpolate(t, this.animatePosStart.x, this.animatePosTo.x);
      this.pos.y = this.interpolate(t, this.animatePosStart.y, this.animatePosTo.y);
    }
    if (curDur >= this.animateDuration) {
      this.animating = false;
      this.animateGfxStart = null;
      this.animateGfxTo = null;
      this.animatePosStart = null;
      this.animatePosTo = null;
    }
  }

  draw(ctx) {
    this.updateAnimation(performance.now());

    const s = this.curGState.scale;
    ctx.save();
    ctx.globalAlpha = this.curGState.alpha;

    if (this.curGState.rotation !== 0) {
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate((this.curGState.rotation * Math.PI) / 180);
      ctx.translate(-this.pos.x, -this.pos.y);
    }

    if (this.bitmap) {
      const dx = this.pos.x - this.bOff.x * s;
      const dy = this.pos.y - this.bOff.y * s;
      ctx.drawImage(this.bitmap, dx, dy, this.bitmap.width * s, this.bitmap.height * s);
    } else {
      const w = 40 * s;
      const h = 40 * s;
      const dx = this.pos.x - w / 2;
      const dy = this.pos.y - h / 2;
      ctx.fillStyle = this.fallbackColor || '#888';
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = Math.max(1, 2 * s);
      const r = 6 * s;
      ctx.beginPath();
      ctx.roundRect(dx, dy, w, h, r);
      ctx.fill();
      ctx.stroke();
      if (this.fallbackLabel) {
        ctx.fillStyle = '#111';
        ctx.font = 'bold ' + Math.max(10, 14 * s) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.fallbackLabel, this.pos.x, this.pos.y);
      }
    }

    ctx.restore();
  }
}

Sprite.AnimateCurveType = {
  LINEAR: 'LINEAR',
  EASE_IN: 'EASE_IN',
  EASE_OUT: 'EASE_OUT'
};
