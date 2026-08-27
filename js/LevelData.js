class LevelData {
  constructor(index, name) {
    this.index = index;
    this.name = name;
    this.indexSpaceName = String(index + 1) + ' - ' + name;
    this.description = null;

    this.opened = false;
    this.beaten = false;
    this.firstBeat = 0;

    this.playCount = 0;
    this.timePlayed = 0.0;
    this.movedOn = false;

    this.score = 0;
    this.moves = 999999999;
    this.seconds = 999999999.9;
  }

  setData(s) {
    const dataIn = s.split('\t');
    this.opened = dataIn[0] === 'true';
    this.beaten = dataIn[1] === 'true';
    this.firstBeat = parseInt(dataIn[2], 10);
    this.playCount = parseInt(dataIn[3], 10);
    this.timePlayed = parseFloat(dataIn[4]);
    this.movedOn = dataIn[5] === 'true';
    this.score = parseInt(dataIn[6], 10);
    this.moves = parseInt(dataIn[7], 10);
    this.seconds = parseFloat(dataIn[8]);
  }

  toString() {
    return this.name;
  }

  formattedDateTime(t) {
    if (!t) return '';
    const d = new Date(t);
    return d.toLocaleString();
  }

  getDataString() {
    return [
      this.opened,
      this.beaten,
      this.firstBeat,
      this.playCount,
      this.timePlayed,
      this.movedOn,
      this.score,
      this.moves,
      this.seconds,
      ''
    ].join('\t');
  }

  getDescription() {
    return this.description || 'Good Luck!';
  }
}
