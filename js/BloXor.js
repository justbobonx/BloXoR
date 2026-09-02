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
    this.scoreTimer = null;
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
