class BloxInput {
  constructor(game) {
    this.g = game;
    this.keys = Object.create(null);
    this.pointerDown = false;
    this.dragOrigin = null;
    this.KEY_TILT = 0.12;
    this.KEY_TILT_HARD = 0.26;
    this.MOUSE_MAX = 0.25;
    this.MOUSE_DEAD_PX = 10;
    this.MOUSE_FULL_PX = 90;
    this.joyLev = 0.20;
    this.joyPow = 0.12;
    this.MENU_STICK = 0.55;
    this.padIndex = -1;
    this.startHeld = false;
    this.aHeld = false;
    this.bHeld = false;
    this.actHeld = false;
    this.iaDirHeld = '';

    this.tiltAttached = false;
    this.tiltDenied = false;
    this.tiltBusy = false;
    this.lastTiltAt = 0;
    this.lastMotionWasGravity = false;
    this.lastdx = 0;
    this.lastdy = 0;
    this.lastdz = 0;
    this.lastdx2 = 0;
    this.lastdy2 = 0;
    this.lastdz2 = 0;
    this.onMotion = (e) => this.handleMotion(e);
    this.onOrient = (e) => this.handleOrientation(e);
  }

  attach(canvas) {
    const g = this.g;
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'Enter', 'NumpadEnter'].indexOf(e.code) >= 0) {
        e.preventDefault();
      }
      if (e.code === 'Escape') g.backPressed();
      const inPlay = g.gameState === GameState.InPlay || g.gameState === GameState.WaitToStartNewLevel;
      if ((e.code === 'Enter' || e.code === 'NumpadEnter') && inPlay && !g.ui.menuOpen()) {
        g.backPressed();
        return;
      }
      if (e.code === 'Space' && g.gameState === GameState.InPlay && !g.ui.menuOpen()) {
        if (g.waitingOnAct) g.confirmInteract();
        else g.beginInteract();
        return;
      }
      if (!g.ui.menuOpen() && !g.waitingOnAct) this.applyKeys();
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (!g.ui.menuOpen() && !g.waitingOnAct) this.applyKeys();
    });

    window.addEventListener('gamepadconnected', (e) => {
      if (this.padIndex < 0) this.padIndex = e.gamepad.index;
    });
    window.addEventListener('gamepaddisconnected', (e) => {
      if (this.padIndex === e.gamepad.index) this.padIndex = -1;
    });

    document.addEventListener('pointerdown', () => { this.enableTilt(); }, true);

    const onDown = (ev) => {
      this.pointerDown = true;
      const rect = canvas.getBoundingClientRect();
      this.dragOrigin = {
        x: ev.clientX - rect.left,
        y: ev.clientY - rect.top
      };
      this.handlePointer(ev, canvas, 'down');
    };
    const onMove = (ev) => {
      if (!this.pointerDown) return;
      this.handlePointer(ev, canvas, 'move');
    };
    const onUp = (ev) => {
      this.pointerDown = false;
      this.dragOrigin = null;
      this.handlePointer(ev, canvas, 'up');
    };

    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  toWorld(ev, canvas) {
    const g = this.g;
    const rect = canvas.getBoundingClientRect();
    const cssX = ev.clientX - rect.left;
    const cssY = ev.clientY - rect.top;
    const cx = cssX * (canvas.width / rect.width);
    const cy = cssY * (canvas.height / rect.height);
    const scale = g.viewScale || 1;
    return {
      x: (cx - (g.viewOx || 0)) / scale,
      y: (cy - (g.viewOy || 0)) / scale,
      cssX,
      cssY
    };
  }

  enableTilt() {
    if (this.tiltAttached || this.tiltDenied || this.tiltBusy) return;
    this.tiltBusy = true;
    const finish = (ok) => {
      this.tiltBusy = false;
      if (!ok) {
        this.tiltDenied = true;
        return;
      }
      this.attachMotion();
    };

    const motionNeed = window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function';
    const orientNeed = window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function';
    if (!motionNeed && !orientNeed) {
      finish(true);
      return;
    }

    const ask = (Ctor) => {
      if (!Ctor || typeof Ctor.requestPermission !== 'function') return Promise.resolve('granted');
      return Ctor.requestPermission().catch(() => 'denied');
    };

    ask(window.DeviceMotionEvent).then((motionState) => {
      if (motionState === 'granted') {
        finish(true);
        return;
      }
      return ask(window.DeviceOrientationEvent).then((orientState) => {
        finish(orientState === 'granted');
      });
    });
  }

  attachMotion() {
    if (this.tiltAttached) return;
    this.tiltAttached = true;
    window.addEventListener('devicemotion', this.onMotion, true);
    window.addEventListener('deviceorientation', this.onOrient, true);
  }

  tiltLive() {
    return this.lastTiltAt > 0 && (Date.now() - this.lastTiltAt) < 400;
  }

  usingManual() {
    return this.pointerDown || this.anyDirKey() || !!this.readStick();
  }

  anyDirKey() {
    return !!(this.keys.ArrowLeft || this.keys.ArrowRight || this.keys.ArrowUp || this.keys.ArrowDown ||
      this.keys.KeyA || this.keys.KeyD || this.keys.KeyW || this.keys.KeyS);
  }

  screenAngle() {
    if (screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle;
    if (typeof window.orientation === 'number') return window.orientation;
    return window.innerWidth > window.innerHeight ? 90 : 0;
  }

  remapToScreen(gx, gy) {
    const a = ((this.screenAngle() % 360) + 360) % 360;
    if (a === 90) return { x: gy, y: -gx };
    if (a === 180) return { x: -gx, y: -gy };
    if (a === 270) return { x: -gy, y: gx };
    return { x: gx, y: gy };
  }

  applyTiltGs(accx, accy, accz) {
    const g = this.g;
    if (g.ui.menuOpen() || g.waitingOnAct || this.usingManual()) return;

    let downx = (accx + this.lastdx + this.lastdx2) / 3;
    let downy = (accy + this.lastdy + this.lastdy2) / 3;
    let downz = (accz + this.lastdz + this.lastdz2) / 3;

    accx = Math.max(-1, Math.min(1, accx));
    accy = Math.max(-1, Math.min(1, accy));
    accz = Math.max(-1, Math.min(1, accz));

    const span = g.FLAT_SPAN;
    const start = g.FLAT_START;
    if (Math.abs(downx) < span) downx = 0;
    else if (downx > 0) downx -= start;
    else downx += start;
    if (Math.abs(downy) < span) downy = 0;
    else if (downy > 0) downy -= start;
    else downy += start;

    this.lastdx2 = this.lastdx;
    this.lastdy2 = this.lastdy;
    this.lastdz2 = this.lastdz;
    this.lastdx = accx;
    this.lastdy = accy;
    this.lastdz = accz;

    g.downx = downx;
    g.downy = downy;
    g.downz = downz;
    this.lastTiltAt = Date.now();
    g.updateMoveCnt();
  }

  handleMotion(e) {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null) return;
    this.lastMotionWasGravity = true;
    const mapped = this.remapToScreen(a.x / 9.81, a.y / 9.81);
    const accz = (a.z == null ? 0 : a.z) / 9.81;
    this.applyTiltGs(mapped.x, mapped.y, accz);
  }

  handleOrientation(e) {
    if (this.lastMotionWasGravity) return;
    if (e.gamma == null || e.beta == null) return;
    const mapped = this.remapToScreen(e.gamma / 45, e.beta / 45);
    const accz = 1 - Math.min(1, Math.sqrt(mapped.x * mapped.x + mapped.y * mapped.y));
    this.applyTiltGs(mapped.x, mapped.y, accz);
  }

  poll() {
    if (this.g.ui.menuOpen()) {
      this.g.downx = 0;
      this.g.downy = 0;
      return;
    }
    if (this.g.waitingOnAct) {
      this.g.downx = 0;
      this.g.downy = 0;
      this.pollInteractMove();
      this.pollAct();
      this.pollStart();
      return;
    }
    if (this.pointerDown) {
      this.pollAct();
      this.pollStart();
      return;
    }
    const stick = this.readStick();
    if (stick) {
      this.g.downx = stick.x;
      this.g.downy = stick.y;
      this.g.updateMoveCnt();
      this.pollAct();
      this.pollStart();
      return;
    }
    if (this.anyDirKey()) {
      this.applyKeys();
      this.pollAct();
      this.pollStart();
      return;
    }
    if (this.tiltLive()) {
      this.pollAct();
      this.pollStart();
      return;
    }
    this.applyKeys();
    this.pollAct();
    this.pollStart();
  }

  pollAct() {
    if (this.g.gameState !== GameState.InPlay) {
      this.actHeld = this.actDown();
      return;
    }
    const held = this.actDown();
    if (held && !this.actHeld) {
      if (this.g.waitingOnAct) this.g.confirmInteract();
      else this.g.beginInteract();
    }
    this.actHeld = held;
  }

  actDown() {
    const pad = this.currentPad();
    const btnA = !!(pad && pad.buttons && pad.buttons[0] && pad.buttons[0].pressed);
    return !!(this.keys.Space || btnA);
  }

  pollInteractMove() {
    const pad = this.currentPad();
    const btn = (i) => !!(pad && pad.buttons && pad.buttons[i] && pad.buttons[i].pressed);
    const ax = (pad && pad.axes && pad.axes.length >= 2) ? pad.axes : [0, 0];
    let dir = '';
    if (this.keys.ArrowDown || this.keys.KeyS || btn(13) || ax[1] > this.MENU_STICK) dir = 'down';
    else if (this.keys.ArrowUp || this.keys.KeyW || btn(12) || ax[1] < -this.MENU_STICK) dir = 'up';
    else if (this.keys.ArrowLeft || this.keys.KeyA || btn(14) || ax[0] < -this.MENU_STICK) dir = 'left';
    else if (this.keys.ArrowRight || this.keys.KeyD || btn(15) || ax[0] > this.MENU_STICK) dir = 'right';
    if (dir && dir !== this.iaDirHeld) this.g.stepInteract(dir);
    this.iaDirHeld = dir;
  }

  menuButtons() {
    const pad = this.currentPad();
    const btn = (i) => !!(pad && pad.buttons && pad.buttons[i] && pad.buttons[i].pressed);
    const ax = (pad && pad.axes && pad.axes.length >= 2) ? pad.axes : [0, 0];
    const up = this.keys.ArrowUp || this.keys.KeyW || btn(12) || ax[1] < -this.MENU_STICK;
    const down = this.keys.ArrowDown || this.keys.KeyS || btn(13) || ax[1] > this.MENU_STICK;
    const left = this.keys.ArrowLeft || this.keys.KeyA || btn(14) || ax[0] < -this.MENU_STICK;
    const right = this.keys.ArrowRight || this.keys.KeyD || btn(15) || ax[0] > this.MENU_STICK;
    const activateHeld = this.keys.Enter || this.keys.NumpadEnter || this.keys.Space || btn(0);
    const backHeld = btn(1);
    const activate = activateHeld && !this.aHeld;
    const back = backHeld && !this.bHeld;
    this.aHeld = activateHeld;
    this.bHeld = backHeld;
    return { up, down, left, right, activate, back };
  }

  readStick() {
    const pad = this.currentPad();
    if (!pad || !pad.axes || pad.axes.length < 2) return null;
    const x = this.axisToTilt(pad.axes[0]);
    const y = this.axisToTilt(pad.axes[1]);
    if (x === 0 && y === 0) return null;
    return { x, y };
  }

  currentPad() {
    let pads = [];
    try {
      pads = navigator.getGamepads ? navigator.getGamepads() : [];
    } catch (err) {
      return null;
    }
    if (this.padIndex >= 0 && pads[this.padIndex]) return pads[this.padIndex];
    for (let i = 0; i < pads.length; i++) {
      if (pads[i] && pads[i].axes && pads[i].axes.length >= 2) {
        this.padIndex = i;
        return pads[i];
      }
    }
    return null;
  }

  axisToTilt(v) {
    if (!isFinite(v)) return 0;
    const jl = this.joyLev;
    const p = this.joyPow;
    if (Math.abs(v) < jl) return 0;
    return (Math.abs(v) - jl) * Math.sign(v) * (p / (1 - jl));
  }

  pollStart() {
    if (this.g.ui.menuOpen()) return;
    const pad = this.currentPad();
    const btn = (i) => !!(pad && pad.buttons && pad.buttons[i] && pad.buttons[i].pressed);
    const pauseHeld = btn(9) || btn(1);
    if (pauseHeld && !this.startHeld) this.g.backPressed();
    this.startHeld = pauseHeld;
  }

  applyKeys() {
    const g = this.g;
    if (this.pointerDown || g.ui.menuOpen() || g.waitingOnAct) return;
    const hard = this.keys.ShiftLeft || this.keys.ShiftRight;
    const mag = hard ? this.KEY_TILT_HARD : this.KEY_TILT;
    let x = 0;
    let y = 0;
    if (this.keys.ArrowLeft || this.keys.KeyA) x -= mag;
    if (this.keys.ArrowRight || this.keys.KeyD) x += mag;
    if (this.keys.ArrowUp || this.keys.KeyW) y -= mag;
    if (this.keys.ArrowDown || this.keys.KeyS) y += mag;
    g.downx = x;
    g.downy = y;
    g.updateMoveCnt();
  }

  handlePointer(ev, canvas, phase) {
    const g = this.g;
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const world = this.toWorld(ev, canvas);

    if (g.gameState === GameState.LevelBeat) {
      if (phase === 'down') {
        g.gameState = GameState.NoDraw;
        g.ui.closeScore();
        g.ui.showLevelSelect();
      }
      return;
    }

    if (g.gameState === GameState.InPlay && phase === 'up') {
      const tx = Math.trunc((world.x - g.LEFT + g.bloxDistDiv2) / g.bloxDist);
      const ty = Math.trunc((world.y - g.TOP + g.bloxDistDiv2) / g.bloxDist);
      if (tx >= 0 && tx < g.BLoxCntX && ty >= 0 && ty < g.BLoxCntY) {
        const tspot = g.field.field[tx][ty];
        for (let i = 0; i < tspot.length; i++) {
          const b = tspot[i];
          if (b.bloxType === BloxType.BOMB) {
            if (Math.abs(world.x - b.pos.x) < g.bloxDistDiv2 && Math.abs(world.y - b.pos.y) < g.bloxDistDiv2) {
              if (g.waitingOnAct) {
                g.curiaBlox = b;
                g.confirmInteract();
              } else {
                g.physics.blowUpBlox(b);
              }
            }
          }
        }
      }
    }

    if (g.waitingOnAct) return;

    if (phase === 'move' || phase === 'down') {
      const ox = this.dragOrigin ? this.dragOrigin.x : rect.width * 0.5;
      const oy = this.dragOrigin ? this.dragOrigin.y : rect.height * 0.5;
      const dx = x - ox;
      const dy = y - oy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.MOUSE_DEAD_PX) {
        g.downx = 0;
        g.downy = 0;
      } else {
        const reach = Math.min(1, (dist - this.MOUSE_DEAD_PX) / this.MOUSE_FULL_PX);
        const scale = (this.MOUSE_MAX * reach) / dist;
        g.downx = dx * scale;
        g.downy = dy * scale;
      }
      g.updateMoveCnt();
    } else if (phase === 'up') {
      g.downx = 0.0;
      g.downy = 0.0;
      this.applyKeys();
    }
  }
}
