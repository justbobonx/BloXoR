const GameState = {
  Title: 'Title',
  InPlay: 'InPlay',
  Paused: 'Paused',
  LevelBeat: 'LevelBeat',
  WaitToStartNewLevel: 'WaitToStartNewLevel',
  GameOver: 'GameOver',
  NoDraw: 'NoDraw'
};

class BloXor {
  constructor(canvas) {
    this.canvas = canvas;

    this.FRAME_SLEEP_MSEC = 38;
    this.FRAME_LENGTH_SEC = this.FRAME_SLEEP_MSEC / 1000;

    this.BLoxCntX = 11;
    this.BLoxCntY = 7;
    this.MAX_LVL_SCORE = 2500.0;
    this.MINUS_PER_MOVE = 20.0;
    this.MINUS_PER_TIC = 2.5;
    this.SCORE_RATIO_MOD = 0.5;
    this.bloxDist = 40.0;
    this.bloxDistDiv2 = 20.0;
    this.bloxDistMin1 = 40.0;
    this.HOLE_FALLIN_DIST = 40.0 * 0.57;
    this.BLOX_SPEED = 22;
    this.BLOX_FRICTION_MIN = 0.1;
    this.BLOX_FRICTION_RANGE = 0.85;
    this.TILT_FRICTION_MIN = 0.55;
    this.TILT_FRICTION_RANGE = 0.30;
    this.STICK_FRICTION = 0.88;
    this.BLOX_POS_PRECISION = 100;    
    this.NUM_LEVELS_ALLOW_OPEN = 6;

    this.theScale = 1;
    this.viewScale = 1;
    this.viewOx = 0;
    this.viewOy = 0;
    this.TOUCH_TOP = 0;
    this.TOUCH_LEFT = 0;
    this.TOP = 40;
    this.BOTTOM = 280;
    this.LEFT = 40;
    this.RIGHT = 440;
    this.WIDTH = 480;
    this.HEIGHT = 320;
    this.CENTER_X = 240;
    this.CENTER_Y = 160;

    this.updateCounter = 0;
    this.downx = 0;
    this.downy = 0;
    this.downz = 0;
    this.modDownx = 0;
    this.modDowny = 0;
    this.modFriction = 0;
    this.lastAccX = 0;
    this.lastAccY = 0;

    this.anyStopped = 0;
    this.anyMovingx = 0;
    this.anyMovingy = 0;
    this.lastAnyMoving = 0;

    this.curPuzzleInd = 0;
    this.curLvlData = new LevelData(-1, 'current level');
    this.rawScoreM = this.MAX_LVL_SCORE;
    this.rawScoreS = this.MAX_LVL_SCORE;
    this.totScore = 0;
    this.lvlsOpen = 0;
    this.lvlsBeat = 0;
    this.totTime = 0.0;
    this.totGamesPlayed = 0;
    this.wonGame = false;
    this.firstTime = true;

    this.moverBloxs = [];
    this.underBloxs = [];
    this.surfaceBloxs = [];
    this.overBloxs = [];
    this.effects = [];
    this.levelData = [];
    this.bloxO1 = null;
    this.bloxX = null;
    this.bloxO2 = null;
    this.bgp = null;
    this.alignBg = null;
    this.alignArrow = null;

    this.waitingOnAct = false;
    this.iaBloxs = [];
    this.curiaBlox = null;
    this.iaHilite = null;
    this.lastIaPos = new Coord(240, 160);

    this.gameState = GameState.NoDraw;
    this.pauseGameState = null;
    this.initialized = false;
    this.loopTimer = null;
    this.chromeWait = null;

    this.soundManager = SoundManager.getInstance();
    this.field = new BloxField(this);
    this.physics = new BloxPhysics(this);
    this.input = new BloxInput(this);
    this.loader = new PuzzleLoader(this);
    this.index = new LevelIndex(this);
    this.save = new GameSave(this);
    this.view = new GameView(this, canvas);
    this.ui = new BloXorUI(this);
  }

