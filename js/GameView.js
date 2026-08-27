class GameView {
  constructor(game, canvas) {
    this.g = game;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  layout(cssW, cssH) {
    const g = this.g;
    g.WIDTH = this.canvas.width;
    g.HEIGHT = this.canvas.height;
    g.CENTER_X = g.WIDTH / 2;
    g.CENTER_Y = g.HEIGHT / 2;

    const board = BitmapManager.getInstance().get('whole_bg_ls');
    const boardW = board ? board.width : 480;
    const boardH = board ? board.height : 320;
    g.theScale = Math.min(g.WIDTH / boardW, g.HEIGHT / boardH);

    g.bloxDist = 40.0 * g.theScale;
    g.bloxDistDiv2 = g.bloxDist / 2;
    g.bloxDistMin1 = g.bloxDist;
    g.BLOX_SPEED = 22 * g.theScale;
    g.HOLE_FALLIN_DIST = 40.0 * 0.57 * g.theScale;

    if (!g.bgp) {
      g.bgp = new Sprite(board, new Coord(g.CENTER_X, g.CENTER_Y));
    } else {
      g.bgp.setBitmap(board);
      g.bgp.setPos(new Coord(g.CENTER_X, g.CENTER_Y));
    }
    g.bgp.curGState.scale = g.theScale;

    if (!g.alignBg) {
      g.alignBg = new Sprite(BitmapManager.getInstance().get('align_target_bg'), new Coord(g.CENTER_X, g.CENTER_Y));
      g.alignArrow = new Sprite(BitmapManager.getInstance().get('align_target_arrow'), new Coord(g.CENTER_X, g.CENTER_Y));
    }
    g.alignBg.curGState.scale = g.theScale;
    g.alignArrow.curGState.scale = g.theScale;
    g.alignBg.setPos(new Coord(g.CENTER_X, g.CENTER_Y));

    g.TOUCH_TOP = (g.HEIGHT - g.bgp.getHeight()) / 2;
    g.TOUCH_LEFT = (g.WIDTH - g.bgp.getWidth()) / 2;

    g.TOP = g.bgp.pos.y - g.bgp.getHeight() / 2 + g.bloxDist;
    g.BOTTOM = g.bgp.pos.y + g.bgp.getHeight() / 2 - g.bloxDist;
    g.LEFT = g.bgp.pos.x - g.bgp.getWidth() / 2 + g.bloxDist;
    g.RIGHT = g.bgp.pos.x + g.bgp.getWidth() / 2 - g.bloxDist;
  }

  draw() {
    const g = this.g;
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, g.WIDTH, g.HEIGHT);

    if (g.bgp) g.bgp.draw(ctx);
    for (let bi = 0; bi < g.underBloxs.length; bi++) g.underBloxs[bi].draw(ctx);
    for (let bi = 0; bi < g.surfaceBloxs.length; bi++) g.surfaceBloxs[bi].draw(ctx);
    for (let bi = 0; bi < g.overBloxs.length; bi++) g.overBloxs[bi].draw(ctx);
    for (let bi = 0; bi < g.effects.length; bi++) {
      const s = g.effects[bi];
      s.draw(ctx);
      if (!s.isAnimating() && s.shouldRemoveWhenDoneAnimating()) {
        g.effects.splice(bi, 1);
        bi--;
      }
    }

    if (g.gameState === GameState.WaitToStartNewLevel) {
      const co = new Coord(
        g.CENTER_X + (g.alignBg.getWidth() / 1.8 * g.downx),
        g.CENTER_Y + (g.alignBg.getHeight() / 1.8 * g.downy)
      );
      const scale = 1 - Math.sqrt(Math.pow(g.downx, 2) + Math.pow(g.downy, 2));
      g.alignArrow.curGState.scale = g.theScale * scale;
      g.alignArrow.setPos(co);
      g.alignBg.draw(ctx);
      g.alignArrow.draw(ctx);
      if (g.downx === 0 && g.downy === 0) {
        g.gameState = GameState.InPlay;
      }
    }

    this.drawHud(ctx);
  }

  drawHud(ctx) {
    const g = this.g;
    if (g.gameState !== GameState.InPlay && g.gameState !== GameState.WaitToStartNewLevel) return;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = Math.max(12, Math.round(g.HEIGHT * 0.035)) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const pad = 10;
    ctx.fillText('SCORE ' + g.curLvlData.score, pad, pad);
    ctx.textAlign = 'right';
    const sec = g.curLvlData.seconds;
    const t = Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
    ctx.fillText('TILTS ' + g.curLvlData.moves + '   ' + t, g.WIDTH - pad, pad);
    ctx.textAlign = 'left';
    ctx.font = Math.max(10, Math.round(g.HEIGHT * 0.028)) + 'px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText('arrows / WASD  ·  drag to tilt  ·  tap bomb  ·  Esc pause', pad, g.HEIGHT - pad - 16);
    ctx.restore();
  }
}
