class GameView {
  constructor(game, canvas) {
    this.g = game;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.waitFlatSince = 0;
    this.waitState = null;
    this.WAIT_FLAT_MS = 360;
    this.ARROW_K = 0.4;
    this.ARROW_K_FLAT = 0.6;
    this.arrowX = null;
    this.arrowY = null;
    this.arrowS = 1;
  }

  layout(cssW, cssH) {
    const g = this.g;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    g.WIDTH = 480;
    g.HEIGHT = 320;
    g.CENTER_X = 240;
    g.CENTER_Y = 160;
    g.TOUCH_LEFT = 0;
    g.TOUCH_TOP = 0;
    g.theScale = 1;

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

    if (g.gameState === GameState.WaitToStartNewLevel && !g.input.usingTiltControl()) {
      g.startFromWait(false);
    }

    if (g.gameState === GameState.WaitToStartNewLevel && g.input.usingTiltControl()) {
      if (this.waitState !== g.gameState) {
        this.waitState = g.gameState;
        this.waitFlatSince = 0;
        this.arrowX = g.CENTER_X;
        this.arrowY = g.CENTER_Y;
        this.arrowS = 1;
      }
      const targetX = g.CENTER_X + (g.alignBg.getWidth() / 1.8 * g.downx);
      const targetY = g.CENTER_Y + (g.alignBg.getHeight() / 1.8 * g.downy);
      const mag = Math.sqrt(g.downx * g.downx + g.downy * g.downy);
      const targetS = Math.max(0.35, 1 - Math.min(1, mag));
      const atCenter = (g.downx === 0 && g.downy === 0);
      const k = atCenter ? this.ARROW_K_FLAT : this.ARROW_K;
      if (this.arrowX == null) {
        this.arrowX = targetX;
        this.arrowY = targetY;
        this.arrowS = targetS;
      } else {
        this.arrowX += k * (targetX - this.arrowX);
        this.arrowY += k * (targetY - this.arrowY);
        this.arrowS += k * (targetS - this.arrowS);
      }
      g.alignArrow.curGState.scale = this.arrowS;
      g.alignArrow.setPos(new Coord(this.arrowX, this.arrowY));
      g.alignBg.draw(ctx);
      g.alignArrow.draw(ctx);
      const sensed = g.input.tiltLive();
      if (sensed && atCenter) {
        if (!this.waitFlatSince) this.waitFlatSince = Date.now();
        if (Date.now() - this.waitFlatSince >= this.WAIT_FLAT_MS) g.startFromWait(false);
      } else {
        this.waitFlatSince = 0;
      }
    } else {
      this.waitState = g.gameState;
      this.waitFlatSince = 0;
      this.arrowX = null;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.drawHud(ctx);
  }

  fillRoundRect(ctx, x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, rr);
    } else {
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }
    ctx.fill();
  }

  drawHud(ctx) {
    const g = this.g;
    if (g.gameState !== GameState.InPlay && g.gameState !== GameState.WaitToStartNewLevel && g.gameState !== GameState.LevelBeat) return;
    ctx.save();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const fontPx = Math.max(12, Math.round(this.canvas.height * 0.035));
    const hintPx = Math.max(9, Math.round(fontPx * 0.72));
    const edge = 5;
    const inset = Math.max(3, Math.round(fontPx * 0.20));
    const radius = Math.max(4, Math.round(fontPx * 0.28));
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    ctx.font = fontPx + 'px sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    const scoreText = 'SCORE ' + g.ui.formatScore(g.curLvlData.score);
    const tiltsText = 'TILTS ' + g.curLvlData.moves;
    const sec = g.curLvlData.seconds;
    const t = Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
    const timeText = 'TIME ' + t;
    const scoreW = ctx.measureText(scoreText).width;
    const tiltsW = ctx.measureText(tiltsText).width;
    const timeW = ctx.measureText(timeText).width;
    const chipH = fontPx + inset * 2 - 4;
    const textY = edge + inset;
    const scoreBoxW = scoreW + inset * 2;
    const tiltsBoxW = tiltsW + inset * 2;
    const timeBoxW = timeW + inset * 2;
    const timeBoxX = cw - edge - timeBoxW;
    const tiltsBoxX = timeBoxX - inset*2 - tiltsBoxW;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.fillRoundRect(ctx, edge, edge, scoreBoxW, chipH, radius);
    this.fillRoundRect(ctx, tiltsBoxX, edge, tiltsBoxW, chipH, radius);
    this.fillRoundRect(ctx, timeBoxX, edge, timeBoxW, chipH, radius);

    ctx.fillStyle = '#ddc';
    ctx.fillText(scoreText, edge + inset, textY);
    ctx.fillText(tiltsText, tiltsBoxX + inset, textY);
    ctx.fillText(timeText, timeBoxX + inset, textY);

    ctx.font = hintPx + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const hint = 'long press for menu';
    const hintW = ctx.measureText(hint).width;
    const hintX = cw / 2;
    const hintY = ch - edge - inset;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    this.fillRoundRect(ctx, hintX - hintW / 2 - inset, hintY - hintPx - inset + 2, hintW + inset * 2, hintPx + inset * 1.5, radius);
    ctx.fillStyle = '#ddc';
    ctx.fillText(hint, hintX, hintY);
    ctx.restore();
  }
}