  async boot() {
    BitmapManager.initialize();
    await BitmapManager.getInstance().loadAll();
    this.soundManager.initSounds();
    await this.index.load();
    await this.loader.preload(this.levelData.map((l) => l.name));
    this.save.loadUserData();
    this.initialized = true;
    this.input.attach(this.canvas);
    this.ui.bind();
    this.ui.showStart();
    this.startLoop();
  }

  startLoop() {
    if (this.loopTimer) clearInterval(this.loopTimer);
    this.loopTimer = setInterval(() => {
      if (this.ui.gateOpen()) return;
      if (this.ui.menuOpen()) {
        this.input.poll();
        this.ui.navTick();
      } else if (this.gameState !== GameState.NoDraw) {
        this.update();
        this.view.draw();
      }
    }, this.FRAME_SLEEP_MSEC);
  }

  update() {
    this.input.poll();
    if (this.gameState === GameState.InPlay && !this.waitingOnAct) {
      this.updateTimer();
      this.physics.updateBlox();
      this.ui.refreshPlayHud();
    } else if (this.gameState === GameState.InPlay && this.waitingOnAct) {
      this.ui.refreshPlayHud();
    }
  }

  updateTimer() {
    this.curLvlData.seconds += this.FRAME_LENGTH_SEC;
    this.levelData[this.curPuzzleInd].timePlayed += this.FRAME_LENGTH_SEC;
    this.totTime += this.FRAME_LENGTH_SEC;
    this.rawScoreS -= this.MINUS_PER_TIC * (this.rawScoreS / this.MAX_LVL_SCORE);
    this.curLvlData.score = (this.rawScoreS + this.rawScoreM) | 0;
  }

  updateMoveCnt() {
    if (this.gameState !== GameState.InPlay || this.waitingOnAct) return;
    const newAccX = Math.abs(this.downx) < (this.lastAccX === 0 ? this.FLAT_SPAN : 0.01) ? 0 : Math.sign(this.downx);
    const newAccY = Math.abs(this.downy) < (this.lastAccY === 0 ? this.FLAT_SPAN : 0.01) ? 0 : Math.sign(this.downy);
    if ((newAccX !== this.lastAccX && newAccX !== 0) || (newAccY !== this.lastAccY && newAccY !== 0)) {
      this.curLvlData.moves += 1;
      this.rawScoreM -= this.MINUS_PER_MOVE * (this.rawScoreM / this.MAX_LVL_SCORE);
    }
    this.lastAccX = newAccX;
    this.lastAccY = newAccY;
  }

  resize(cssW, cssH) {
    this.view.layout(cssW, cssH);
    if (this.gameState !== GameState.NoDraw) this.view.draw();
  }

  isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  enterPlayFullscreen() {
    return this.enterPlayChrome();
  }

  tallViewport() {
    return window.innerHeight > window.innerWidth;
  }

  needsChromeGate() {
    if (!this.tallViewport()) return false;
    if (this.isFullscreen() && document.documentElement.classList.contains('stage-swap')) return false;
    return true;
  }

  enterPlayChrome() {
    if (this.chromeWait) return this.chromeWait;
    this.chromeWait = this.runPlayChrome().then(() => {
      this.chromeWait = null;
    }, () => {
      this.chromeWait = null;
    });
    return this.chromeWait;
  }

  async runPlayChrome() {
    if (typeof window.applyStage === 'function') window.applyStage();
    const gate = this.needsChromeGate();
    if (gate) this.ui.showGate();
    this.input.enableTilt();
    this.input.absorbButtons();
    if (!this.isFullscreen()) await this.requestPageFullscreen();
    if (typeof window.applyStage === 'function') window.applyStage();
    if (gate) await this.waitChromeSettled();
    if (typeof window.resizeGame === 'function') window.resizeGame();
    this.ui.hideGate();
    this.input.absorbButtons();
  }

