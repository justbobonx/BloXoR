class SoundManager {
  static instance = null;

  constructor() {
    this._muted = false;
    this.clips = {};
    this.live = {};
    this.unlocked = false;
  }

  static getInstance() {
    if (!SoundManager.instance) SoundManager.instance = new SoundManager();
    return SoundManager.instance;
  }

  muted() {
    return this._muted;
  }

  mute() {
    this._muted = true;
    Object.keys(this.live).forEach((name) => this.stopSound(name));
  }

  unmute() {
    this._muted = false;
  }

  initSounds() {
    const names = [
      'sfx_bloxor', 'sfx_boom', 'sfx_boom2', 'sfx_click', 'sfx_click1', 'sfx_click2',
      'sfx_fall', 'sfx_levelup', 'sfx_slide', 'sfx_thud', 'sfx_win'
    ];
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const a = new Audio('assets/audio/' + name + '.ogg');
      a.preload = 'auto';
      a.loop = (name === 'sfx_slide');
      this.clips[name] = a;
    }
    const unlock = () => this.unlock();
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);
  }

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    const names = Object.keys(this.clips);
    for (let i = 0; i < names.length; i++) {
      const a = this.clips[names[i]];
      const p = a.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          a.pause();
          a.currentTime = 0;
        }).catch(() => {});
      } else {
        try { a.pause(); a.currentTime = 0; } catch (err) {}
      }
    }
  }

  loadSound() {}

  playSound(name, rate, vol, loop) {
    if (this._muted) return 0;
    const src = this.clips[name];
    if (!src) return 0;
    this.unlock();
    const hold = (name === 'sfx_slide') || loop === true;
    const a = hold ? src : src.cloneNode(true);
    a.loop = hold;
    if (rate != null && isFinite(rate) && rate > 0) {
      try { a.playbackRate = rate; } catch (err) {}
    }
    if (vol != null && isFinite(vol)) a.volume = Math.max(0, Math.min(1, vol));
    else a.volume = 1;
    try { a.currentTime = 0; } catch (err) {}
    const p = a.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
    this.live[name] = a;
    return 1;
  }

  adjustSoundVolume(name, vol) {
    const a = this.live[name] || this.clips[name];
    if (!a) return;
    a.volume = Math.max(0, Math.min(1, vol == null ? 0 : vol));
  }

  adjustSoundRate(name, rate) {
    const a = this.live[name] || this.clips[name];
    if (!a || rate == null || !isFinite(rate) || rate <= 0) return;
    try { a.playbackRate = rate; } catch (err) {}
  }

  stopSound(name) {
    const a = this.live[name] || this.clips[name];
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
    } catch (err) {}
    delete this.live[name];
  }

  cleanup() {
    Object.keys(this.clips).forEach((name) => this.stopSound(name));
    SoundManager.instance = null;
  }
}
