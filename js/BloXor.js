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
    this.BLOX_POS_PRECISION = 100;
    this.FLAT_SPAN = 0.07;
    this.FLAT_START = 0.04;
    this.NUM_LEVELS_ALLOW_OPEN = 6;

    this.theScale = 1;
    this.TOUCH_TOP = 0;
    this.TOUCH_LEFT = 0;
    this.TOP = 40;
    this.BOTTOM = 800;
    this.LEFT = 40;
    this.RIGHT = 800;
    this.WIDTH = 800;
    this.HEIGHT = 480;
    this.CENTER_X = 400;
    this.CENTER_Y = 240;

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

    this.gameState = GameState.NoDraw;
    this.pauseGameState = null;
    this.initialized = false;
    this.loopTimer = null;

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
      if (this.gameState !== GameState.NoDraw) {
        this.update();
        this.view.draw();
      }
    }, this.FRAME_SLEEP_MSEC);
  }

  update() {
    if (this.gameState === GameState.InPlay) {
      this.updateTimer();
      this.physics.updateBlox();
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
    if (this.gameState !== GameState.InPlay) return;
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

  playLevel(i) {
    const ld = this.levelData[i];
    if (!ld || !ld.opened) return;
    this.curPuzzleInd = i;
    this.loader.setupPuzzleI(i);
    this.ui.hideMenus();
    this.gameState = GameState.WaitToStartNewLevel;
    this.view.draw();
  }

  restartLevel() {
    this.playLevel(this.curPuzzleInd);
  }

  backPressed() {
    if (this.ui.detailOpen()) {
      this.ui.closeDetail();
      return;
    }
    if (this.gameState === GameState.InPlay || this.gameState === GameState.WaitToStartNewLevel) {
      this.gameState = GameState.NoDraw;
      this.ui.showPause();
    }
  }

  resumePlay() {
    this.ui.hideMenus();
    this.gameState = GameState.InPlay;
  }

  setSoundMute(muted) {
    if (!this.soundManager) return;
    if (muted) this.soundManager.mute();
    else this.soundManager.unmute();
    this.ui.syncMute();
  }

  levelCompeted() {
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
  }

  bind() {
    const g = this.g;
    document.getElementById('newGameButton').addEventListener('click', () => {
      document.getElementById('startScreen').classList.add('hidden');
      this.showLevelSelect();
    });
    document.getElementById('continueButton').addEventListener('click', () => {
      document.getElementById('startScreen').classList.add('hidden');
      this.showLevelSelect();
    });
    document.getElementById('ps_resume').addEventListener('click', () => g.resumePlay());
    document.getElementById('ps_restart').addEventListener('click', () => g.restartLevel());
    document.getElementById('ps_menu').addEventListener('click', () => this.showLevelSelect());
    document.getElementById('ld_back').addEventListener('click', () => this.closeDetail());
    document.getElementById('ld_play').addEventListener('click', () => g.playLevel(g.curPuzzleInd));
    document.getElementById('sc_ok').addEventListener('click', () => {
      this.closeScore();
      this.showLevelSelect();
    });
    document.getElementById('sb_mute').addEventListener('click', () => {
      g.setSoundMute(!g.soundManager.muted());
      g.save.saveUserData();
    });
  }

  showStart() {
    const cont = document.getElementById('continueButton');
    const hasProgress = this.g.lvlsBeat > 0 || this.g.levelData.some((l) => l.playCount > 0);
    cont.disabled = !hasProgress;
    cont.classList.toggle('hidden', !hasProgress);
    document.getElementById('startScreen').classList.remove('hidden');
    this.hideMenus();
    document.getElementById('startScreen').classList.remove('hidden');
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
    g.gameState = GameState.NoDraw;
    this.hideMenus();
    document.getElementById('ls_tot').textContent = String(g.totScore);
    document.getElementById('ls_beat').textContent = 'Lvls Comp: ' + g.lvlsBeat;
    document.getElementById('ls_open').textContent = 'Lvls Open: ' + g.lvlsOpen;
    const tot = g.totTime;
    document.getElementById('ls_time').textContent =
      'Tot Time: ' + Math.floor(tot / 3600) + ':' +
      String(Math.floor((tot / 60) % 60)).padStart(2, '0') + ':' +
      String(Math.floor(tot % 60 + 0.5)).padStart(2, '0');
    document.getElementById('ls_plays').textContent = 'Tot Plays: ' + g.totGamesPlayed;

    const list = document.getElementById('ls_list');
    list.innerHTML = '';
    for (let i = 0; i < g.levelData.length; i++) {
      const ld = g.levelData[i];
      const row = document.createElement('button');
      row.className = 'ls-row' + (ld.opened ? '' : ' locked');
      row.type = 'button';
      const mark = ld.beaten ? 'X' : ld.opened ? '\u25cf' : ' ';
      const score = ld.beaten ? String(ld.score) : '---';
      row.textContent = mark + '  ' + (i + 1) + '  ' + ld.name + '   ' + score;
      row.addEventListener('click', () => this.showDetail(i));
      list.appendChild(row);
    }
    document.getElementById('levelSelect').classList.remove('hidden');
  }

  showDetail(i) {
    const g = this.g;
    g.curPuzzleInd = i;
    const ld = g.levelData[i];
    document.getElementById('ld_name').textContent = ld.indexSpaceName;

    const thumb = document.getElementById('ld_thumb');
    thumb.alt = ld.name;
    thumb.src = ld.thumbUrl();
    thumb.onerror = () => { thumb.style.display = 'none'; };
    thumb.onload = () => { thumb.style.display = 'block'; };

    const desc = document.getElementById('ld_desc');
    const stats = document.getElementById('ld_stats');
    const play = document.getElementById('ld_play');

    if (!ld.opened) {
      desc.textContent = '???';
      stats.classList.add('hidden');
      play.disabled = true;
      play.textContent = 'Locked';
    } else if (ld.beaten) {
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
      play.disabled = false;
      play.textContent = 'Play';
    } else {
      desc.innerHTML = ld.getDescriptionHtml();
      stats.classList.add('hidden');
      play.disabled = false;
      play.textContent = 'Play';
    }

    document.getElementById('levelDetail').classList.remove('hidden');
  }

  closeDetail() {
    document.getElementById('levelDetail').classList.add('hidden');
  }

  detailOpen() {
    return !document.getElementById('levelDetail').classList.contains('hidden');
  }

  showPause() {
    this.hideMenus();
    document.getElementById('pauseScreen').classList.remove('hidden');
  }

  showScore(cur, best) {
    document.getElementById('sc_score').textContent = 'Score: ' + cur.score;
    document.getElementById('sc_score').style.color = best ? '#fff' : '#728CA6';
    document.getElementById('sc_time').textContent =
      'Time: ' + Math.floor(cur.seconds / 60) + ':' + String(Math.floor(cur.seconds % 60 + 0.5)).padStart(2, '0');
    document.getElementById('sc_moves').textContent = 'Tilts: ' + cur.moves;
    document.getElementById('scoreView').classList.remove('hidden');
  }

  closeScore() {
    document.getElementById('scoreView').classList.add('hidden');
  }

  refreshPlayHud() {}

  syncMute() {
    const btn = document.getElementById('sb_mute');
    btn.textContent = this.g.soundManager.muted() ? 'sound off' : 'sound on';
  }
}
