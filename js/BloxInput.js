class BloxInput {
  constructor(game) {
    this.g = game;
    this.keys = Object.create(null);
    this.pointerDown = false;
  }

  attach(canvas) {
    const g = this.g;
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].indexOf(e.code) >= 0) {
        e.preventDefault();
      }
      if (e.code === 'Escape') g.backPressed();
      this.applyKeys();
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.applyKeys();
    });

    const onDown = (ev) => {
      this.pointerDown = true;
      this.handlePointer(ev, canvas, 'down');
    };
    const onMove = (ev) => {
      if (!this.pointerDown) return;
      this.handlePointer(ev, canvas, 'move');
    };
    const onUp = (ev) => {
      this.pointerDown = false;
      this.handlePointer(ev, canvas, 'up');
    };

    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  applyKeys() {
    const g = this.g;
    if (this.pointerDown) return;
    let x = 0;
    let y = 0;
    if (this.keys.ArrowLeft || this.keys.KeyA) x -= 0.55;
    if (this.keys.ArrowRight || this.keys.KeyD) x += 0.55;
    if (this.keys.ArrowUp || this.keys.KeyW) y -= 0.55;
    if (this.keys.ArrowDown || this.keys.KeyS) y += 0.55;
    g.downx = x;
    g.downy = y;
    g.updateMoveCnt();
  }

  handlePointer(ev, canvas, phase) {
    const g = this.g;
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;

    if (g.gameState === GameState.LevelBeat) {
      if (phase === 'down') {
        g.gameState = GameState.NoDraw;
        g.ui.closeScore();
        g.ui.showLevelSelect();
      }
      return;
    }

    if (g.gameState === GameState.InPlay && phase === 'up') {
      const touchx = x * (g.WIDTH / rect.width) - g.TOUCH_LEFT;
      const touchy = y * (g.HEIGHT / rect.height) - g.TOUCH_TOP;
      const tx = Math.trunc((touchx - g.bloxDistDiv2) / g.bloxDist);
      const ty = Math.trunc((touchy - g.bloxDistDiv2) / g.bloxDist);
      if (tx >= 0 && tx < g.BLoxCntX && ty >= 0 && ty < g.BLoxCntY) {
        const tspot = g.field.field[tx][ty];
        for (let i = 0; i < tspot.length; i++) {
          const b = tspot[i];
          if (b.bloxType === BloxType.BOMB) {
            const gx = x * (g.WIDTH / rect.width);
            const gy = y * (g.HEIGHT / rect.height);
            if (Math.abs(gx - b.pos.x) < g.bloxDistDiv2 && Math.abs(gy - b.pos.y) < g.bloxDistDiv2) {
              g.physics.blowUpBlox(b);
            }
          }
        }
      }
    }

    if (phase === 'move' || phase === 'down') {
      g.downx = x / rect.width - 0.5;
      g.downy = y / rect.height - 0.5;
      g.updateMoveCnt();
    } else if (phase === 'up') {
      g.downx = 0.0;
      g.downy = 0.0;
      this.applyKeys();
    }
  }
}
