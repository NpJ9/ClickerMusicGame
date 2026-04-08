// ============================================================
// LEVEL & TIME CONFIG
// ============================================================
const LEVELS = [
  {
    name: "Normal",
    ballRadius: 52,
    expireMs: 4000,
    spawnSpeed: 0.15,
    multiplier: 2,
  },
  {
    name: "Hard",
    ballRadius: 32,
    expireMs: 2000,
    spawnSpeed: 0.22,
    multiplier: 5,
  },
];

const musicArr = [
  "Audio/1.wav",
  "Audio/2.wav",
  "Audio/3.wav",
  "Audio/4.wav",
  "Audio/5.wav",
  "Audio/6.wav",
  "Audio/7.wav",
  "Audio/8.wav",
  "Audio/9.wav",
  "Audio/10.wav",
  "Audio/11.wav",
  "Audio/12.wav",
  "Audio/13.wav",
  "Audio/14.wav",
  "Audio/15.wav",
];

// ============================================================
// DOM REFS
// ============================================================
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const counterEl = document.getElementById("counter");
const missedEl = document.getElementById("missed");
const timerEl = document.getElementById("timer");
const winContainer = document.getElementById("win_container");
const resetBtn = document.getElementById("reset");
const startBtn = document.getElementById("start");
const setupPanel = document.getElementById("setup_panel");
const playBtn = document.getElementById("play_btn");
const hudEl = document.getElementById("hud");

// ============================================================
// SETUP STATE
// ============================================================
let selectedLevelIndex = null;
let selectedPhoto = null;

// ============================================================
// GAME STATE
// ============================================================
let currentLevel = LEVELS[0];
let ballRadius = 50;
let points = 0;
let misses = 0;
let totalClicks = 0;
let seconds = 0;
let gameFinished = false;
let gameStarted = false;
let soundPlayed = false;
let interval = null;
let winSoundInterval = null;

// ============================================================
// BALL STATE
// ============================================================
let ballX, ballY;
let currentBallImage = null;
let lastBallImage = null;
let ballScale = 0;
let ballAlpha = 0;
let ballState = "idle"; // 'spawning' | 'idle' | 'dying'
let circle = null;
let ballExpireTimeout = null;

// ============================================================
// PARTICLES
// ============================================================
let particles = [];

// ============================================================
// GAME LOOP
// ============================================================
let loopRunning = false;

function startLoop() {
  if (loopRunning) return;
  loopRunning = true;
  requestAnimationFrame(tick);
}

function stopLoop() {
  loopRunning = false;
}

function tick() {
  if (!loopRunning) return;
  updateBall();
  updateParticles();
  render();
  requestAnimationFrame(tick);
}

// ============================================================
// CANVAS RESIZE
// ============================================================
window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
  const hudHeight = hudEl.offsetHeight || 44;
  canvas.height = window.innerHeight - hudHeight - 4;
  canvas.width = window.innerWidth * 0.9;
  if (!gameStarted || gameFinished) return;
  render();
}

// ============================================================
// BALL UPDATE
// ============================================================
function updateBall() {
  const spd = currentLevel.spawnSpeed;

  if (ballState === "spawning") {
    ballScale += (1 - ballScale) * spd;
    ballAlpha += (1 - ballAlpha) * spd;
    if (1 - ballScale < 0.005) {
      ballScale = 1;
      ballAlpha = 1;
      ballState = "idle";
      if (currentLevel.expireMs !== null && !gameFinished) {
        ballExpireTimeout = setTimeout(() => {
          if (ballState === "idle" && !gameFinished) {
            misses++;
            missedEl.textContent = misses;
            ballState = "dying";
          }
        }, currentLevel.expireMs);
      }
    }
  } else if (ballState === "dying") {
    ballScale *= 0.72;
    ballAlpha *= 0.72;
    if (ballScale < 0.015) {
      ballScale = 0;
      ballAlpha = 0;
      spawnNextBall();
    }
  }
}

// ============================================================
// PARTICLES UPDATE
// ============================================================
function updateParticles() {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.vx *= 0.983;
    p.alpha -= p.decay;
    p.size *= 0.974;
  }
  particles = particles.filter((p) => p.alpha > 0 && p.size > 0.3);
}

