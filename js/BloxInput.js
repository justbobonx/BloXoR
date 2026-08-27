class BloxInput {
  constructor(game) {
    this.g = game;
    this.keys = Object.create(null);
    this.pointerDown = false;
    this.dragOrigin = null;
    this.KEY_TILT = 0.12;
    this.KEY_TILT_HARD = 0.26;
    this.MOUSE_MAX = 0.22;
    this.MOUSE_DEAD_PX = 10;
    this.MOUSE_FULL_PX = 90;
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
      const rect = canvas.getBoundingClientRect();
      this.dragOrigin = {
        x: ev.clientX - rect.left,
        y: ev.clientY - rect.top
      };
      this.handlePointer(ev, canvas, 'down');
    };
    const onMove = (ev) => {
      if (!this.pointerDown) return;
      this.handlePointer(ev, canvas, 'move');
    };
    const onUp = (ev) => {
      this.pointerDown = false;
      this.dragOrigin = null;
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
    const hard = this.keys.ShiftLeft || this.keys.ShiftRight;
    const mag = hard ? this.KEY_TILT_HARD : this.KEY_TILT;
    let x = 0;
    let y = 0;
    if (this.keys.ArrowLeft || this.keys.KeyA) x -= mag;
    if (this.keys.ArrowRight || this.keys.KeyD) x += mag;
    if (this.keys.ArrowUp || this.keys.KeyW) y -= mag;
    if (this.keys.ArrowDown || this.keys.KeyS) y += mag;
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
      const ox = this.dragOrigin ? this.dragOrigin.x : rect.width * 0.5;
      const oy = this.dragOrigin ? this.dragOrigin.y : rect.height * 0.5;
      const dx = x - ox;
      const dy = y - oy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.MOUSE_DEAD_PX) {
        g.downx = 0;
        g.downy = 0;
      } else {
        const reach = Math.min(1, (dist - this.MOUSE_DEAD_PX) / this.MOUSE_FULL_PX);
        const scale = (this.MOUSE_MAX * reach) / dist;
        g.downx = dx * scale;
        g.downy = dy * scale;
      }
      g.updateMoveCnt();
    } else if (phase === 'up') {
      g.downx = 0.0;
      g.downy = 0.0;
      this.applyKeys();
    }
  }
}