  requestPageFullscreen() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen ||
      document.body.requestFullscreen || document.body.webkitRequestFullscreen;
    if (!req) return Promise.resolve();
    try {
      const p = req.call(el.contains(document.body) ? el : document.body);
      if (p && typeof p.then === 'function') return p.catch(() => {});
    } catch (err) {}
    return Promise.resolve();
  }

  waitChromeSettled() {
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        document.removeEventListener('fullscreenchange', onFs);
        document.removeEventListener('webkitfullscreenchange', onFs);
        window.removeEventListener('resize', onRs);
        window.removeEventListener('orientationchange', onRs);
        resolve();
      };
      const onFs = () => {
        if (typeof window.applyStage === 'function') window.applyStage();
        if (typeof window.resizeGame === 'function') window.resizeGame();
        setTimeout(finish, 80);
      };
      const onRs = () => {
        if (typeof window.applyStage === 'function') window.applyStage();
      };
      document.addEventListener('fullscreenchange', onFs);
      document.addEventListener('webkitfullscreenchange', onFs);
      window.addEventListener('resize', onRs);
      window.addEventListener('orientationchange', onRs);
      setTimeout(finish, 750);
    });
  }

  exitFullscreen() {
    if (!this.isFullscreen()) return;
    const ex = document.exitFullscreen || document.webkitExitFullscreen || document.webkitCancelFullScreen;
    if (!ex) return;
    try {
      const p = ex.call(document);
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (err) {}
  }

  silenceAudio() {
    this.soundManager.stopAll();
    this.lastAnyMoving = 0;
  }

  onLostFocus() {
    this.saveGame();
    this.silenceAudio();
    if (this.ui.gateOpen()) return;
    const playing = this.gameState === GameState.InPlay || this.gameState === GameState.WaitToStartNewLevel;
    if (playing && !this.ui.menuOpen()) {
      this.pauseGameState = this.gameState;
      this.gameState = GameState.NoDraw;
      this.ui.showPause();
    }
    this.exitFullscreen();
    setTimeout(() => {
      if (typeof window.applyStage === 'function') window.applyStage();
      if (typeof window.resizeGame === 'function') window.resizeGame();
    }, 120);
  }

  collectInteractBloxs() {
    const list = [];
    const add = (arr) => {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].bloxType === BloxType.BOMB) list.push(arr[i]);
      }
    };
    add(this.surfaceBloxs);
    add(this.moverBloxs);
    return list;
  }

  startFromWait(consumeAct) {
    if (this.gameState !== GameState.WaitToStartNewLevel) return;
    this.gameState = GameState.InPlay;
    this.input.absorbButtons();
  }

  beginInteract() {
    if (this.input.ignoreInteract) return false;
    if (this.gameState !== GameState.InPlay || this.waitingOnAct) return false;
    const list = this.collectInteractBloxs();
    if (list.length === 0) return false;
    this.iaBloxs = list;
    let best = list[0];
    let bestDist = 999999;
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      const dx = b.pos.x - this.lastIaPos.x;
      const dy = b.pos.y - this.lastIaPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = b;
      }
    }
    this.curiaBlox = best;
    this.lastIaPos = new Coord(best.pos);
    this.waitingOnAct = true;
    this.downx = 0;
    this.downy = 0;
    this.input.absorbButtons();
    return true;
  }

  stepInteract(dir) {
    const cur = this.curiaBlox;
    if (!cur) return;
    let found = null;
    let founddist = 999999;
    for (let i = 0; i < this.iaBloxs.length; i++) {
      const tb = this.iaBloxs[i];
      if (tb === cur) continue;
      if (dir === 'down' && tb.pos.y <= cur.pos.y) continue;
      if (dir === 'up' && tb.pos.y >= cur.pos.y) continue;
      if (dir === 'left' && tb.pos.x >= cur.pos.x) continue;
      if (dir === 'right' && tb.pos.x <= cur.pos.x) continue;
      const dx = tb.pos.x - cur.pos.x;
      const dy = tb.pos.y - cur.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < founddist) {
        founddist = dist;
        found = tb;
      }
    }
    if (found) {
      this.curiaBlox = found;
      this.lastIaPos = new Coord(found.pos);
    }
  }

  confirmInteract() {
    const b = this.curiaBlox;
    this.cancelInteract();
    if (b && b.bloxType === BloxType.BOMB) this.physics.blowUpBlox(b);
    this.input.absorbButtons();
  }

  cancelInteract() {
    this.waitingOnAct = false;
    this.iaBloxs = [];
    this.curiaBlox = null;
  }

  playLevel(i) {
    const ld = this.levelData[i];
    if (!ld || !ld.opened) return;
    this.cancelInteract();
    this.curPuzzleInd = i;
    this.loader.setupPuzzleI(i);
    this.ui.hideMenus();
    this.gameState = GameState.WaitToStartNewLevel;
    this.input.absorbButtons();
    this.view.draw();
  }

  restartLevel() {
    this.enterPlayChrome().then(() => this.playLevel(this.curPuzzleInd));
  }

  backPressed() {
    if (this.ui.gateOpen()) return;
    if (this.ui.detailOpen()) {
      this.ui.closeDetail();
      this.input.absorbButtons();
      return;
    }
    if (this.waitingOnAct) {
      this.cancelInteract();
      this.input.absorbButtons();
      return;
    }
    if (this.ui.visible('pauseScreen')) {
      this.resumePlay();
      return;
    }
    if (this.gameState === GameState.InPlay || this.gameState === GameState.WaitToStartNewLevel) {
      this.pauseGameState = this.gameState;
      this.gameState = GameState.NoDraw;
      this.ui.showPause();
    }
  }

  resumePlay() {
    this.input.absorbButtons();
    this.enterPlayChrome().then(() => {
      this.ui.hideMenus();
      this.gameState = this.pauseGameState || GameState.InPlay;
      if (this.gameState === GameState.NoDraw) this.gameState = GameState.InPlay;
      this.pauseGameState = null;
      this.input.absorbButtons();
    });
  }

  setSoundMute(muted) {
    if (!this.soundManager) return;
    if (muted) this.soundManager.mute();
    else this.soundManager.unmute();
    this.ui.syncMute();
  }

  levelCompeted() {
    this.cancelInteract();
    this.gameState = GameState.LevelBeat;
    this.soundManager.stopSound('sfx_slide');

    const mk = (src, from, toX) => {
      const s = new Sprite(src.bitmap, new Coord(src.pos));
      s.setAnimateDuration(800);
      const animateTo = new GfxState();
      animateTo.scale = 8;
      animateTo.alpha = 0;
      s.setAnimateGfxTo(animateTo);
      s.setAnimatePosTo(new Coord(toX, this.CENTER_Y));
      s.setAnimateCurve(Sprite.AnimateCurveType.EASE_IN);
      s.setRemoveWhenDoneAnimating(true);
      s.startAnimation();
      this.effects.push(s);
    };
    if (this.bloxO1) mk(this.bloxO1, this.bloxO1.pos, 0);
    if (this.bloxX) mk(this.bloxX, this.bloxX.pos, this.CENTER_X);
    if (this.bloxO2) mk(this.bloxO2, this.bloxO2.pos, this.WIDTH);

    this.soundManager.playSound('sfx_win');

    const curLd = this.levelData[this.curPuzzleInd];
    if (curLd.beaten === false) {
      curLd.firstBeat = Date.now();
      this.lvlsBeat++;
      if (this.lvlsBeat === this.levelData.length - 1) this.wonGame = true;
    }

    if (curLd.beaten === false || this.lvlsOpen <= this.lvlsBeat) {
      if (this.lvlsOpen < this.levelData.length) {
        this.levelData[this.lvlsOpen].opened = true;
        this.lvlsOpen++;
      }
      if (this.lvlsOpen < this.levelData.length && this.lvlsOpen > 16 && this.lvlsOpen - this.lvlsBeat < this.NUM_LEVELS_ALLOW_OPEN) {
        this.levelData[this.lvlsOpen].opened = true;
        this.lvlsOpen++;
      }
    }

    curLd.beaten = true;

    const scoreBest = this.curLvlData.score > curLd.score;
    if (scoreBest) {
      this.totScore -= curLd.score;
      this.totScore += this.curLvlData.score;
      curLd.score = this.curLvlData.score;
    }
    if (this.curLvlData.moves < curLd.moves) curLd.moves = this.curLvlData.moves;
    if (this.curLvlData.seconds < curLd.seconds) curLd.seconds = this.curLvlData.seconds;

    if (this.curPuzzleInd > 2 && this.curPuzzleInd < this.levelData.length - 1) {
      this.curPuzzleInd++;
    }

    this.save.saveUserData();
    this.ui.showScore(this.curLvlData, scoreBest);
  }

  saveGame() {
    this.save.saveUserData();
  }
}

