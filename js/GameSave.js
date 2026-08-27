class GameSave {
  static SAVE_DATA_NAME = 'BloXoRSaveData';

  constructor(game) {
    this.g = game;
  }

  saveUserData() {
    const g = this.g;
    const lines = [];
    for (let i = 0; i < g.levelData.length; i++) {
      lines.push(g.levelData[i].getDataString());
    }
    const data = {
      appVersion: (typeof VERSION !== 'undefined' ? VERSION : ''),
      firstTime: g.firstTime,
      curLevel: g.curPuzzleInd,
      soundMuted: g.soundManager ? g.soundManager.muted() : false,
      userLevelData: lines.join('\n')
    };
    try {
      localStorage.setItem(GameSave.SAVE_DATA_NAME, JSON.stringify(data));
    } catch (e) {}
  }

  loadUserData() {
    const g = this.g;
    let settings = {};
    try {
      settings = JSON.parse(localStorage.getItem(GameSave.SAVE_DATA_NAME) || '{}');
    } catch (e) {
      settings = {};
    }

    g.firstTime = settings.firstTime !== false;
    g.curPuzzleInd = settings.curLevel || 0;
    const muted = !!settings.soundMuted;

    g.lvlsOpen = 0;
    g.totScore = 0;
    g.totTime = 0;
    g.lvlsBeat = 0;
    g.totGamesPlayed = 0;

    const playerlevelDataS = settings.userLevelData || '';
    if (playerlevelDataS !== '') {
      const playerlevelData = playerlevelDataS.split('\n');
      for (let i = 0; i < playerlevelData.length && i < g.levelData.length; i++) {
        if (!playerlevelData[i]) continue;
        g.levelData[i].setData(playerlevelData[i]);
        if (g.levelData[i].opened) {
          g.lvlsOpen++;
          g.totGamesPlayed += g.levelData[i].playCount;
        }
        if (g.levelData[i].beaten) {
          g.lvlsBeat++;
          g.totScore += g.levelData[i].score;
          g.totTime += g.levelData[i].timePlayed;
          if (!g.levelData[i].opened) {
            g.levelData[i].opened = true;
            g.lvlsOpen++;
          }
        }
      }
    }

    if (g.lvlsOpen === 0 && g.levelData.length) {
      g.levelData[0].opened = true;
      g.lvlsOpen = 1;
    }

    g.setSoundMute(muted);
    return true;
  }
}
