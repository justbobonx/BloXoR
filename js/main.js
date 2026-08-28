console.log('BloXoR', VERSION);

const canvas = document.getElementById('gameCanvas');
const game = new BloXor(canvas);

function resize() {
  const container = document.getElementById('game-container');
  const rect = container.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  game.resize(rect.width, rect.height);
}

window.addEventListener('resize', resize);
document.addEventListener('fullscreenchange', resize);
document.addEventListener('webkitfullscreenchange', resize);
window.addEventListener('pagehide', () => game.saveGame());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') game.saveGame();
});

game.boot().then(() => {
  resize();
});
