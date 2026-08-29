console.log('BloXoR', VERSION);

const canvas = document.getElementById('gameCanvas');
const game = new BloXor(canvas);

function lockLandscape() {
  const ori = screen.orientation;
  if (!ori || typeof ori.lock !== 'function') return;
  const p = ori.lock('landscape');
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

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

const _enter = game.enterPlayFullscreen.bind(game);
game.enterPlayFullscreen = function () {
  _enter();
  lockLandscape();
  setTimeout(lockLandscape, 350);
};

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => {
  lockLandscape();
  setTimeout(resize, 200);
});
document.addEventListener('fullscreenchange', () => {
  resize();
  if (game.isFullscreen()) lockLandscape();
});
document.addEventListener('webkitfullscreenchange', () => {
  resize();
  if (game.isFullscreen()) lockLandscape();
});
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
