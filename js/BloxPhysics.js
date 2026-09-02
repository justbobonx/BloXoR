class BloxPhysics {
  constructor(game) {
    this.g = game;
    this.rand = Math.random;
    this.boomi = 0;
    this._cornering = false;
  }

  updateBlox() {
    const g = this.g;

    if (g.bloxO1 != null && g.bloxX != null && g.bloxO2 != null) {
      const oxDifx = Math.abs(g.bloxO1.pos.x - g.bloxX.pos.x);
      const oxDify = Math.abs(g.bloxO1.pos.y - g.bloxX.pos.y);
      const xoDifx = Math.abs(g.bloxO2.pos.x - g.bloxX.pos.x);
      const xoDify = Math.abs(g.bloxO2.pos.y - g.bloxX.pos.y);

      if ((oxDifx < 1 && xoDifx < 1 && oxDify < (g.bloxDist + 1) && xoDify < (g.bloxDist + 1)) ||
          (oxDify < 1 && xoDify < 1 && oxDifx < (g.bloxDist + 1) && xoDifx < (g.bloxDist + 1))) {
        g.soundManager.stopSound('sfx_slide');
        g.levelCompeted();
        return;
      }
    }

    g.modDownx = g.downx * g.BLOX_SPEED;
    g.modDowny = g.downy * g.BLOX_SPEED;
    const tiltDrive = g.input.tiltLive() && !g.input.usingManual();
    if (tiltDrive) {
      const flat = Math.max(0, Math.min(1, Math.abs(g.downz)));
      g.modFriction = g.TILT_FRICTION_MIN + (1 - flat) * g.TILT_FRICTION_RANGE;
    } else {
      g.modFriction = g.STICK_FRICTION;
    }

    const bloxList = [];

    for (let bi = 0; bi < g.moverBloxs.length; bi++) {
      let aBlox = g.moverBloxs[bi];

      g.field.giveMeListOfBloxInTheUnderfieldPointsFor(aBlox.pos.x, aBlox.pos.y, bloxList);

      let dead = false;
      for (let ubi = 0; ubi < bloxList.length && !dead; ubi++) {
        const uBlox = bloxList[ubi];
        if (uBlox.bloxType === BloxType.HOLE) {
          if (Math.abs(aBlox.pos.x - uBlox.pos.x) < g.HOLE_FALLIN_DIST &&
              Math.abs(aBlox.pos.y - uBlox.pos.y) < g.HOLE_FALLIN_DIST) {
            if (aBlox.bloxType === BloxType.POT_BRIDGE) {
              const bgx = Math.trunc((uBlox.pos.x - g.LEFT) / g.bloxDist);
              const bgy = Math.trunc((uBlox.pos.y - g.TOP) / g.bloxDist);
              const bgBlox = new Blox('Bridge');
              bgBlox.setPos(new Coord(g.LEFT + bgx * g.bloxDist, g.TOP + bgy * g.bloxDist));
              bgBlox.curGState.scale = g.theScale;
              const holeIdx = g.underBloxs.indexOf(uBlox);
              g.underBloxs.splice(holeIdx + 1, 0, bgBlox);
              BloxField._removeFrom(g.field.underfield[bgx][bgy], uBlox);

              const scloud = new Sprite(BitmapManager.getInstance().get('effect_cloud'), new Coord(g.LEFT + bgx * g.bloxDist, g.TOP + bgy * g.bloxDist));
              scloud.curGState.scale = 0.4;
              scloud.setAnimateDuration(300);
              const animateTo = new GfxState();
              animateTo.scale = 3;
              animateTo.alpha = 0;
              scloud.setAnimateGfxTo(animateTo);
              scloud.setAnimateCurve(Sprite.AnimateCurveType.EASE_OUT);
              scloud.setRemoveWhenDoneAnimating(true);
              scloud.startAnimation();
              g.effects.push(scloud);

              g.soundManager.playSound('sfx_thud');
              g.field.removeBloxFromTheWorld(aBlox);
              aBlox = null;
            } else {
              g.field.removeBloxFromTheWorld(aBlox);
              aBlox.setAnimateDuration(200);
              const animateTo = new GfxState();
              animateTo.scale = 0.1;
              animateTo.alpha = 0;
              aBlox.setAnimateGfxTo(animateTo);
              aBlox.setAnimatePosTo(new Coord(uBlox.pos.x, uBlox.pos.y));
              aBlox.setAnimateCurve(Sprite.AnimateCurveType.EASE_IN);
              aBlox.setRemoveWhenDoneAnimating(true);
              aBlox.startAnimation();
              g.effects.push(aBlox);
              g.soundManager.playSound('sfx_fall');
            }
            dead = true;
          }
        }
      }

      if (dead) {
        bi--;
        continue;
      }

      if (aBlox.exploding > 0 && aBlox.exploding++ > 3) {
        if (aBlox.bloxType === BloxType.BOMB || aBlox.bloxType === BloxType.BOMB_INACTIVE) {
          this.blowUpBlox(aBlox);
        }

        const ssplode = new Sprite(BitmapManager.getInstance().get('effect_explosion'), new Coord(aBlox.pos.x, aBlox.pos.y));
        ssplode.curGState.scale = 0.1;
        ssplode.setAnimateDuration(200);
        let animateTo = new GfxState();
        animateTo.scale = 1.5;
        animateTo.alpha = 0.5;
        ssplode.setAnimateGfxTo(animateTo);
        ssplode.setAnimateCurve(Sprite.AnimateCurveType.EASE_OUT);
        ssplode.setRemoveWhenDoneAnimating(true);
        ssplode.startAnimation();
        g.effects.push(ssplode);

        const scloud = new Sprite(BitmapManager.getInstance().get('effect_cloud'), new Coord(aBlox.pos.x, aBlox.pos.y));
        scloud.curGState.scale = 0.2;
        scloud.setAnimateDuration(600);
        animateTo = new GfxState();
        animateTo.scale = 2;
        animateTo.alpha = 0;
        scloud.setAnimateGfxTo(animateTo);
        scloud.setAnimateCurve(Sprite.AnimateCurveType.EASE_OUT);
        scloud.setRemoveWhenDoneAnimating(true);
        scloud.startAnimation();
        g.effects.push(scloud);

        this.boomi = (this.boomi + 1) % 2;
        g.soundManager.playSound(this.boomi === 0 ? 'sfx_boom' : 'sfx_boom2');

        g.field.removeBloxFromTheWorld(aBlox);
        aBlox = null;
        bi--;
        continue;
      }
    }

    g.updateCounter += 1;
    g.lastAnyMoving = g.anyMovingx + g.anyMovingy;
    g.anyMovingx = 0;
    g.anyMovingy = 0;
    g.anyStopped = 0;

    for (let bi = 0; bi < g.moverBloxs.length; bi++) {
      const aBlox = g.moverBloxs[bi];
      if (aBlox.updateCount < g.updateCounter) {
        this.updateTheBlox(aBlox);
      }
    }

    if (g.anyStopped > 0) {
      const rate = 0.9 + Math.random() * 0.2;
      g.soundManager.playSound('sfx_click1', rate, rate / 2, false);
    }

    let slideVol = 0;
    if (g.anyMovingx > 0) {
      if (g.anyMovingy > 0) slideVol = Math.max(Math.abs(g.downx), Math.abs(g.downy));
      else slideVol = Math.abs(g.downx);
    } else if (g.anyMovingy > 0) {
      slideVol = Math.abs(g.downy);
    }

    const pitchRate = 1.0 + (slideVol * 0.2);
    slideVol /= 3.0;

    if ((g.anyMovingx > 0 || g.anyMovingy > 0) && g.lastAnyMoving === 0) {
      g.soundManager.playSound('sfx_slide', pitchRate, slideVol, false);
    } else if (g.anyMovingx === 0 && g.anyMovingy === 0 && g.lastAnyMoving > 0) {
      g.soundManager.stopSound('sfx_slide');
    } else {
      g.soundManager.adjustSoundVolume('sfx_slide', slideVol / 3);
      g.soundManager.adjustSoundRate('sfx_slide', 1.0 + (slideVol * 0.2));
    }
  }

  _q(v) {
    return Math.trunc(v * this.g.BLOX_POS_PRECISION) / this.g.BLOX_POS_PRECISION;
  }

  _refreshFieldLocs(blox) {
    const oldSpots = blox.myFieldLocs.slice();
    blox.myFieldLocs.length = 0;
    const fieldSpots = [];
    this.g.field.giveMeListOfFieldPointsFor(blox.pos.x, blox.pos.y, fieldSpots);
    for (let i = 0; i < fieldSpots.length; i++) {
      const fieldSpot = fieldSpots[i];
      this.g.field.addBloxToField(blox, fieldSpot);
      const oi = oldSpots.indexOf(fieldSpot);
      if (oi >= 0) oldSpots.splice(oi, 1);
    }
    while (oldSpots.length > 0) {
      BloxField._removeFrom(oldSpots[0], blox);
      oldSpots.shift();
    }
  }

  _isOneWay(hit) {
    const t = hit.bloxType;
    return t === BloxType.OW_L || t === BloxType.OW_R || t === BloxType.OW_U || t === BloxType.OW_D;
  }

  _bumpXAt(ax, ay, hit, hx, hy) {
    const g = this.g;
    const dify = Math.abs(hy - ay);
    const difx = Math.abs(ax - hx);
    if (dify >= (g.bloxDistMin1 - 1.96) || difx >= g.bloxDistMin1) return false;

    if (hit.bloxType === BloxType.OW_L) {
      if (hx > ax && hx - ax >= g.bloxDistMin1) return true;
    } else if (hit.bloxType === BloxType.OW_R) {
      if (ax > hx && ax - hx >= g.bloxDistMin1) return true;
    } else if (hit.bloxType === BloxType.OW_U) {
      if (ay < hy && Math.abs(ax - hx) >= g.bloxDistMin1) return true;
    } else if (hit.bloxType === BloxType.OW_D) {
      if (ay > hy && Math.abs(ax - hx) >= g.bloxDistMin1) return true;
    } else {
      return true;
    }
    return false;
  }

  _bumpYAt(ax, ay, hit, hx, hy) {
    const g = this.g;
    const difx = Math.abs(hx - ax);
    const dify = Math.abs(ay - hy);
    if (difx >= (g.bloxDistMin1 - 1.96) || dify >= g.bloxDistMin1) return false;

    if (hit.bloxType === BloxType.OW_U) {
      if (hy > ay && hy - ay >= g.bloxDistMin1) return true;
    } else if (hit.bloxType === BloxType.OW_D) {
      if (ay > hy && ay - hy >= g.bloxDistMin1) return true;
    } else if (hit.bloxType === BloxType.OW_L) {
      if (ax < hx && Math.abs(ay - hy) >= g.bloxDistMin1) return true;
    } else if (hit.bloxType === BloxType.OW_R) {
      if (ax > hx && Math.abs(ay - hy) >= g.bloxDistMin1) return true;
    } else {
      return true;
    }
    return false;
  }

  _planPushX(blox, targetX, visiting, plan) {
    const g = this.g;
    targetX = this._q(targetX);
    if (visiting.has(blox)) return true;
    visiting.add(blox);
    if (targetX > g.RIGHT || targetX < g.LEFT) return false;

    if (blox.updateCount < g.updateCounter) this.updateTheBlox(blox);

    const curX = plan.has(blox) ? plan.get(blox) : blox.pos.x;
    plan.set(blox, targetX);
    if (Math.abs(targetX - curX) < 1 / g.BLOX_POS_PRECISION) return true;

    const consider = (hit) => {
      if (!hit || hit === blox) return true;
      const hitX = plan.has(hit) ? plan.get(hit) : hit.pos.x;
      if (!this._bumpXAt(targetX, blox.pos.y, hit, hitX, hit.pos.y)) return true;
      if (!hit.mover) return false;
      const hitTarget = targetX <= hitX ? targetX + g.bloxDistMin1 : targetX - g.bloxDistMin1;
      return this._planPushX(hit, hitTarget, visiting, plan);
    };

    const fieldBlox = [];
    g.field.giveMeListOfBloxInTheFieldPointsFor(targetX, blox.pos.y, fieldBlox);
    for (let i = 0; i < fieldBlox.length; i++) {
      if (!consider(fieldBlox[i])) return false;
    }
    for (let i = 0; i < g.moverBloxs.length; i++) {
      if (!consider(g.moverBloxs[i])) return false;
    }
    return true;
  }

  _planPushY(blox, targetY, visiting, plan) {
    const g = this.g;
    targetY = this._q(targetY);
    if (visiting.has(blox)) return true;
    visiting.add(blox);
    if (targetY > g.BOTTOM || targetY < g.TOP) return false;

    if (blox.updateCount < g.updateCounter) this.updateTheBlox(blox);

    const curY = plan.has(blox) ? plan.get(blox) : blox.pos.y;
    plan.set(blox, targetY);
    if (Math.abs(targetY - curY) < 1 / g.BLOX_POS_PRECISION) return true;

    const consider = (hit) => {
      if (!hit || hit === blox) return true;
      const hitY = plan.has(hit) ? plan.get(hit) : hit.pos.y;
      if (!this._bumpYAt(blox.pos.x, targetY, hit, hit.pos.x, hitY)) return true;
      if (!hit.mover) return false;
      const hitTarget = targetY <= hitY ? targetY + g.bloxDistMin1 : targetY - g.bloxDistMin1;
      return this._planPushY(hit, hitTarget, visiting, plan);
    };

    const fieldBlox = [];
    g.field.giveMeListOfBloxInTheFieldPointsFor(blox.pos.x, targetY, fieldBlox);
    for (let i = 0; i < fieldBlox.length; i++) {
      if (!consider(fieldBlox[i])) return false;
    }
    for (let i = 0; i < g.moverBloxs.length; i++) {
      if (!consider(g.moverBloxs[i])) return false;
    }
    return true;
  }

  _finishCorner(aBlox, oldX, oldY) {
    if (this._cornering) return;
    const g = this.g;
    const slip = g.bloxDistMin1 - 1.96;

    const hits = [];
    g.field.giveMeListOfBloxInTheFieldPointsFor(aBlox.pos.x, aBlox.pos.y, hits);

    let wall = null;
    let gapAxis = null;
    let best = 99;
    for (let i = 0; i < hits.length; i++) {
      const hit = hits[i];
      if (!hit || hit === aBlox || hit.mover || this._isOneWay(hit)) continue;
      const dx = Math.abs(aBlox.pos.x - hit.pos.x);
      const dy = Math.abs(aBlox.pos.y - hit.pos.y);
      if (dx < g.bloxDistMin1 && dy >= slip && dy < g.bloxDistMin1) {
        const need = g.bloxDistMin1 - dy;
        if (need < best) { best = need; wall = hit; gapAxis = 'y'; }
      }
      if (dy < g.bloxDistMin1 && dx >= slip && dx < g.bloxDistMin1) {
        const need = g.bloxDistMin1 - dx;
        if (need < best) { best = need; wall = hit; gapAxis = 'x'; }
      }
    }
    if (!wall || best > 2.05) return;

    this._cornering = true;
    const plan = new Map();
    let ok = false;
    if (gapAxis === 'y') {
      const rest = this._q(aBlox.pos.y <= wall.pos.y ? wall.pos.y - g.bloxDistMin1 : wall.pos.y + g.bloxDistMin1);
      ok = this._planPushY(aBlox, rest, new Set(), plan);
      this._cornering = false;
      if (ok) {
        plan.forEach((y, b) => {
          if (b.pos.y !== y) {
            b.pos.y = y;
            this._refreshFieldLocs(b);
          }
        });
      } else {
        aBlox.pos.x = oldX;
        aBlox.vel.x = 0;
        aBlox.movingx = 0;
      }
    } else {
      const rest = this._q(aBlox.pos.x <= wall.pos.x ? wall.pos.x - g.bloxDistMin1 : wall.pos.x + g.bloxDistMin1);
      ok = this._planPushX(aBlox, rest, new Set(), plan);
      this._cornering = false;
      if (ok) {
        plan.forEach((x, b) => {
          if (b.pos.x !== x) {
            b.pos.x = x;
            this._refreshFieldLocs(b);
          }
        });
      } else {
        aBlox.pos.y = oldY;
        aBlox.vel.y = 0;
        aBlox.movingy = 0;
      }
    }
  }

  updateTheBlox(aBlox) {
    const g = this.g;
    aBlox.updateCount = g.updateCounter;
    if (!aBlox.mover) return;

    const oldX = aBlox.pos.x;
    const oldY = aBlox.pos.y;

    aBlox.vel.x *= g.modFriction; if (Math.abs(aBlox.vel.x) < 1) aBlox.vel.x = 0.0;
    aBlox.vel.y *= g.modFriction; if (Math.abs(aBlox.vel.y) < 1) aBlox.vel.y = 0.0;

    aBlox.vel.x += g.modDownx;
    aBlox.vel.y += g.modDowny;

    if (Math.abs(aBlox.vel.x) > g.bloxDist) aBlox.vel.x = g.bloxDistMin1 * Math.sign(aBlox.vel.x);
    if (Math.abs(aBlox.vel.y) > g.bloxDist) aBlox.vel.y = g.bloxDistMin1 * Math.sign(aBlox.vel.y);

    let potNewX = this._q(aBlox.pos.x + aBlox.vel.x);
    let potNewY = this._q(aBlox.pos.y + aBlox.vel.y);

    const fieldBlox = [];
    let stoppedx = 0;
    let stoppedy = 0;

    const resolveX = () => {
      if (potNewX > g.RIGHT) {
        potNewX = g.RIGHT; aBlox.vel.x = 0; stoppedx += 1; aBlox.movingx = 0;
      } else if (potNewX < g.LEFT) {
        potNewX = g.LEFT; aBlox.vel.x = 0; stoppedx += 1; aBlox.movingx = 0;
      } else {
        g.field.giveMeListOfBloxInTheFieldPointsFor(potNewX, aBlox.pos.y, fieldBlox);
        for (let i = 0; i < fieldBlox.length; i++) {
          const hitBlox = fieldBlox[i];
          if (aBlox === hitBlox) continue;
          if (this.checkBumpX(aBlox, hitBlox, potNewX)) {
            if (hitBlox.mover && hitBlox.updateCount < g.updateCounter) {
              this.updateTheBlox(hitBlox);
              if (this.checkBumpX(aBlox, hitBlox, potNewX)) {
                if (potNewX <= hitBlox.pos.x) potNewX = hitBlox.pos.x - g.bloxDistMin1;
                else potNewX = hitBlox.pos.x + g.bloxDistMin1;
                aBlox.vel.x = hitBlox.vel.x;
                if (aBlox.vel.x === 0) stoppedx += 1;
              }
            } else if (this.checkBumpX(aBlox, hitBlox, potNewX)) {
              if (potNewX <= hitBlox.pos.x) potNewX = hitBlox.pos.x - g.bloxDistMin1;
              else potNewX = hitBlox.pos.x + g.bloxDistMin1;
              aBlox.vel.x = hitBlox.vel.x;
              if (aBlox.vel.x === 0) stoppedx += 1;
            }
          }
        }
        if (Math.abs(potNewX - aBlox.pos.x) > 0.0) aBlox.movingx += 1;
        else aBlox.movingx = 0;
      }
      aBlox.pos.x = potNewX;
    };

    const resolveY = () => {
      if (potNewY > g.BOTTOM) {
        potNewY = g.BOTTOM; aBlox.vel.y = 0; stoppedy += 1; aBlox.movingy = 0;
      } else if (potNewY < g.TOP) {
        potNewY = g.TOP; aBlox.vel.y = 0; stoppedy += 1; aBlox.movingy = 0;
      } else {
        g.field.giveMeListOfBloxInTheFieldPointsFor(aBlox.pos.x, potNewY, fieldBlox);
        for (let i = 0; i < fieldBlox.length; i++) {
          const hitBlox = fieldBlox[i];
          if (aBlox === hitBlox) continue;
          if (this.checkBumpY(aBlox, hitBlox, potNewY)) {
            if (hitBlox.mover && hitBlox.updateCount < g.updateCounter) {
              this.updateTheBlox(hitBlox);
              if (this.checkBumpY(aBlox, hitBlox, potNewY)) {
                if (potNewY <= hitBlox.pos.y) potNewY = hitBlox.pos.y - g.bloxDistMin1;
                else potNewY = hitBlox.pos.y + g.bloxDistMin1;
                aBlox.vel.y = hitBlox.vel.y;
                if (aBlox.vel.y === 0) stoppedy += 1;
              }
            } else if (this.checkBumpY(aBlox, hitBlox, potNewY)) {
              if (potNewY <= hitBlox.pos.y) potNewY = hitBlox.pos.y - g.bloxDistMin1;
              else potNewY = hitBlox.pos.y + g.bloxDistMin1;
              aBlox.vel.y = hitBlox.vel.y;
              if (aBlox.vel.y === 0) stoppedy += 1;
            }
          }
        }
        if (Math.abs(potNewY - aBlox.pos.y) > 0.0) aBlox.movingy += 1;
        else aBlox.movingy = 0;
      }
      aBlox.pos.y = potNewY;
    };

    if (Math.abs(g.downx) > Math.abs(g.downy)) {
      resolveX();
      resolveY();
    } else {
      resolveY();
      resolveX();
    }

    this._finishCorner(aBlox, oldX, oldY);

    if ((aBlox.movingx === 0 && aBlox.lastMovingx > 1 && stoppedx > 0) ||
        (aBlox.movingy === 0 && aBlox.lastMovingy > 1 && stoppedy > 0)) {
      g.anyStopped += 1;
    }

    aBlox.lastMovingx = aBlox.movingx;
    aBlox.lastMovingy = aBlox.movingy;
    g.anyMovingx += aBlox.movingx;
    g.anyMovingy += aBlox.movingy;

    this._refreshFieldLocs(aBlox);
  }

  checkBumpX(aBlox, hitBlox, potNewX) {
    return this._bumpXAt(potNewX, aBlox.pos.y, hitBlox, hitBlox.pos.x, hitBlox.pos.y);
  }

  checkBumpY(aBlox, hitBlox, potNewY) {
    return this._bumpYAt(aBlox.pos.x, potNewY, hitBlox, hitBlox.pos.x, hitBlox.pos.y);
  }

  blowUpBlox(b) {
    const g = this.g;
    if (b.exploding < 1) {
      b.exploding += 1;
      if (b.bolted != null) g.moverBloxs.push(b);
    }

    const tx = Math.trunc((b.pos.x - g.LEFT + g.bloxDistDiv2) / g.bloxDist);
    const ty = Math.trunc((b.pos.y - g.TOP + g.bloxDistDiv2) / g.bloxDist);

    if (tx > 0) this.splodeAt(tx - 1, ty);
    if (ty > 0) this.splodeAt(tx, ty - 1);
    if (ty < g.BLoxCntY - 1) this.splodeAt(tx, ty + 1);
    if (tx < g.BLoxCntX - 1) this.splodeAt(tx + 1, ty);
  }

  splodeAt(xi, yi) {
    const g = this.g;
    const explodeSpot = g.field.field[xi][yi];
    for (let ebi = 0; ebi < explodeSpot.length; ebi++) {
      const exBlox = explodeSpot[ebi];
      if (exBlox.bloxType === BloxType.BREAKER || exBlox.bloxType === BloxType.BOMB || exBlox.bloxType === BloxType.BOMB_INACTIVE) {
        if (exBlox.exploding < 1) {
          exBlox.exploding += 1;
          if (exBlox.bolted != null || exBlox.bloxType === BloxType.BREAKER) g.moverBloxs.push(exBlox);
        }
      }
    }
  }
}
