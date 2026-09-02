class BloxPhysics {
  constructor(game) {
    this.g = game;
    this.rand = Math.random;
    this.boomi = 0;
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

  _isFaceX(aBlox, hitBlox) {
    const slip = this.g.bloxDistMin1 - 1.96;
    return Math.abs(hitBlox.pos.y - aBlox.pos.y) < slip - 2;
  }

  _isFaceY(aBlox, hitBlox) {
    const slip = this.g.bloxDistMin1 - 1.96;
    return Math.abs(hitBlox.pos.x - aBlox.pos.x) < slip - 2;
  }

  _tryShoveMoverX(blox, targetX, visiting) {
    const g = this.g;
    targetX = this._q(targetX);
    if (visiting.has(blox)) return true;
    visiting.add(blox);
    if (Math.abs(targetX - blox.pos.x) < 1 / g.BLOX_POS_PRECISION) return true;
    if (targetX > g.RIGHT || targetX < g.LEFT) return false;

    const fieldBlox = [];
    g.field.giveMeListOfBloxInTheFieldPointsFor(targetX, blox.pos.y, fieldBlox);
    const seen = new Set();
    const pushes = [];
    const consider = (hit) => {
      if (!hit || hit === blox || seen.has(hit)) return true;
      seen.add(hit);
      if (!this._isFaceX(blox, hit) || !this.checkBumpX(blox, hit, targetX)) return true;
      if (!hit.mover) return false;
      const hitTarget = targetX <= hit.pos.x ? targetX + g.bloxDistMin1 : targetX - g.bloxDistMin1;
      pushes.push([hit, hitTarget]);
      return true;
    };
    for (let i = 0; i < fieldBlox.length; i++) {
      if (!consider(fieldBlox[i])) return false;
    }
    for (let i = 0; i < g.moverBloxs.length; i++) {
      if (!consider(g.moverBloxs[i])) return false;
    }
    for (let i = 0; i < pushes.length; i++) {
      if (!this._tryShoveMoverX(pushes[i][0], pushes[i][1], visiting)) return false;
    }
    blox.pos.x = targetX;
    blox.vel.x = 0;
    blox.updateCount = g.updateCounter;
    this._refreshFieldLocs(blox);
    return true;
  }

  _tryShoveMoverY(blox, targetY, visiting) {
    const g = this.g;
    targetY = this._q(targetY);
    if (visiting.has(blox)) return true;
    visiting.add(blox);
    if (Math.abs(targetY - blox.pos.y) < 1 / g.BLOX_POS_PRECISION) return true;
    if (targetY > g.BOTTOM || targetY < g.TOP) return false;

    const fieldBlox = [];
    g.field.giveMeListOfBloxInTheFieldPointsFor(blox.pos.x, targetY, fieldBlox);
    const seen = new Set();
    const pushes = [];
    const consider = (hit) => {
      if (!hit || hit === blox || seen.has(hit)) return true;
      seen.add(hit);
      if (!this._isFaceY(blox, hit) || !this.checkBumpY(blox, hit, targetY)) return true;
      if (!hit.mover) return false;
      const hitTarget = targetY <= hit.pos.y ? targetY + g.bloxDistMin1 : targetY - g.bloxDistMin1;
      pushes.push([hit, hitTarget]);
      return true;
    };
    for (let i = 0; i < fieldBlox.length; i++) {
      if (!consider(fieldBlox[i])) return false;
    }
    for (let i = 0; i < g.moverBloxs.length; i++) {
      if (!consider(g.moverBloxs[i])) return false;
    }
    for (let i = 0; i < pushes.length; i++) {
      if (!this._tryShoveMoverY(pushes[i][0], pushes[i][1], visiting)) return false;
    }
    blox.pos.y = targetY;
    blox.vel.y = 0;
    blox.updateCount = g.updateCounter;
    this._refreshFieldLocs(blox);
    return true;
  }

  _shoveOutFromX(aBlox, newX) {
    const g = this.g;
    const moveDir = Math.sign(newX - aBlox.pos.x);
    if (moveDir === 0) return true;
    const visiting = new Set([aBlox]);
    const seen = new Set();
    for (let i = 0; i < g.moverBloxs.length; i++) {
      const hit = g.moverBloxs[i];
      if (hit === aBlox || seen.has(hit)) continue;
      seen.add(hit);
      if ((hit.pos.x - aBlox.pos.x) * moveDir <= 0) continue;
      if (!this._isFaceX(aBlox, hit) || !this.checkBumpX(aBlox, hit, newX)) continue;
      const hitTarget = newX <= hit.pos.x ? newX + g.bloxDistMin1 : newX - g.bloxDistMin1;
      if (!this._tryShoveMoverX(hit, hitTarget, visiting)) return false;
    }
    return true;
  }

  _shoveOutFromY(aBlox, newY) {
    const g = this.g;
    const moveDir = Math.sign(newY - aBlox.pos.y);
    if (moveDir === 0) return true;
    const visiting = new Set([aBlox]);
    const seen = new Set();
    for (let i = 0; i < g.moverBloxs.length; i++) {
      const hit = g.moverBloxs[i];
      if (hit === aBlox || seen.has(hit)) continue;
      seen.add(hit);
      if ((hit.pos.y - aBlox.pos.y) * moveDir <= 0) continue;
      if (!this._isFaceY(aBlox, hit) || !this.checkBumpY(aBlox, hit, newY)) continue;
      const hitTarget = newY <= hit.pos.y ? newY + g.bloxDistMin1 : newY - g.bloxDistMin1;
      if (!this._tryShoveMoverY(hit, hitTarget, visiting)) return false;
    }
    return true;
  }

  updateTheBlox(aBlox) {
    const g = this.g;
    aBlox.updateCount = g.updateCounter;
    if (!aBlox.mover) return;

    aBlox.vel.x *= g.modFriction; if (Math.abs(aBlox.vel.x) < 1) aBlox.vel.x = 0.0;
    aBlox.vel.y *= g.modFriction; if (Math.abs(aBlox.vel.y) < 1) aBlox.vel.y = 0.0;

    aBlox.vel.x += g.modDownx;
    aBlox.vel.y += g.modDowny;

    if (Math.abs(aBlox.vel.x) > g.bloxDist) aBlox.vel.x = g.bloxDistMin1 * Math.sign(aBlox.vel.x);
    if (Math.abs(aBlox.vel.y) > g.bloxDist) aBlox.vel.y = g.bloxDistMin1 * Math.sign(aBlox.vel.y);

    const q = (v) => this._q(v);
    let potNewX = q(aBlox.pos.x + aBlox.vel.x);
    let potNewY = q(aBlox.pos.y + aBlox.vel.y);

    const fieldBlox = [];
    let stoppedx = 0;
    let stoppedy = 0;
    let pinnedX = false;
    let pinnedY = false;
    const WIGGLE = 1.96;
    const slip = g.bloxDistMin1 - WIGGLE;

    const glueX = (hitBlox) => {
      const dify = Math.abs(hitBlox.pos.y - aBlox.pos.y);
      const rest = q(potNewX <= hitBlox.pos.x ? hitBlox.pos.x - g.bloxDistMin1 : hitBlox.pos.x + g.bloxDistMin1);
      if (dify >= slip - 2) {
        if (Math.abs(potNewX - hitBlox.pos.x) < Math.abs(aBlox.pos.x - hitBlox.pos.x)) potNewX = q(aBlox.pos.x);
        aBlox.vel.x = 0;
        if (!hitBlox.mover) pinnedX = true;
        stoppedx += 1;
        return;
      }
      if (!hitBlox.mover) {
        if (!this._shoveOutFromX(aBlox, rest)) {
          potNewX = q(aBlox.pos.x);
        } else {
          potNewX = rest;
        }
        aBlox.vel.x = 0;
        pinnedX = true;
        stoppedx += 1;
        return;
      }
      if (pinnedX) {
        const moveDir = Math.sign(potNewX - aBlox.pos.x);
        if (moveDir !== 0 && (hitBlox.pos.x - aBlox.pos.x) * moveDir > 0) {
          const hitTarget = potNewX <= hitBlox.pos.x ? potNewX + g.bloxDistMin1 : potNewX - g.bloxDistMin1;
          if (!this._tryShoveMoverX(hitBlox, hitTarget, new Set([aBlox]))) {
            potNewX = q(aBlox.pos.x);
          }
        }
        aBlox.vel.x = 0;
        stoppedx += 1;
        return;
      }
      potNewX = rest;
      aBlox.vel.x = hitBlox.vel.x;
      if (aBlox.vel.x === 0) stoppedx += 1;
    };
    const glueY = (hitBlox) => {
      const difx = Math.abs(hitBlox.pos.x - aBlox.pos.x);
      const rest = q(potNewY <= hitBlox.pos.y ? hitBlox.pos.y - g.bloxDistMin1 : hitBlox.pos.y + g.bloxDistMin1);
      if (difx >= slip - 2) {
        if (Math.abs(potNewY - hitBlox.pos.y) < Math.abs(aBlox.pos.y - hitBlox.pos.y)) potNewY = q(aBlox.pos.y);
        aBlox.vel.y = 0;
        if (!hitBlox.mover) pinnedY = true;
        stoppedy += 1;
        return;
      }
      if (!hitBlox.mover) {
        if (!this._shoveOutFromY(aBlox, rest)) {
          potNewY = q(aBlox.pos.y);
        } else {
          potNewY = rest;
        }
        aBlox.vel.y = 0;
        pinnedY = true;
        stoppedy += 1;
        return;
      }
      if (pinnedY) {
        const moveDir = Math.sign(potNewY - aBlox.pos.y);
        if (moveDir !== 0 && (hitBlox.pos.y - aBlox.pos.y) * moveDir > 0) {
          const hitTarget = potNewY <= hitBlox.pos.y ? potNewY + g.bloxDistMin1 : potNewY - g.bloxDistMin1;
          if (!this._tryShoveMoverY(hitBlox, hitTarget, new Set([aBlox]))) {
            potNewY = q(aBlox.pos.y);
          }
        }
        aBlox.vel.y = 0;
        stoppedy += 1;
        return;
      }
      potNewY = rest;
      aBlox.vel.y = hitBlox.vel.y;
      if (aBlox.vel.y === 0) stoppedy += 1;
    };

    const resolveX = () => {
      if (potNewX > g.RIGHT) {
        if (!this._shoveOutFromX(aBlox, g.RIGHT)) potNewX = q(aBlox.pos.x);
        else potNewX = g.RIGHT;
        aBlox.vel.x = 0; stoppedx += 1; aBlox.movingx = 0; pinnedX = true;
      } else if (potNewX < g.LEFT) {
        if (!this._shoveOutFromX(aBlox, g.LEFT)) potNewX = q(aBlox.pos.x);
        else potNewX = g.LEFT;
        aBlox.vel.x = 0; stoppedx += 1; aBlox.movingx = 0; pinnedX = true;
      } else {
        g.field.giveMeListOfBloxInTheFieldPointsFor(potNewX, aBlox.pos.y, fieldBlox);
        for (let i = 0; i < fieldBlox.length; i++) {
          const hitBlox = fieldBlox[i];
          if (aBlox === hitBlox) continue;
          if (this.checkBumpX(aBlox, hitBlox, potNewX)) {
            if (hitBlox.mover && hitBlox.updateCount < g.updateCounter) {
              this.updateTheBlox(hitBlox);
              if (this.checkBumpX(aBlox, hitBlox, potNewX)) glueX(hitBlox);
            } else if (this.checkBumpX(aBlox, hitBlox, potNewX)) {
              glueX(hitBlox);
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
        if (!this._shoveOutFromY(aBlox, g.BOTTOM)) potNewY = q(aBlox.pos.y);
        else potNewY = g.BOTTOM;
        aBlox.vel.y = 0; stoppedy += 1; aBlox.movingy = 0; pinnedY = true;
      } else if (potNewY < g.TOP) {
        if (!this._shoveOutFromY(aBlox, g.TOP)) potNewY = q(aBlox.pos.y);
        else potNewY = g.TOP;
        aBlox.vel.y = 0; stoppedy += 1; aBlox.movingy = 0; pinnedY = true;
      } else {
        g.field.giveMeListOfBloxInTheFieldPointsFor(aBlox.pos.x, potNewY, fieldBlox);
        for (let i = 0; i < fieldBlox.length; i++) {
          const hitBlox = fieldBlox[i];
          if (aBlox === hitBlox) continue;
          if (this.checkBumpY(aBlox, hitBlox, potNewY)) {
            if (hitBlox.mover && hitBlox.updateCount < g.updateCounter) {
              this.updateTheBlox(hitBlox);
              if (this.checkBumpY(aBlox, hitBlox, potNewY)) glueY(hitBlox);
            } else if (this.checkBumpY(aBlox, hitBlox, potNewY)) {
              glueY(hitBlox);
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
    const g = this.g;
    const dify = Math.abs(hitBlox.pos.y - aBlox.pos.y);
    const difx = Math.abs(potNewX - hitBlox.pos.x);

    if (dify >= (g.bloxDistMin1 - 1.96) || difx >= g.bloxDistMin1) return false;

    if (hitBlox.bloxType === BloxType.OW_L) {
      if (hitBlox.pos.x > potNewX && hitBlox.pos.x - aBlox.pos.x >= g.bloxDistMin1) return true;
    } else if (hitBlox.bloxType === BloxType.OW_R) {
      if (potNewX > hitBlox.pos.x && aBlox.pos.x - hitBlox.pos.x >= g.bloxDistMin1) return true;
    } else if (hitBlox.bloxType === BloxType.OW_U) {
      if (aBlox.pos.y < hitBlox.pos.y) {
        if (Math.abs(aBlox.pos.x - hitBlox.pos.x) >= g.bloxDistMin1) return true;
      }
    } else if (hitBlox.bloxType === BloxType.OW_D) {
      if (aBlox.pos.y > hitBlox.pos.y) {
        if (Math.abs(aBlox.pos.x - hitBlox.pos.x) >= g.bloxDistMin1) return true;
      }
    } else {
      return true;
    }
    return false;
  }

  checkBumpY(aBlox, hitBlox, potNewY) {
    const g = this.g;
    const difx = Math.abs(hitBlox.pos.x - aBlox.pos.x);
    const dify = Math.abs(potNewY - hitBlox.pos.y);

    if (difx >= (g.bloxDistMin1 - 1.96) || dify >= g.bloxDistMin1) return false;

    if (hitBlox.bloxType === BloxType.OW_U) {
      if (hitBlox.pos.y > potNewY && hitBlox.pos.y - aBlox.pos.y >= g.bloxDistMin1) return true;
    } else if (hitBlox.bloxType === BloxType.OW_D) {
      if (potNewY > hitBlox.pos.y && aBlox.pos.y - hitBlox.pos.y >= g.bloxDistMin1) return true;
    } else if (hitBlox.bloxType === BloxType.OW_L) {
      if (aBlox.pos.x < hitBlox.pos.x) {
        if (Math.abs(aBlox.pos.y - hitBlox.pos.y) >= g.bloxDistMin1) return true;
      }
    } else if (hitBlox.bloxType === BloxType.OW_R) {
      if (aBlox.pos.x > hitBlox.pos.x) {
        if (Math.abs(aBlox.pos.y - hitBlox.pos.y) >= g.bloxDistMin1) return true;
      }
    } else {
      return true;
    }
    return false;
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
