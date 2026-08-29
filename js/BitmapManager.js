class BitmapManager {
  static instance = null;

  constructor() {
    this.cache = new Map();
  }

  static initialize() {
    BitmapManager.instance = new BitmapManager();
    return BitmapManager.instance;
  }

  static getInstance() {
    if (!BitmapManager.instance) BitmapManager.initialize();
    return BitmapManager.instance;
  }

  get(name) {
    return this.cache.get(name) || null;
  }

  getBitmapforResource(name) {
    return this.get(name);
  }

  makeTile(name, color, label) {
    const c = document.createElement('canvas');
    c.width = 40;
    c.height = 40;
    const ctx = c.getContext('2d');
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(2, 2, 36, 36, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.stroke();
    if (label) {
      ctx.fillStyle = '#111';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 20, 21);
    }
    this.cache.set(name, c);
    return c;
  }

  makeHilite() {
    const c = document.createElement('canvas');
    c.width = 48;
    c.height = 48;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = 'rgba(255,220,80,0.95)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(24, 24, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(24, 24, 12, 0.2, Math.PI * 1.1);
    ctx.stroke();
    this.cache.set('hilite_circle', c);
    return c;
  }

  makeBoard(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1a2430';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    const cell = 40;
    for (let x = 40; x < w; x += cell) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 40);
      ctx.lineTo(x + 0.5, h - 40);
      ctx.stroke();
    }
    for (let y = 40; y < h; y += cell) {
      ctx.beginPath();
      ctx.moveTo(40, y + 0.5);
      ctx.lineTo(w - 40, y + 0.5);
      ctx.stroke();
    }
    ctx.strokeStyle = '#3a4a5a';
    ctx.lineWidth = 4;
    ctx.strokeRect(38, 38, w - 76, h - 76);
    this.cache.set('whole_bg_ls', c);
    return c;
  }

  loadPlaceholders() {
    this.makeBoard(480, 320);
    this.makeHilite();
    this.makeTile('blx_wall', '#5a5a5a', '');
    this.makeTile('blx_generic_movable', '#c8c8d0', '');
    this.makeTile('blx_o', '#3cb4ff', 'O');
    this.makeTile('blx_x', '#ff5a5a', 'X');
    this.makeTile('blx_hole', '#0a0a0a', '\u25cf');
    this.makeTile('blx_bomb', '#e0a020', 'B');
    this.makeTile('blx_bomb_inactive', '#806010', 'b');
    this.makeTile('blx_breakable', '#8a6a4a', '/');
    this.makeTile('blx_bolts', '#8899aa', '+');
    this.makeTile('blx_bridge_pot', '#6a8a4a', 'P');
    this.makeTile('blx_bridge', '#4a7a3a', '=');
    this.makeTile('blx_oneway_left_fg', '#4a6aaa', '\u2190');
    this.makeTile('blx_oneway_left_bg', '#2a3a55', '');
    this.makeTile('blx_oneway_right_fg', '#4a6aaa', '\u2192');
    this.makeTile('blx_oneway_right_bg', '#2a3a55', '');
    this.makeTile('blx_oneway_up_fg', '#4a6aaa', '\u2191');
    this.makeTile('blx_oneway_up_bg', '#2a3a55', '');
    this.makeTile('blx_oneway_down_fg', '#4a6aaa', '\u2193');
    this.makeTile('blx_oneway_down_bg', '#2a3a55', '');
    this.makeTile('align_target_bg', '#224466', '');
    this.makeTile('align_target_arrow', '#88ccff', '+');
    this.makeTile('effect_cloud', '#dddddd', '');
    this.makeTile('effect_explosion', '#ff8844', '*');
    return this;
  }

  async loadAll() {
    this.loadPlaceholders();
    const files = {
      whole_bg_ls: 'assets/images/whole_bg_ls.png',
      hilite_circle: 'assets/images/hilite_circle.png',
      blx_wall: 'assets/images/blx_wall.png',
      blx_generic_movable: 'assets/images/blx_generic_movable.png',
      blx_o: 'assets/images/blx_o.png',
      blx_x: 'assets/images/blx_x.png',
      blx_hole: 'assets/images/blx_hole.png',
      blx_bomb: 'assets/images/blx_bomb.png',
      blx_bomb_inactive: 'assets/images/blx_bomb_inactive.png',
      blx_breakable: 'assets/images/blx_breakable.png',
      blx_bolts: 'assets/images/blx_bolts.png',
      blx_bridge_pot: 'assets/images/blx_bridge_pot.png',
      blx_bridge: 'assets/images/blx_bridge.png',
      blx_oneway_left_fg: 'assets/images/blx_oneway_left_fg.png',
      blx_oneway_left_bg: 'assets/images/blx_oneway_left_bg.png',
      blx_oneway_right_fg: 'assets/images/blx_oneway_right_fg.png',
      blx_oneway_right_bg: 'assets/images/blx_oneway_right_bg.png',
      blx_oneway_up_fg: 'assets/images/blx_oneway_up_fg.png',
      blx_oneway_up_bg: 'assets/images/blx_oneway_up_bg.png',
      blx_oneway_down_fg: 'assets/images/blx_oneway_down_fg.png',
      blx_oneway_down_bg: 'assets/images/blx_oneway_down_bg.png',
      align_target_bg: 'assets/images/align_target_bg.png',
      align_target_arrow: 'assets/images/align_target_arrow.png',
      effect_cloud: 'assets/images/effect_cloud.png',
      effect_explosion: 'assets/images/effect_explosion.png'
    };
    const loads = Object.entries(files).map(([name, url]) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.cache.set(name, img);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = url;
      });
    });
    await Promise.all(loads);
    return this;
  }
}
