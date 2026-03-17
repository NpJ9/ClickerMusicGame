const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const counter = document.getElementById("counter");
const missed = document.getElementById("missed");
const win = document.getElementById("win_container");
const reset = document.getElementById("reset");
const start = document.getElementById("start");
const picker = document.getElementById("picker");
const percentage = document.getElementById("percentage");
const musicArr = ["1.wav", "2.wav", "3.wav", "4.wav"];
let timer = document.getElementById("timer");

let percentageResult = 0;
let points = 0;
let misses = 0;
let totalClicks = 0;
let seconds = 5;
let timerIsOn = false;

let circle = null;
let gameFinished = false;
let gameStarted = false;
let soundPlayed = false;
let interval = null;
let winSoundInterval = null;

// --- Ball images ---
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

// Subset of ballImages active for the current game (set by picker)
let activeBallImages = ballImages;

// --- Ball state ---
let ballX, ballY;
const ballRadius = 50;
let currentBallImage = null;
let lastBallImage = null;

// --- Ball animation ---
let ballScale = 0;
let ballAlpha = 0;
// 'spawning' | 'idle' | 'dying'
let ballState = "idle";

// --- Particles ---
let particles = [];

// --- Game loop ---
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

// --- Canvas resize ---
window.addEventListener("resize", resizeCanvas, false);

function resizeCanvas() {
  canvas.height = window.innerHeight * 0.85;
  canvas.width = window.innerWidth * 0.9;
  if (!gameStarted || gameFinished) return;
  render();
}

// --- Update ball animation ---
function updateBall() {
  if (ballState === "spawning") {
    ballScale += (1 - ballScale) * 0.18;
    ballAlpha += (1 - ballAlpha) * 0.18;
    if (1 - ballScale < 0.005) {
      ballScale = 1;
      ballAlpha = 1;
      ballState = "idle";
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

// --- Update particles ---
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

// --- Render ---
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameStarted && !gameFinished && ballX !== undefined && ballScale > 0.01) {
    const r = ballRadius * ballScale;
    const glowPulse =
      ballState === "idle" ? 0.7 + 0.3 * Math.sin(Date.now() / 220) : ballAlpha;

    // Glow ring
    ctx.save();
    ctx.shadowColor = `rgba(0, 210, 255, ${ballAlpha * glowPulse})`;
    ctx.shadowBlur = 28;
    ctx.strokeStyle = `rgba(0, 210, 255, ${ballAlpha * 0.85 * glowPulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ballX, ballY, r + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Clipped photo
    ctx.save();
    ctx.globalAlpha = ballAlpha;
    circle = new Path2D();
    circle.arc(ballX, ballY, r, 0, Math.PI * 2);
    ctx.clip(circle);
    ctx.drawImage(currentBallImage, ballX - r, ballY - r, r * 2, r * 2);
    ctx.restore();
  }

  // Particles
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

// --- Spawn ball ---
function spawnNextBall() {
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

// --- Particles ---
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
      color: `hsl(${hue}, 100%, ${58 + Math.floor(Math.random() * 18)}%)`,
    });
  }
}

// --- Image picking ---
function pickNextImage() {
  if (activeBallImages.length === 1) return activeBallImages[0];
  let img;
  do {
    img = activeBallImages[Math.floor(Math.random() * activeBallImages.length)];
  } while (img === lastBallImage);
  lastBallImage = img;
  return img;
}

// --- Input ---
canvas.addEventListener("mousedown", function (e) {
  e.preventDefault();
  if (gameFinished || !gameStarted) return;
  totalClicks += 1;

  if (ballState !== "idle") {
    misses += 1;
    missed.innerHTML = misses;
    return;
  }

  if (circle && ctx.isPointInPath(circle, e.offsetX, e.offsetY)) {
    points += 1;
    counter.innerHTML = points;
    spawnParticles(ballX, ballY);
    playRandomNote();
    ballState = "dying";
  } else {
    misses += 1;
    missed.innerHTML = misses;
  }
});

// --- Audio ---
function playRandomNote() {
  for (let i = 0; i < 5; i++) {
    const audioIndex = Math.floor(Math.random() * musicArr.length);
    const newAudio = new Audio(musicArr[audioIndex]);
    newAudio.currentTime = 0;
    newAudio.volume = 0.2;
    newAudio.play();
  }
}

function playStartSound() {
  const startSound = new Audio("startSound.wav");
  startSound.volume = 0.3;
  startSound.play();
}

function playWinSound() {
  if (soundPlayed) return;
  soundPlayed = true;
  const endSound = new Audio("endround.wav");
  endSound.volume = 0.4;
  endSound.currentTime = 0;
  endSound.play();
}

// --- Timer ---
function countDown() {
  if (gameFinished) return;

  if (seconds === 0) {
    clearInterval(interval);
    interval = null;
    gameFinished = true;
    stopLoop();
    getPercentage();
    winSoundInterval = setInterval(playWinSound, 600);
    canvas.classList.add("endgame");
    win.classList.add("finishedGame");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  } else {
    seconds -= 1;
    timer.innerHTML = seconds;
  }
}

// --- Percentage ---
function getPercentage() {
  if (totalClicks === 0) {
    percentage.innerHTML = 0 + "%";
    percentage.classList.add("missed");
    percentage.classList.remove("counter");
  } else {
    percentageResult = (points / totalClicks) * 100;
    if (percentageResult >= 80) {
      percentage.classList.add("counter");
      percentage.classList.remove("missed");
    } else {
      percentage.classList.add("missed");
      percentage.classList.remove("counter");
    }
    percentage.innerHTML = parseFloat(percentageResult).toFixed(2) + "%";
  }
}

// --- Reset ---
reset.addEventListener("click", (e) => {
  win.classList.remove("finishedGame");
  start.classList.remove("turnOffDisplay");
  picker.classList.remove("show");
  points = 0;
  misses = 0;
  totalClicks = 0;
  seconds = 5;

  clearInterval(winSoundInterval);
  clearInterval(interval);

  winSoundInterval = null;
  timerIsOn = false;
  gameFinished = true;
  gameStarted = false;
  soundPlayed = false;
  interval = null;
  particles = [];
  stopLoop();
  playStartSound();
  counter.innerHTML = 0;
  missed.innerHTML = 0;
  timer.innerHTML = 60;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// --- Start ---
start.addEventListener("click", () => {
  start.classList.add("turnOffDisplay");
  picker.classList.add("show");
});

function beginGame() {
  picker.classList.remove("show");
  canvas.classList.remove("endgame");
  points = 0;
  misses = 0;
  totalClicks = 0;
  lastBallImage = null;
  counter.innerHTML = points;
  missed.innerHTML = misses;
  gameFinished = false;
  gameStarted = true;
  particles = [];
  spawnNextBall();
  playStartSound();
  startLoop();
  if (timerIsOn === false) {
    clearInterval(interval);
    interval = setInterval(countDown, 1000);
    timerIsOn = true;
  }
}

document.getElementById("pick_chloe").addEventListener("click", () => {
  activeBallImages = ballImages.slice(0, chloeImageSrcs.length);
  beginGame();
});

document.getElementById("pick_jack").addEventListener("click", () => {
  activeBallImages = ballImages.slice(chloeImageSrcs.length);
  beginGame();
});

document.getElementById("pick_both").addEventListener("click", () => {
  activeBallImages = ballImages;
  beginGame();
});
