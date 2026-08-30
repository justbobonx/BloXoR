class SoundManager {
  static instance = null;

  constructor() {
    this._muted = false;
    this.clips = {};
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
    this.stopAll();
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
      const a = new Audio('assets/audio/' + names[i] + '.ogg');
      a.preload = 'auto';
      this.clips[names[i]] = a;
    }
    const kick = () => {
      document.removeEventListener('pointerdown', kick, true);
      document.removeEventListener('keydown', kick, true);
      const list = Object.keys(this.clips);
      for (let i = 0; i < list.length; i++) {
        const a = this.clips[list[i]];
        const p = a.play();
        if (p && p.then) p.then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
      }
    };
    document.addEventListener('pointerdown', kick, true);
    document.addEventListener('keydown', kick, true);
  }

  playSound(name, rate, vol, loop) {
    if (this._muted) return 0;
    const a = this.clips[name];
    if (!a) return 0;
    a.loop = (name === 'sfx_slide') || loop === true;
    a.volume = vol == null ? 1 : Math.max(0, Math.min(1, vol));
    try { a.playbackRate = (rate > 0) ? rate : 1; } catch (err) {}
    try { a.currentTime = 0; } catch (err) {}
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
    return 1;
  }

  adjustSoundVolume(name, vol) {
    const a = this.clips[name];
    if (a) a.volume = Math.max(0, Math.min(1, vol || 0));
  }

  adjustSoundRate(name, rate) {
    const a = this.clips[name];
    if (a && rate > 0) {
      try { a.playbackRate = rate; } catch (err) {}
    }
  }

  stopSound(name) {
    const a = this.clips[name];
    if (!a) return;
    a.loop = false;
    a.pause();
    try { a.currentTime = 0; } catch (err) {}
  }

  stopAll() {
    Object.keys(this.clips).forEach((name) => this.stopSound(name));
  }
}
