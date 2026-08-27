const BloxType = {
  OW_L: 'OW_L',
  OW_L_BG: 'OW_L_BG',
  OW_R: 'OW_R',
  OW_R_BG: 'OW_R_BG',
  OW_U: 'OW_U',
  OW_U_BG: 'OW_U_BG',
  OW_D: 'OW_D',
  OW_D_BG: 'OW_D_BG',
  BREAKER: 'BREAKER',
  WALL: 'WALL',
  O: 'O',
  X: 'X',
  GEN_MOVE: 'GEN_MOVE',
  BOMB: 'BOMB',
  BOMB_INACTIVE: 'BOMB_INACTIVE',
  BOLTS: 'BOLTS',
  HOLE: 'HOLE',
  POT_BRIDGE: 'POT_BRIDGE',
  BRIDGE: 'BRIDGE'
};

class Blox extends Sprite {
  static BLOX_1W_L_S = '1W_L';
  static BLOX_1W_L_BG_S = '1W_L_BG';
  static BLOX_1W_R_S = '1W_R';
  static BLOX_1W_R_BG_S = '1W_R_BG';
  static BLOX_1W_U_S = '1W_U';
  static BLOX_1W_U_BG_S = '1W_U_BG';
  static BLOX_1W_D_S = '1W_D';
  static BLOX_1W_D_BG_S = '1W_D_BG';
  static BLOX_BREAKER_S = 'Break';
  static BLOX_WALL_S = 'Wall';
  static BLOX_O_S = 'BloxO';
  static BLOX_X_S = 'BloxX';
  static BLOX_GEN_MOVE_S = 'Gener';
  static BLOX_BOMB_S = 'Bomb';
  static BLOX_BOMB_INACTIVE_S = 'BombI';
  static BLOX_BOLTS_S = 'Bolts';
  static BLOX_HOLE_S = 'Hole';
  static BLOX_POT_BRIDGE_S = 'PotBr';
  static BLOX_BRIDGE_S = 'Bridge';

  constructor(newBloxType) {
    super(null, new Coord(0, 0));
    this.initVars();
    if (typeof newBloxType === 'string') {
      this.initBlox(Blox.typeFromString(newBloxType));
    } else {
      this.initBlox(newBloxType);
    }
  }

  static typeFromString(newBloxType) {
    if (newBloxType === Blox.BLOX_WALL_S) return BloxType.WALL;
    if (newBloxType === Blox.BLOX_1W_L_S) return BloxType.OW_L;
    if (newBloxType === Blox.BLOX_1W_L_BG_S) return BloxType.OW_L_BG;
    if (newBloxType === Blox.BLOX_1W_R_S) return BloxType.OW_R;
    if (newBloxType === Blox.BLOX_1W_R_BG_S) return BloxType.OW_R_BG;
    if (newBloxType === Blox.BLOX_1W_U_S) return BloxType.OW_U;
    if (newBloxType === Blox.BLOX_1W_U_BG_S) return BloxType.OW_U_BG;
    if (newBloxType === Blox.BLOX_1W_D_S) return BloxType.OW_D;
    if (newBloxType === Blox.BLOX_1W_D_BG_S) return BloxType.OW_D_BG;
    if (newBloxType === Blox.BLOX_HOLE_S) return BloxType.HOLE;
    if (newBloxType === Blox.BLOX_GEN_MOVE_S) return BloxType.GEN_MOVE;
    if (newBloxType === Blox.BLOX_BOMB_S) return BloxType.BOMB;
    if (newBloxType === Blox.BLOX_BOMB_INACTIVE_S) return BloxType.BOMB_INACTIVE;
    if (newBloxType === Blox.BLOX_BOLTS_S) return BloxType.BOLTS;
    if (newBloxType === Blox.BLOX_X_S) return BloxType.X;
    if (newBloxType === Blox.BLOX_O_S) return BloxType.O;
    if (newBloxType === Blox.BLOX_BREAKER_S) return BloxType.BREAKER;
    if (newBloxType === Blox.BLOX_POT_BRIDGE_S) return BloxType.POT_BRIDGE;
    if (newBloxType === Blox.BLOX_BRIDGE_S) return BloxType.BRIDGE;
    return BloxType.WALL;
  }

  initVars() {
    this.movingx = 0;
    this.movingy = 0;
    this.lastMovingx = 0;
    this.lastMovingy = 0;
    this.exploding = 0;
    this.bolted = null;
    this.mover = false;
    this.updateCount = 0;
    this.vel = new Coord(0, 0);
    this.myFieldLocs = [];
    this.bloxType = BloxType.WALL;
  }

  initBlox(newBloxType) {
    this.bloxType = newBloxType;
    const bm = BitmapManager.getInstance();
    let name = null;
    if (newBloxType === BloxType.WALL) name = 'blx_wall';
    else if (newBloxType === BloxType.OW_L) name = 'blx_oneway_left_fg';
    else if (newBloxType === BloxType.OW_L_BG) name = 'blx_oneway_left_bg';
    else if (newBloxType === BloxType.OW_R) name = 'blx_oneway_right_fg';
    else if (newBloxType === BloxType.OW_R_BG) name = 'blx_oneway_right_bg';
    else if (newBloxType === BloxType.OW_U) name = 'blx_oneway_up_fg';
    else if (newBloxType === BloxType.OW_U_BG) name = 'blx_oneway_up_bg';
    else if (newBloxType === BloxType.OW_D) name = 'blx_oneway_down_fg';
    else if (newBloxType === BloxType.OW_D_BG) name = 'blx_oneway_down_bg';
    else if (newBloxType === BloxType.GEN_MOVE) name = 'blx_generic_movable';
    else if (newBloxType === BloxType.BOMB) name = 'blx_bomb';
    else if (newBloxType === BloxType.BOMB_INACTIVE) name = 'blx_bomb_inactive';
    else if (newBloxType === BloxType.BOLTS) name = 'blx_bolts';
    else if (newBloxType === BloxType.HOLE) name = 'blx_hole';
    else if (newBloxType === BloxType.BREAKER) name = 'blx_breakable';
    else if (newBloxType === BloxType.X) name = 'blx_x';
    else if (newBloxType === BloxType.O) name = 'blx_o';
    else if (newBloxType === BloxType.POT_BRIDGE) name = 'blx_bridge_pot';
    else if (newBloxType === BloxType.BRIDGE) name = 'blx_bridge';
    this.setBitmap(name ? bm.get(name) : null);
  }

  setVel(newVel) {
    this.vel = newVel;
  }
}
