class GameView {
  constructor(game, canvas) {
    this.g = game;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  layout(cssW, cssH) {
    const g = this.g;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    g.WIDTH = 480;
    g.HEIGHT = 320;
    g.CENTER_X = 240;
    g.CENTER_Y = 160;
    g.bloxDist = 40;
    g.bloxDistDiv2 = 20;
    g.bloxDistMin1 = 40;
    g.BLOX_SPEED = 22;
    g.HOLE_FALLIN_DIST = 40 * 0.57;
    g.theScale = 1;
    g.TOUCH_LEFT = 0;
    g.TOUCH_TOP = 0;

    const board = BitmapManager.getInstance().get('whole_bg_ls');
    const boardW = board ? board.width : 480;
    const boardH = board ? board.height : 320;
    g.viewScale = Math.min(cw / boardW, ch / boardH);
    g.viewOx = (cw - boardW * g.viewScale) / 2;
    g.viewOy = (ch - boardH * g.viewScale) / 2;

    if (!g.bgp) {
      g.bgp = new Sprite(board, new Coord(g.CENTER_X, g.CENTER_Y));
    } else {
      g.bgp.setBitmap(board);
      g.bgp.setPos(new Coord(g.CENTER_X, g.CENTER_Y));
    }
    g.bgp.curGState.scale = 1;

    if (!g.alignBg) {
      g.alignBg = new Sprite(BitmapManager.getInstance().get('align_target_bg'), new Coord(g.CENTER_X, g.CENTER_Y));
      g.alignArrow = new Sprite(BitmapManager.getInstance().get('align_target_arrow'), new Coord(g.CENTER_X, g.CENTER_Y));
    }
    g.alignBg.curGState.scale = 1;
    g.alignArrow.curGState.scale = 1;
    g.alignBg.setPos(new Coord(g.CENTER_X, g.CENTER_Y));

    if (!g.iaHilite) {
      g.iaHilite = new Sprite(BitmapManager.getInstance().get('hilite_circle'), new Coord(g.CENTER_X, g.CENTER_Y));
    } else {
      g.iaHilite.setBitmap(BitmapManager.getInstance().get('hilite_circle'));
    }
    g.iaHilite.curGState.scale = 1;

    g.TOP = g.CENTER_Y - boardH / 2 + g.bloxDist;
    g.BOTTOM = g.CENTER_Y + boardH / 2 - g.bloxDist;
    g.LEFT = g.CENTER_X - boardW / 2 + g.bloxDist;
    g.RIGHT = g.CENTER_X + boardW / 2 - g.bloxDist;
  }

  draw() {
    const g = this.g;
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.setTransform(g.viewScale, 0, 0, g.viewScale, g.viewOx, g.viewOy);

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

    if (g.waitingOnAct && g.curiaBlox && g.iaHilite) {
      g.iaHilite.setPos(new Coord(g.curiaBlox.pos.x, g.curiaBlox.pos.y));
      g.iaHilite.curGState.rotation = (g.iaHilite.curGState.rotation + 1.4) % 360;
      g.iaHilite.draw(ctx);
    }

    if (g.gameState === GameState.WaitToStartNewLevel) {
      const co = new Coord(
        g.CENTER_X + (g.alignBg.getWidth() / 1.8 * g.downx),
        g.CENTER_Y + (g.alignBg.getHeight() / 1.8 * g.downy)
      );
      const scale = 1 - Math.sqrt(Math.pow(g.downx, 2) + Math.pow(g.downy, 2));
      g.alignArrow.curGState.scale = scale;
      g.alignArrow.setPos(co);
      g.alignBg.draw(ctx);
      g.alignArrow.draw(ctx);
      if (g.downx === 0 && g.downy === 0) {
        g.gameState = GameState.InPlay;
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.drawHud(ctx);
  }

  drawHud(ctx) {
    const g = this.g;
    if (g.gameState !== GameState.InPlay && g.gameState !== GameState.WaitToStartNewLevel) return;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = Math.max(12, Math.round(this.canvas.height * 0.035)) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const pad = 10;
    ctx.fillText('SCORE ' + g.curLvlData.score, pad, pad);
    ctx.textAlign = 'right';
    const sec = g.curLvlData.seconds;
    const t = Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
    ctx.fillText('TILTS ' + g.curLvlData.moves + '   ' + t, this.canvas.width - pad, pad);
    ctx.textAlign = 'left';
    ctx.font = Math.max(10, Math.round(this.canvas.height * 0.028)) + 'px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText('arrows / WASD  ·  drag to tilt  ·  A / Space bomb  ·  Esc pause', pad, this.canvas.height - pad - 16);
    ctx.restore();
  }
}