class BloXorUI {
  constructor(game) {
    this.g = game;
    this.focusEls = [];
    this.focusIndex = 0;
    this.heldDir = 0;
    this.repeatAt = 0;
  }

  bind() {
    const g = this.g;
    document.getElementById('newGameButton').addEventListener('click', () => {
      document.getElementById('startScreen').classList.add('hidden');
      g.enterPlayChrome().then(() => this.showLevelSelect());
    });
    document.getElementById('continueButton').addEventListener('click', () => {
      document.getElementById('startScreen').classList.add('hidden');
      g.enterPlayChrome().then(() => this.showLevelSelect());
    });
    document.getElementById('ps_resume').addEventListener('click', () => g.resumePlay());
    document.getElementById('ps_restart').addEventListener('click', () => g.restartLevel());
    document.getElementById('ps_menu').addEventListener('click', () => {
      g.enterPlayChrome().then(() => this.showLevelSelect());
    });
    document.getElementById('ps_mute').addEventListener('click', () => {
      g.setSoundMute(!g.soundManager.muted());
      g.save.saveUserData();
    });
    document.getElementById('ld_back').addEventListener('click', () => this.closeDetail());
    document.getElementById('ld_play').addEventListener('click', () => {
      g.enterPlayChrome().then(() => g.playLevel(g.curPuzzleInd));
    });
    document.getElementById('sc_ok').addEventListener('click', () => {
      this.closeScore();
      g.enterPlayChrome().then(() => this.showLevelSelect());
    });
    this.syncMute();
  }

