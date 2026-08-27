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
  }

  unmute() {
    this._muted = false;
  }

  initSounds() {}

  loadSound() {}

  playSound() {
    return 0;
  }

  adjustSoundVolume() {}

  adjustSoundRate() {}

  stopSound() {}

  cleanup() {
    SoundManager.instance = null;
  }
}
