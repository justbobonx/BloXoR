class PuzzleLoader {
  constructor(game) {
    this.g = game;
    this.cache = new Map();
  }

  async preload(names) {
    const loads = names.map(async (name) => {
      const url = 'assets/data/' + name + '.txt';
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(String(res.status));
        this.cache.set(name, await res.text());
      } catch (e) {
        console.warn('puzzle load failed', name, e);
        this.cache.set(name, '');
      }
    });
    await Promise.all(loads);
  }

  setupPuzzleI(i) {
    const g = this.g;
    g.bloxO1 = g.bloxX = g.bloxO2 = null;
    g.underBloxs.length = 0;
    g.surfaceBloxs.length = 0;
    g.overBloxs.length = 0;
    g.moverBloxs.length = 0;
    g.effects.length = 0;
    g.field.clearAll();

    const name = g.levelData[i].name;
    const text = this.cache.get(name) || '';
    const lines = text.split(/\r?\n/);

    for (let li = 0; li < lines.length; li++) {
      const confLine = lines[li];
      if (confLine.length === 0) continue;
      if (confLine.charAt(0) === '#') continue;
      const params = confLine.split('\t');
      if (params.length < 3) continue;

      const newBloxType = params[0];
      const x = parseInt(params[1], 10);
      const y = parseInt(params[2], 10);

      const aBlox = new Blox(newBloxType);
      aBlox.setPos(new Coord(g.LEFT + x * g.bloxDist, g.TOP + y * g.bloxDist));
      aBlox.curGState.scale = 1;

      let boltIt = false;
      if (params.length > 3 && params[3] === 'bolts') boltIt = true;

      if (aBlox.bloxType === BloxType.HOLE) {
        g.underBloxs.push(aBlox);
        g.field.addBloxToField(aBlox, g.field.underfield[x][y]);
      } else if (aBlox.bloxType === BloxType.WALL || aBlox.bloxType === BloxType.BREAKER) {
        g.surfaceBloxs.push(aBlox);
        g.field.addBloxToField(aBlox, g.field.field[x][y]);
      } else if (aBlox.bloxType === BloxType.OW_L) {
        g.overBloxs.push(aBlox);
        g.field.addBloxToField(aBlox, g.field.field[x][y]);
        const bgBlox = new Blox('1W_L_BG');
        bgBlox.setPos(new Coord(g.LEFT + x * g.bloxDist, g.TOP + y * g.bloxDist));
        bgBlox.curGState.scale = 1;
        g.underBloxs.push(bgBlox);
      } else if (aBlox.bloxType === BloxType.OW_R) {
        g.overBloxs.push(aBlox);
        g.field.addBloxToField(aBlox, g.field.field[x][y]);
        const bgBlox = new Blox('1W_R_BG');
        bgBlox.setPos(new Coord(g.LEFT + x * g.bloxDist, g.TOP + y * g.bloxDist));
        bgBlox.curGState.scale = 1;
        g.underBloxs.push(bgBlox);
      } else if (aBlox.bloxType === BloxType.OW_U) {
        g.overBloxs.push(aBlox);
        g.field.addBloxToField(aBlox, g.field.field[x][y]);
        const bgBlox = new Blox('1W_U_BG');
        bgBlox.setPos(new Coord(g.LEFT + x * g.bloxDist, g.TOP + y * g.bloxDist));
        bgBlox.curGState.scale = 1;
        g.underBloxs.push(bgBlox);
      } else if (aBlox.bloxType === BloxType.OW_D) {
        g.overBloxs.push(aBlox);
        g.field.addBloxToField(aBlox, g.field.field[x][y]);
        const bgBlox = new Blox('1W_D_BG');
        bgBlox.setPos(new Coord(g.LEFT + x * g.bloxDist, g.TOP + y * g.bloxDist));
        bgBlox.curGState.scale = 1;
        g.underBloxs.push(bgBlox);
      } else {
        g.surfaceBloxs.push(aBlox);
        g.field.addBloxToField(aBlox, g.field.field[x][y]);
        if (boltIt) {
          const bgBlox = new Blox('Bolts');
          bgBlox.setPos(new Coord(g.LEFT + x * g.bloxDist, g.TOP + y * g.bloxDist));
          bgBlox.curGState.scale = 1;
          aBlox.bolted = bgBlox;
          g.overBloxs.push(bgBlox);
        } else {
          aBlox.mover = true;
          g.moverBloxs.push(aBlox);
        }
      }

      if (aBlox.bloxType === BloxType.O) {
        if (g.bloxO1 == null) g.bloxO1 = aBlox;
        else g.bloxO2 = aBlox;
      } else if (aBlox.bloxType === BloxType.X) {
        g.bloxX = aBlox;
      }
    }

    g.levelData[i].playCount++;
    g.totGamesPlayed++;
    g.rawScoreM = g.MAX_LVL_SCORE;
    g.rawScoreS = g.MAX_LVL_SCORE;
    g.curLvlData.score = (g.rawScoreM + g.rawScoreS) | 0;
    g.curLvlData.moves = 0;
    g.curLvlData.seconds = 0;
  }
}