  menuOpen() {
    return !!this.menuLayer();
  }

  gateOpen() {
    return this.visible('orientGate');
  }

  showGate() {
    const el = document.getElementById('orientGate');
    if (el) el.classList.remove('hidden');
  }

  hideGate() {
    const el = document.getElementById('orientGate');
    if (el) el.classList.add('hidden');
  }

  menuLayer() {
    if (this.visible('startScreen')) return 'start';
    if (this.visible('levelDetail')) return 'detail';
    if (this.visible('levelSelect')) return 'select';
    if (this.visible('pauseScreen')) return 'pause';
    if (this.visible('scoreView')) return 'score';
    return null;
  }

  visible(id) {
    const el = document.getElementById(id);
    return el && !el.classList.contains('hidden');
  }

  collectFocus() {
    const layer = this.menuLayer();
    let ids = [];
    if (layer === 'start') ids = ['newGameButton', 'continueButton'];
    else if (layer === 'select') {
      this.focusEls = Array.prototype.slice.call(document.querySelectorAll('#ls_list .ls-row'));
      this.clampFocus();
      this.paintFocus(false);
      return;
    } else if (layer === 'detail') ids = ['ld_back', 'ld_play'];
    else if (layer === 'pause') ids = ['ps_resume', 'ps_restart', 'ps_menu', 'ps_mute'];
    else if (layer === 'score') ids = ['sc_ok'];
    this.focusEls = ids.map((id) => document.getElementById(id)).filter((el) => el && !el.classList.contains('hidden') && !el.disabled);
    this.clampFocus();
    this.paintFocus(false);
  }

