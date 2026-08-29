console.log('BloXoR', VERSION);

const canvas = document.getElementById('gameCanvas');
const game = new BloXor(canvas);

function applyStage() {
  const tall = window.innerHeight > window.innerWidth;
  document.documentElement.classList.toggle('stage-swap', tall);
}

function resize() {
  applyStage();
  const container = document.getElementById('game-container');
  const cssW = container.clientWidth;
  const cssH = container.clientHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(cssW * dpr));
  canvas.height = Math.max(1, Math.floor(cssH * dpr));
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  game.resize(cssW, cssH);
}

window.applyStage = applyStage;
window.resizeGame = resize;

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));
document.addEventListener('fullscreenchange', resize);
document.addEventListener('webkitfullscreenchange', resize);
window.addEventListener('pagehide', () => {
  game.saveGame();
  game.onLostFocus();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    game.saveGame();
    game.onLostFocus();
  }
});

game.boot().then(() => {
  resize();
});
