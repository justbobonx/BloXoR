class BloxInput {
  constructor(game) {
    this.g = game;
    this.keys = Object.create(null);
    this.pointerDown = false;
    this.pointerDragged = false;
    this.dragOrigin = null;
    this.holdTimer = 0;
    this.holdWorld = null;
    this.FLAT_SPAN = 0.04;
    this.FLAT_START = 0.02;
    this.TILT_GAIN = 1.4;
    this.LONG_PRESS_MS = 550;
    this.KEY_TILT = 0.12;
    this.KEY_TILT_HARD = 0.26;
    this.MOUSE_DEAD_PX = 10;
    this.keysOn = false;
    try {
      this.keysOn = new URLSearchParams(window.location.search).get('keysOn') === '1';
    } catch (err) {}
    this.joyLev = 0.20;
    this.joyPow = 0.12;
    this.MENU_STICK = 0.55;
    this.padIndex = -1;
    this.startHeld = false;
    this.aHeld = false;
    this.bHeld = false;
    this.actHeld = false;
    this.ignoreInteract = false;
    this.iaDirHeld = '';
    this.wakeLock = null;
    this.wakeBusy = false;
    this.wakeGraceUntil = 0;
    this.WAKE_GRACE_MS = 60000;

    this.tiltAttached = false;
    this.tiltDenied = false;
    this.tiltBusy = false;
    this.lastTiltAt = 0;
    this.lastMotionWasGravity = false;
    this.TILT_EMA = 0.12;
    this.emaX = 0;
    this.emaY = 0;
    this.emaZ = 1;
    this.emaInited = false;
    this.onMotion = (e) => this.handleMotion(e);
    this.onOrient = (e) => this.handleOrientation(e);
  }

  btn(i) {
    const pad = this.currentPad();
    return !!(pad && pad.buttons && pad.buttons[i] && pad.buttons[i].pressed);
  }

  absorbButtons() {
    const a = !!(this.keys.Space || this.keys.Enter || this.keys.NumpadEnter || this.btn(0));
    const b = this.btn(1);
    const start = this.btn(9);
    this.actHeld = !!(this.keys.Space || this.btn(0));
    this.aHeld = a;
    this.bHeld = b;
    this.startHeld = start || b;
    this.ignoreInteract = this.actHeld;
    this.iaDirHeld = 'hold';
  }

  stageSwapped() {
    return document.documentElement.classList.contains('stage-swap');
  }

  pointerCss(ev, el) {
    const r = el.getBoundingClientRect();
    if (!this.stageSwapped()) {
      return {
        x: ev.clientX - r.left,
        y: ev.clientY - r.top,
        w: el.clientWidth,
        h: el.clientHeight
      };
    }
    const dx = ev.clientX - (r.left + r.width / 2);
    const dy = ev.clientY - (r.top + r.height / 2);
    const w = el.clientWidth;
    const h = el.clientHeight;
    return { x: dy + w / 2, y: -dx + h / 2, w, h };
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
      if (e.code === 'Space' && !g.ui.menuOpen()) {
        if (g.gameState === GameState.WaitToStartNewLevel) {
          g.startFromWait(true);
          return;
        }
        if (g.gameState === GameState.InPlay) {
          if (this.ignoreInteract) return;
          if (g.waitingOnAct) g.confirmInteract();
          else g.beginInteract();
          return;
        }
      }
      if (this.keysOn && !g.ui.menuOpen() && !g.waitingOnAct) this.applyKeys();
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (this.keysOn && !g.ui.menuOpen() && !g.waitingOnAct) this.applyKeys();
    });

    window.addEventListener('gamepadconnected', (e) => {
      if (this.padIndex < 0) this.padIndex = e.gamepad.index;
    });
    window.addEventListener('gamepaddisconnected', (e) => {
      if (this.padIndex === e.gamepad.index) this.padIndex = -1;
    });

    document.addEventListener('pointerdown', () => { this.enableTilt(); }, true);
    document.addEventListener('visibilitychange', () => this.syncWakeLock());
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    const onDown = (ev) => {
      this.pointerDown = true;
      this.pointerDragged = false;
      const p = this.pointerCss(ev, canvas);
      this.dragOrigin = { x: p.x, y: p.y };
      this.handlePointer(ev, canvas, 'down');
    };
    const onMove = (ev) => {
      if (!this.pointerDown) return;
      this.handlePointer(ev, canvas, 'move');
    };
    const onUp = (ev) => {
      this.handlePointer(ev, canvas, 'up');
      this.pointerDown = false;
      this.pointerDragged = false;
      this.dragOrigin = null;
      this.clearHold();
    };

    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  playingForWake() {
    const g = this.g;
    if (document.visibilityState === 'hidden') return false;
    if (g.ui.visible('pauseScreen')) return true;
    if (this.wakeGraceUntil && Date.now() < this.wakeGraceUntil) return true;
    if (g.ui.menuOpen()) return false;
    return g.gameState === GameState.InPlay || g.gameState === GameState.WaitToStartNewLevel;
  }

  startWakeGrace() {
    this.wakeGraceUntil = Date.now() + this.WAKE_GRACE_MS;
    this.syncWakeLock();
  }

  clearWakeGrace() {
    if (!this.wakeGraceUntil) return;
    this.wakeGraceUntil = 0;
    this.syncWakeLock();
  }

  syncWakeLock() {
    if (this.playingForWake()) this.requestWakeLock();
    else this.releaseWakeLock();
  }

  requestWakeLock() {
    if (this.wakeLock || this.wakeBusy) return;
    if (!navigator.wakeLock || typeof navigator.wakeLock.request !== 'function') return;
    this.wakeBusy = true;
    navigator.wakeLock.request('screen').then((lock) => {
      this.wakeBusy = false;
      this.wakeLock = lock;
      lock.addEventListener('release', () => { this.wakeLock = null; });
    }).catch(() => {
      this.wakeBusy = false;
      this.wakeLock = null;
    });
  }

  releaseWakeLock() {
    const lock = this.wakeLock;
    this.wakeLock = null;
    if (lock && typeof lock.release === 'function') {
      try { lock.release(); } catch (err) {}
    }
  }

  clearHold() {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = 0;
    }
    this.holdWorld = null;
  }

  startHold(world) {
    this.clearHold();
    const g = this.g;
    if (g.gameState !== GameState.InPlay || g.waitingOnAct || g.ui.menuOpen()) return;
    if (this.hitBombAt(world)) return;
    this.holdWorld = world;
    this.holdTimer = setTimeout(() => {
      this.holdTimer = 0;
      if (!this.pointerDown || this.pointerDragged) return;
      if (g.gameState !== GameState.InPlay || g.waitingOnAct || g.ui.menuOpen()) return;
      g.backPressed();
    }, this.LONG_PRESS_MS);
  }

  toWorld(ev, canvas) {
    const g = this.g;
    const p = this.pointerCss(ev, canvas);
    const cx = p.w ? p.x * (canvas.width / p.w) : 0;
    const cy = p.h ? p.y * (canvas.height / p.h) : 0;
    const scale = g.viewScale || 1;
    return {
      x: (cx - (g.viewOx || 0)) / scale,
      y: (cy - (g.viewOy || 0)) / scale,
      cssX: p.x,
      cssY: p.y
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

  hasGravityTilt() {
    return this.lastMotionWasGravity && this.lastTiltAt > 0;
  }

  preferManualControl() {
    return !!this.currentPad() || this.anyDirKey();
  }

  usingTiltControl() {
    if (this.preferManualControl() || this.tiltDenied) return false;
    if (!this.hasGravityTilt()) return false;
    if (window.matchMedia) {
      try {
        const fine = window.matchMedia('(pointer: fine)').matches;
        const coarse = window.matchMedia('(pointer: coarse)').matches;
        if (fine && !coarse) return false;
      } catch (err) {}
    }
    return true;
  }

  anyDirKey() {
    if (!this.keysOn) return false;
    return !!(this.keys.ArrowLeft || this.keys.ArrowRight || this.keys.ArrowUp || this.keys.ArrowDown ||
      this.keys.KeyA || this.keys.KeyD || this.keys.KeyW || this.keys.KeyS);
  }

  screenAngle() {
    if (screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle;
    if (typeof window.orientation === 'number') return window.orientation;
    return window.innerWidth > window.innerHeight ? 90 : 0;
  }

  remapToScreen(gx, gy) {
    if (this.stageSwapped()) {
      let x = gy;
      let y = -gx;
      y = -y;
      return { x, y };
    }
    const a = ((this.screenAngle() % 360) + 360) % 360;
    let x = gx;
    let y = gy;
    if (a === 90) { x = gy; y = -gx; }
    else if (a === 180) { x = -gx; y = -gy; }
    else if (a === 270) { x = -gy; y = gx; }
    const landscape = (a === 90 || a === 270);
    if (landscape) y = -y;
    else x = -x;
    return { x, y };
  }

  applyTiltGs(accx, accy, accz) {
    const g = this.g;
    if (g.ui.menuOpen() || g.waitingOnAct || this.usingManual()) return;

    accx = Math.max(-1, Math.min(1, accx));
    accy = Math.max(-1, Math.min(1, accy));
    accz = Math.max(-1, Math.min(1, accz));

    if (!this.emaInited) {
      this.emaX = accx;
      this.emaY = accy;
      this.emaZ = accz;
      this.emaInited = true;
    } else {
      const a = this.TILT_EMA;
      this.emaX += a * (accx - this.emaX);
      this.emaY += a * (accy - this.emaY);
      this.emaZ += a * (accz - this.emaZ);
    }

    let downx = this.emaX;
    let downy = this.emaY;
    let downz = this.emaZ;

    if (Math.abs(downx) < this.FLAT_SPAN) downx = 0;
    else if (downx > 0) downx -= this.FLAT_START;
    else downx += this.FLAT_START;
    if (Math.abs(downy) < this.FLAT_SPAN) downy = 0;
    else if (downy > 0) downy -= this.FLAT_START;
    else downy += this.FLAT_START;

    g.downx = downx * this.TILT_GAIN;
    g.downy = downy * this.TILT_GAIN;
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
    this.syncWakeLock();
    if (this.g.ui.menuOpen()) {
      this.g.downx = 0;
      this.g.downy = 0;
      return;
    }
    if (this.g.gameState === GameState.WaitToStartNewLevel) {
      if (!this.usingTiltControl() || this.anyDirKey() || this.readStick()) {
        this.g.startFromWait(true);
      }
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
    const held = this.actDown();
    if (this.ignoreInteract) {
      if (!held) this.ignoreInteract = false;
      this.actHeld = held;
      if (this.g.gameState === GameState.WaitToStartNewLevel && !held) {
        /* wait for a fresh press to start */
      } else {
        return;
      }
    }
    if (this.g.gameState === GameState.WaitToStartNewLevel) {
      if (held && !this.actHeld) this.g.startFromWait(true);
      this.actHeld = held;
      return;
    }
    if (this.g.gameState !== GameState.InPlay) {
      this.actHeld = held;
      return;
    }
    if (held && !this.actHeld) {
      if (this.g.waitingOnAct) this.g.confirmInteract();
      else this.g.beginInteract();
    }
    this.actHeld = held;
  }

  actDown() {
    return !!(this.keys.Space || this.btn(0));
  }

  pollInteractMove() {
    const ax = (() => {
      const pad = this.currentPad();
      return (pad && pad.axes && pad.axes.length >= 2) ? pad.axes : [0, 0];
    })();
    let dir = '';
    if (this.keys.ArrowDown || this.keys.KeyS || this.btn(13) || ax[1] > this.MENU_STICK) dir = 'down';
    else if (this.keys.ArrowUp || this.keys.KeyW || this.btn(12) || ax[1] < -this.MENU_STICK) dir = 'up';
    else if (this.keys.ArrowLeft || this.keys.KeyA || this.btn(14) || ax[0] < -this.MENU_STICK) dir = 'left';
    else if (this.keys.ArrowRight || this.keys.KeyD || this.btn(15) || ax[0] > this.MENU_STICK) dir = 'right';
    if (dir && dir !== this.iaDirHeld) this.g.stepInteract(dir);
    this.iaDirHeld = dir;
  }

  menuButtons() {
    const pad = this.currentPad();
    const ax = (pad && pad.axes && pad.axes.length >= 2) ? pad.axes : [0, 0];
    const up = this.keys.ArrowUp || this.keys.KeyW || this.btn(12) || ax[1] < -this.MENU_STICK;
    const down = this.keys.ArrowDown || this.keys.KeyS || this.btn(13) || ax[1] > this.MENU_STICK;
    const left = this.keys.ArrowLeft || this.keys.KeyA || this.btn(14) || ax[0] < -this.MENU_STICK;
    const right = this.keys.ArrowRight || this.keys.KeyD || this.btn(15) || ax[0] > this.MENU_STICK;
    const activateHeld = this.keys.Enter || this.keys.NumpadEnter || this.keys.Space || this.btn(0);
    const backHeld = this.btn(1);
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
    const start = this.btn(9);
    const b = this.btn(1);
    if (this.g.gameState === GameState.WaitToStartNewLevel) {
      if (b && !this.bHeld) this.g.startFromWait(true);
      if (start && !this.startHeld) this.g.backPressed();
      this.startHeld = start;
      this.bHeld = b;
      return;
    }
    if ((start || b) && !this.startHeld) this.g.backPressed();
    this.startHeld = start || b;
  }

  applyKeys() {
    const g = this.g;
    if (this.pointerDown || g.ui.menuOpen() || g.waitingOnAct) return;
    let x = 0;
    let y = 0;
    if (this.keysOn) {
      const hard = this.keys.ShiftLeft || this.keys.ShiftRight;
      const mag = hard ? this.KEY_TILT_HARD : this.KEY_TILT;
      if (this.keys.ArrowLeft || this.keys.KeyA) x -= mag;
      if (this.keys.ArrowRight || this.keys.KeyD) x += mag;
      if (this.keys.ArrowUp || this.keys.KeyW) y -= mag;
      if (this.keys.ArrowDown || this.keys.KeyS) y += mag;
    }
    g.downx = x;
    g.downy = y;
    g.updateMoveCnt();
  }

  hitBombAt(world) {
    const g = this.g;
    const tx = Math.trunc((world.x - g.LEFT + g.bloxDistDiv2) / g.bloxDist);
    const ty = Math.trunc((world.y - g.TOP + g.bloxDistDiv2) / g.bloxDist);
    if (tx < 0 || tx >= g.BLoxCntX || ty < 0 || ty >= g.BLoxCntY) return null;
    const tspot = g.field.field[tx][ty];
    for (let i = 0; i < tspot.length; i++) {
      const b = tspot[i];
      if (b.bloxType === BloxType.BOMB &&
          Math.abs(world.x - b.pos.x) < g.bloxDistDiv2 &&
          Math.abs(world.y - b.pos.y) < g.bloxDistDiv2) {
        return b;
      }
    }
    return null;
  }

  handlePointer(ev, canvas, phase) {
    const g = this.g;
    const p = this.pointerCss(ev, canvas);
    const x = p.x;
    const y = p.y;
    const world = this.toWorld(ev, canvas);

    if (g.gameState === GameState.LevelBeat) return;

    if (phase === 'down') {
      this.startHold(world);
    }

    if (phase === 'move' || phase === 'down') {
      const ox = this.dragOrigin ? this.dragOrigin.x : p.w * 0.5;
      const oy = this.dragOrigin ? this.dragOrigin.y : p.h * 0.5;
      const dx = x - ox;
      const dy = y - oy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= this.MOUSE_DEAD_PX) {
        this.pointerDragged = true;
        this.clearHold();
      }
      return;
    }

    if (phase !== 'up') return;
    this.clearHold();

    if (g.gameState === GameState.InPlay) {
      const bomb = this.hitBombAt(world);
      if (bomb) {
        if (g.waitingOnAct) {
          g.curiaBlox = bomb;
          g.confirmInteract();
        } else {
          g.physics.blowUpBlox(bomb);
        }
        return;
      }
    }

    this.applyKeys();
  }
}