// ============================================================
// RENDER
// ============================================================
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameStarted && !gameFinished && ballX !== undefined && ballScale > 0.01) {
    const r = ballRadius * ballScale;
    const glowPulse =
      ballState === "idle" ? 0.7 + 0.3 * Math.sin(Date.now() / 220) : ballAlpha;

    ctx.save();
    ctx.shadowColor = `rgba(0,210,255,${ballAlpha * glowPulse})`;
    ctx.shadowBlur = 28;
    ctx.strokeStyle = `rgba(0,210,255,${ballAlpha * 0.85 * glowPulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ballX, ballY, r + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = ballAlpha;
    circle = new Path2D();
    circle.arc(ballX, ballY, r, 0, Math.PI * 2);
    ctx.clip(circle);
    ctx.drawImage(currentBallImage, ballX - r, ballY - r, r * 2, r * 2);
    ctx.restore();
  }

  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ============================================================
// SPAWN BALL
// ============================================================
function spawnNextBall() {
  clearTimeout(ballExpireTimeout);
  ballExpireTimeout = null;
  ballX =
    Math.floor(Math.random() * (canvas.width - ballRadius * 2 - 20)) +
    ballRadius +
    10;
  ballY =
    Math.floor(Math.random() * (canvas.height - ballRadius * 2 - 20)) +
    ballRadius +
    10;
  currentBallImage = pickNextImage();
  ballScale = 0;
  ballAlpha = 0;
  ballState = "spawning";
}

// ============================================================
// PARTICLES SPAWN
// ============================================================
function spawnParticles(x, y) {
  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 12 + 2.5;
    const hue = Math.floor(Math.random() * 360);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      alpha: 1,
      decay: Math.random() * 0.016 + 0.01,
      size: Math.random() * 10 + 3,
      color: `hsl(${hue},100%,${58 + Math.floor(Math.random() * 18)}%)`,
    });
  }
}

// ============================================================
// IMAGE LOADING
// ============================================================
const chloeImageSrcs = [
  "images/ChloeImages/chloe_1.jpg",
  "images/ChloeImages/chloe_2.jpg",
  "images/ChloeImages/chloe_3.jpg",
  "images/ChloeImages/chloe_4.png",
  "images/ChloeImages/chloe_5.png",
  "images/ChloeImages/chloe_6.png",
  "images/ChloeImages/chloe_7.png",
  "images/ChloeImages/chloe_8.png",
  "images/ChloeImages/chloe_9.png",
];

const jackImageSrcs = [
  "images/JackImages/jack_1.png",
  "images/JackImages/jack_2.png",
  "images/JackImages/jack_3.png",
  "images/JackImages/jack_4.png",
  "images/JackImages/jack_5.png",
  "images/JackImages/jack_6.png",
  "images/JackImages/jack_7.png",
  "images/JackImages/jack_8.png",
  "images/JackImages/jack_9.jpg",
];

const ballImages = [];
let imagesLoaded = 0;

const allImageSrcs = [...chloeImageSrcs, ...jackImageSrcs];
for (const src of allImageSrcs) {
  const img = new Image();
  img.src = src;
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === allImageSrcs.length) resizeCanvas();
  };
  img.onerror = () => console.error(`Image failed to load: ${src}`);
  ballImages.push(img);
}

let activeBallImages = ballImages;

function pickNextImage() {
  if (activeBallImages.length === 1) return activeBallImages[0];
  let img;
  do {
    img = activeBallImages[Math.floor(Math.random() * activeBallImages.length)];
  } while (img === lastBallImage);
  lastBallImage = img;
  return img;
}

// ============================================================
// INPUT
// ============================================================
function handleTap(x, y) {
  if (gameFinished || !gameStarted) return;
  totalClicks++;

  if (ballState !== "idle") {
    misses++;
    missedEl.textContent = misses;
    return;
  }

  if (circle && ctx.isPointInPath(circle, x, y)) {
    clearTimeout(ballExpireTimeout);
    ballExpireTimeout = null;
    points++;
    counterEl.textContent = points;
    spawnParticles(ballX, ballY);
    playRandomNote();
    ballState = "dying";
  } else {
    misses++;
    missedEl.textContent = misses;
  }
}

canvas.addEventListener("mousedown", (e) => {
  e.preventDefault();
  handleTap(e.offsetX, e.offsetY);
});

canvas.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    handleTap(touch.clientX - rect.left, touch.clientY - rect.top);
  },
  { passive: false },
);

// ============================================================
// AUDIO
// ============================================================
let lastNoteIndex = null;

function playRandomNote() {
  let index;
  do {
    index = Math.floor(Math.random() * musicArr.length);
  } while (index === lastNoteIndex && musicArr.length > 1);
  lastNoteIndex = index;
  const audio = new Audio(musicArr[index]);
  audio.currentTime = 0;
  audio.volume = 0.2;
  audio.play();
}

function playStartSound() {
  const s = new Audio("startSound.wav");
  s.volume = 0.3;
  s.play();
}

function playWinSound() {
  if (soundPlayed) return;
  soundPlayed = true;
  const s = new Audio("endround.wav");
  s.volume = 0.4;
  s.play();
}

// ============================================================
// TIMER
// ============================================================
function countDown() {
  if (gameFinished) return;
  if (seconds === 0) {
    clearInterval(interval);
    interval = null;
    gameFinished = true;
    stopLoop();
    clearTimeout(ballExpireTimeout);
    ballExpireTimeout = null;
    showEndScreen();
    winSoundInterval = setInterval(playWinSound, 600);
    canvas.classList.add("endgame");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  } else {
    seconds--;
    timerEl.textContent = seconds;
  }
}

// ============================================================
// END SCREEN
// ============================================================
function showEndScreen() {
  const accuracy = totalClicks === 0 ? 0 : (points / totalClicks) * 100;
  const score = Math.round(points * currentLevel.multiplier);

  document.getElementById("final_hits").textContent = points;
  document.getElementById("final_misses").textContent = misses;
  document.getElementById("final_accuracy").textContent =
    accuracy.toFixed(1) + "%";
  document.getElementById("win_level").textContent =
    `Level: ${currentLevel.name}`;
  document.getElementById("win_score").textContent = `Score: ${score}`;

  const accEl = document.getElementById("final_accuracy");
  accEl.className = "win_stat_value " + (accuracy >= 70 ? "counter" : "missed");

  hudEl.classList.add("hidden");
  winContainer.classList.add("finishedGame");
}

// ============================================================
// SETUP PANEL LOGIC
// ============================================================
function checkPlayReady() {
  playBtn.disabled = !(selectedLevelIndex !== null && selectedPhoto !== null);
}

document.querySelectorAll("[data-level]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll("[data-level]")
      .forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedLevelIndex = parseInt(btn.dataset.level);
    checkPlayReady();
  });
});

document.querySelectorAll("[data-photo]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll("[data-photo]")
      .forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedPhoto = btn.dataset.photo;
    if (selectedPhoto === "chloe") {
      const s = new Audio("chloe.wav");
      s.volume = 0.5;
      s.play();
    } else if (selectedPhoto === "jack") {
      const s = new Audio("jack.wav");
      s.volume = 0.5;
      s.play();
    } else {
      const s = new Audio("jacknchloe.wav");
      s.volume = 0.5;
      s.play();
    }
    checkPlayReady();
  });
});

playBtn.addEventListener("click", () => {
  if (playBtn.disabled) return;
  setupPanel.classList.remove("show");
  beginGame();
});

// ============================================================
// START BUTTON
// ============================================================
startBtn.addEventListener("click", () => {
  startBtn.classList.add("turnOffDisplay");
  setupPanel.classList.add("show");
});

// ============================================================
// BEGIN GAME
// ============================================================
function beginGame() {
  currentLevel = LEVELS[selectedLevelIndex];
  ballRadius = currentLevel.ballRadius;
  seconds = 20;

  if (selectedPhoto === "chloe") {
    activeBallImages = ballImages.slice(0, chloeImageSrcs.length);
  } else if (selectedPhoto === "jack") {
    activeBallImages = ballImages.slice(chloeImageSrcs.length);
  } else {
    activeBallImages = ballImages;
  }

  points = 0;
  misses = 0;
  totalClicks = 0;
  lastBallImage = null;
  soundPlayed = false;

  counterEl.textContent = 0;
  missedEl.textContent = 0;
  timerEl.textContent = seconds;

  canvas.classList.remove("endgame");
  gameFinished = false;
  gameStarted = true;
  particles = [];

  hudEl.classList.remove("hidden");
  spawnNextBall();
  playStartSound();
  startLoop();

  clearInterval(interval);
  interval = setInterval(countDown, 1000);
}

// ============================================================
// RESET
// ============================================================
resetBtn.addEventListener("click", () => {
  const s = new Audio("hellosir.wav");
  s.volume = 0.5;
  s.play();
  winContainer.classList.remove("finishedGame");
  startBtn.classList.remove("turnOffDisplay");

  selectedLevelIndex = null;
  selectedPhoto = null;
  document
    .querySelectorAll(".setup_btn")
    .forEach((b) => b.classList.remove("selected"));
  playBtn.disabled = true;

  clearInterval(winSoundInterval);
  clearInterval(interval);
  clearTimeout(ballExpireTimeout);

  winSoundInterval = null;
  ballExpireTimeout = null;
  gameFinished = true;
  gameStarted = false;
  soundPlayed = false;
  interval = null;
  particles = [];

  stopLoop();

  counterEl.textContent = 0;
  missedEl.textContent = 0;
  timerEl.textContent = 0;

  hudEl.classList.add("hidden");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// ============================================================
// INIT
// ============================================================
resizeCanvas();
