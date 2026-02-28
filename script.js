const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreNode = document.getElementById("score");
const bestNode = document.getElementById("best");
const restartBtn = document.getElementById("restart");

const game = {
  gravity: 0.38,
  jump: -7.2,
  speed: 2.2,
  gap: 165,
  frame: 0,
  score: 0,
  best: Number(localStorage.getItem("flappy-cookie-best") || 0),
  running: true,
  cookie: {
    x: 95,
    y: canvas.height / 2,
    radius: 20,
    velocity: 0,
    tilt: 0,
  },
  pipes: [],
};

bestNode.textContent = String(game.best);

function reset() {
  game.cookie.y = canvas.height / 2;
  game.cookie.velocity = 0;
  game.cookie.tilt = 0;
  game.pipes = [];
  game.score = 0;
  game.frame = 0;
  game.running = true;
  scoreNode.textContent = "0";
}

function spawnPipe() {
  const minTop = 70;
  const maxTop = canvas.height - game.gap - 150;
  const topHeight = Math.random() * (maxTop - minTop) + minTop;

  game.pipes.push({
    x: canvas.width + 40,
    w: 68,
    topHeight,
    passed: false,
  });
}

function flap() {
  if (!game.running) {
    reset();
  }
  game.cookie.velocity = game.jump;
}

function drawCookie() {
  const c = game.cookie;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.tilt);

  ctx.fillStyle = "#d69e5a";
  ctx.beginPath();
  ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#b1793f";
  const chips = [
    [-8, -7, 3],
    [6, -9, 3],
    [-5, 8, 2.8],
    [9, 4, 2.4],
    [1, 0, 2.6],
    [-11, 1, 2.2],
  ];

  chips.forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawPipe(pipe) {
  const bottomY = pipe.topHeight + game.gap;

  ctx.fillStyle = "#f6fbff";
  ctx.fillRect(pipe.x, 0, pipe.w, pipe.topHeight);
  ctx.fillRect(pipe.x, bottomY, pipe.w, canvas.height - bottomY);

  ctx.fillStyle = "#dcefff";
  ctx.fillRect(pipe.x - 4, pipe.topHeight - 12, pipe.w + 8, 12);
  ctx.fillRect(pipe.x - 4, bottomY, pipe.w + 8, 12);

  ctx.fillStyle = "rgba(180, 220, 245, 0.7)";
  ctx.fillRect(pipe.x + pipe.w * 0.18, 0, pipe.w * 0.24, pipe.topHeight);
  ctx.fillRect(pipe.x + pipe.w * 0.18, bottomY, pipe.w * 0.24, canvas.height - bottomY);
}

function drawBackground() {
  ctx.fillStyle = "#8fd3ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.beginPath();
  ctx.ellipse(90, 95, 45, 18, 0, 0, Math.PI * 2);
  ctx.ellipse(290, 160, 62, 24, 0, 0, Math.PI * 2);
  ctx.ellipse(345, 90, 40, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f7dda3";
  ctx.fillRect(0, canvas.height - 94, canvas.width, 94);

  ctx.fillStyle = "#ebca82";
  ctx.fillRect(0, canvas.height - 94, canvas.width, 10);
}

function checkCollision(pipe) {
  const c = game.cookie;
  const cookieLeft = c.x - c.radius;
  const cookieRight = c.x + c.radius;
  const cookieTop = c.y - c.radius;
  const cookieBottom = c.y + c.radius;
  const pipeRight = pipe.x + pipe.w;
  const gapBottom = pipe.topHeight + game.gap;

  const horizontalHit = cookieRight > pipe.x && cookieLeft < pipeRight;
  const verticalHit = cookieTop < pipe.topHeight || cookieBottom > gapBottom;

  return horizontalHit && verticalHit;
}

function endGame() {
  game.running = false;
  if (game.score > game.best) {
    game.best = game.score;
    localStorage.setItem("flappy-cookie-best", String(game.best));
    bestNode.textContent = String(game.best);
  }
}

function update() {
  if (!game.running) {
    return;
  }

  game.frame += 1;

  if (game.frame % 95 === 0) {
    spawnPipe();
  }

  game.cookie.velocity += game.gravity;
  game.cookie.y += game.cookie.velocity;
  game.cookie.tilt = Math.max(-0.45, Math.min(0.8, game.cookie.velocity / 10));

  if (game.cookie.y + game.cookie.radius >= canvas.height - 94 || game.cookie.y - game.cookie.radius <= 0) {
    endGame();
  }

  game.pipes.forEach((pipe) => {
    pipe.x -= game.speed;

    if (!pipe.passed && pipe.x + pipe.w < game.cookie.x) {
      pipe.passed = true;
      game.score += 1;
      scoreNode.textContent = String(game.score);
    }

    if (checkCollision(pipe)) {
      endGame();
    }
  });

  game.pipes = game.pipes.filter((pipe) => pipe.x + pipe.w > -20);
}

function drawOverlay() {
  if (game.running) {
    return;
  }

  ctx.fillStyle = "rgba(55, 24, 0, 0.45)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 40px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 28);

  ctx.font = "bold 22px Trebuchet MS";
  ctx.fillText(`Score: ${game.score}`, canvas.width / 2, canvas.height / 2 + 8);

  ctx.font = "18px Trebuchet MS";
  ctx.fillText("Tap, click, or press Space to restart", canvas.width / 2, canvas.height / 2 + 42);
}

function render() {
  drawBackground();
  game.pipes.forEach(drawPipe);
  drawCookie();
  drawOverlay();
}

function tick() {
  update();
  render();
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    flap();
  }
});

canvas.addEventListener("pointerdown", flap);
restartBtn.addEventListener("click", reset);

reset();
tick();
