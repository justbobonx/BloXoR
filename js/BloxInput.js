class BloxInput {
  constructor(game) {
    this.g = game;
    this.keys = Object.create(null);
    this.pointerDown = false;
    this.pointerDragged = false;
    this.dragOrigin = null;
    this.holdTimer = 0;
    this.holdWorld = null;
    this.FLAT_SPAN = 0.03;
    this.FLAT_START = 0.01;
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
