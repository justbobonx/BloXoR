class LevelIndex {
  constructor(game) {
    this.g = game;
  }

  async load() {
    const g = this.g;
    g.levelData.length = 0;
    let text = '';
    try {
      const res = await fetch('assets/puzzles/PuzzleIndex.txt');
      text = await res.text();
    } catch (e) {
      text = 'Test Slide\tLine up O X O.\n';
    }
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const infoLine = lines[i];
      if (infoLine.length <= 1) continue;
      const infoItems = infoLine.split('\t');
      const newLevel = new LevelData(g.levelData.length, infoItems[0]);
      if (infoItems.length > 1) newLevel.description = infoItems[1];
      g.levelData.push(newLevel);
    }
  }
}