  clampFocus() {
    if (this.focusEls.length === 0) {
      this.focusIndex = 0;
      return;
    }
    if (this.focusIndex < 0) this.focusIndex = this.focusEls.length - 1;
    if (this.focusIndex >= this.focusEls.length) this.focusIndex = 0;
  }

  paintFocus(keepInView) {
    const all = document.querySelectorAll('.ui-focus');
    for (let i = 0; i < all.length; i++) all[i].classList.remove('ui-focus');
    const el = this.focusEls[this.focusIndex];
    if (!el) return;
    el.classList.add('ui-focus');
    if (keepInView && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }

  setFocus(i, keepInView) {
    this.focusIndex = i;
    this.clampFocus();
    this.paintFocus(!!keepInView);
  }

  navTick() {
    this.collectFocus();
    const nav = this.g.input.menuButtons();
    if (nav.back) {
      this.g.backPressed();
      return;
    }
    if (nav.activate) {
      this.activateFocus();
      return;
    }
    let dir = 0;
    if (nav.down || nav.right) dir = 1;
    else if (nav.up || nav.left) dir = -1;
    const now = Date.now();
    if (dir === 0) {
      this.heldDir = 0;
      this.repeatAt = 0;
      return;
    }
    if (dir !== this.heldDir) {
      this.heldDir = dir;
      this.repeatAt = now + 280;
      this.setFocus(this.focusIndex + dir, true);
    } else if (now >= this.repeatAt) {
      this.repeatAt = now + 70;
      this.setFocus(this.focusIndex + dir, true);
    }
  }

  activateFocus() {
    const el = this.focusEls[this.focusIndex];
    if (el && !el.disabled) el.click();
  }

  showStart() {
    const cont = document.getElementById('continueButton');
    const hasProgress = this.g.lvlsBeat > 0 || this.g.levelData.some((l) => l.playCount > 0);
    cont.disabled = !hasProgress;
    cont.classList.toggle('hidden', !hasProgress);
    document.getElementById('startScreen').classList.remove('hidden');
    this.hideMenus();
    document.getElementById('startScreen').classList.remove('hidden');
    this.focusIndex = 0;
    this.collectFocus();
    this.g.input.absorbButtons();
  }

  hideMenus() {
    document.getElementById('levelSelect').classList.add('hidden');
    document.getElementById('levelDetail').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');
    document.getElementById('scoreView').classList.add('hidden');
    document.getElementById('playHud').classList.add('hidden');
  }

  showLevelSelect() {
    const g = this.g;
    g.cancelInteract();
    g.gameState = GameState.NoDraw;
    this.hideMenus();
    const tot = g.totTime;
    const timeStr =
      Math.floor(tot / 3600) + ':' +
      String(Math.floor((tot / 60) % 60)).padStart(2, '0') + ':' +
      String(Math.floor(tot % 60 + 0.5)).padStart(2, '0');
    document.getElementById('ls_stats').textContent =
      'SCORE: ' + g.totScore +
      ' · Lvls Open: ' + g.lvlsOpen +
      ' · Lvls Comp: ' + g.lvlsBeat +
      ' · Tot Time: ' + timeStr +
      ' · Tot Plays: ' + g.totGamesPlayed;

    const list = document.getElementById('ls_list');
    list.innerHTML = '';
    for (let i = 0; i < g.levelData.length; i++) {
      const ld = g.levelData[i];
      const row = document.createElement('button');
      row.className = 'ls-row' + (ld.opened ? '' : ' locked');
      row.type = 'button';
      const mark = ld.beaten ? 'X' : ld.opened ? '\u25cf' : ' ';
      const score = ld.beaten ? String(ld.score) : '---';
      const name = ld.opened ? ld.name : '???';
      row.textContent = mark + '  ' + (i + 1) + '  ' + name + '   ' + score;
      row.addEventListener('click', () => this.showDetail(i));
      list.appendChild(row);
    }
    document.getElementById('levelSelect').classList.remove('hidden');
    this.focusIndex = Math.max(0, Math.min(g.curPuzzleInd, g.levelData.length - 1));
    this.collectFocus();
    g.input.absorbButtons();
  }

  showDetail(i) {
    const g = this.g;
    g.curPuzzleInd = i;
    const ld = g.levelData[i];
    document.getElementById('ld_name').textContent = ld.opened ? ld.indexSpaceName : (i + 1) + ' - ???';

    const thumb = document.getElementById('ld_thumb');
    const desc = document.getElementById('ld_desc');
    const stats = document.getElementById('ld_stats');
    const play = document.getElementById('ld_play');

    if (!ld.opened) {
      thumb.style.display = 'none';
      thumb.removeAttribute('src');
      desc.textContent = '???';
      stats.classList.add('hidden');
      play.disabled = true;
      play.textContent = 'Locked';
    } else {
      thumb.alt = ld.name;
      thumb.src = ld.thumbUrl();
      thumb.onerror = () => { thumb.style.display = 'none'; };
      thumb.onload = () => { thumb.style.display = 'block'; };

      if (ld.beaten) {
        desc.innerHTML = '';
        stats.classList.remove('hidden');
        const tmin = Math.floor(ld.seconds / 60);
        const tsec = String(Math.floor(ld.seconds % 60)).padStart(2, '0');
        const pmin = Math.floor(ld.timePlayed / 60);
        const psec = String(Math.floor(ld.timePlayed % 60)).padStart(2, '0');
        stats.innerHTML =
          'Hi Score: ' + ld.score +
          '<br>Low Time: ' + tmin + ':' + tsec +
          '<br>Low Tilts: ' + ld.moves +
          '<br>First Beat: ' + ld.formattedDateTime(ld.firstBeat) +
          '<br>Total Plays: ' + ld.playCount +
          '<br>Total Time: ' + pmin + ':' + psec;
      } else {
        desc.innerHTML = ld.getDescriptionHtml();
        stats.classList.add('hidden');
      }
      play.disabled = false;
      play.textContent = 'Play';
    }

    document.getElementById('levelDetail').classList.remove('hidden');
    this.focusIndex = ld.opened ? 1 : 0;
    this.collectFocus();
    g.input.absorbButtons();
  }

  closeDetail() {
    document.getElementById('levelDetail').classList.add('hidden');
    this.focusIndex = this.g.curPuzzleInd;
    this.collectFocus();
    this.g.input.absorbButtons();
  }

  detailOpen() {
    return this.visible('levelDetail');
  }

  showPause() {
    this.g.silenceAudio();
    this.g.cancelInteract();
    this.hideMenus();
    this.syncMute();
    document.getElementById('pauseScreen').classList.remove('hidden');
    this.focusIndex = 0;
    this.collectFocus();
    this.g.input.absorbButtons();
  }

  showScore(cur, best) {
    document.getElementById('sc_score').textContent = 'Score: ' + cur.score;
    document.getElementById('sc_score').style.color = best ? '#fff' : '#728CA6';
    document.getElementById('sc_time').textContent =
      'Time: ' + Math.floor(cur.seconds / 60) + ':' + String(Math.floor(cur.seconds % 60 + 0.5)).padStart(2, '0');
    document.getElementById('sc_moves').textContent = 'Tilts: ' + cur.moves;
    document.getElementById('scoreView').classList.remove('hidden');
    this.focusIndex = 0;
    this.collectFocus();
    this.g.input.absorbButtons();
  }

  closeScore() {
    document.getElementById('scoreView').classList.add('hidden');
  }

  refreshPlayHud() {}

  syncMute() {
    const btn = document.getElementById('ps_mute');
    if (!btn) return;
    btn.textContent = this.g.soundManager.muted() ? 'sound off' : 'sound on';
  }
}
