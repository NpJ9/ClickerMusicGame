const canvas =document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const counter = document.getElementById("counter");
const missed = document.getElementById("missed");
const win = document.getElementById("win_container");
const reset = document.getElementById("reset");
const start = document.getElementById("start");
const percentage = document.getElementById("percentage");
const musicArr = ["1.wav", "2.wav", "3.wav", "4.wav"];
let timer = document.getElementById("timer");

let percentageResult = 0;
let points = 0;
let misses = 0;
let totalClicks = 0;
let seconds = 5;
let timerIsOn = false;

// Tracks current circles Paths 2D object

let circle = null;
let gameFinished = false;
let soundPlayed = false;
let interval = null;
let winSoundInterval = null;

// Resizes canvas according to window size

window.addEventListener('resize', resizeCanvas, false);

function resizeCanvas(){
    canvas.height = window.innerHeight * 0.85;
    canvas.width = window.innerWidth * 0.9;
    if (gameFinished === true) return // If game is finished don't redraw circles
    draw();
}

// Draws a random circle in canvas

function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draws circles within the Canvas border

    let x = Math.floor(Math.random() * (canvas.width - 40)) + 20;
    let y = Math.floor(Math.random() * (canvas.height - 40)) + 20;
    let radius = 20;
   
    // Draw Circle

    circle = new Path2D();
    circle.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#00ADB5";
    ctx.strokeStyle= "#00ADB5"
    ctx.lineWidth = 8;
    ctx.stroke(circle);
    ctx.fill(circle);
};

 canvas.addEventListener('mousedown', function(e){
        e.preventDefault(); // Prevents text selection on scores
        totalClicks += 1;
        if (gameFinished === true) return

        // Checks location of mouse click and if it match position of cirlce
        if(circle && ctx.isPointInPath(circle, e.offsetX, e.offsetY)) {
            points += 1;
            counter.innerHTML = points;
            playRandomNote();
            draw();            
        }  else{
            misses += 1
            missed.innerHTML = misses
        }            
    });

// Plays a random audio note on hit

function playRandomNote(){
    for (let i = 0; i < 5; i++){
    const audioIndex = Math.floor(Math.random() * musicArr.length);
    const newAudio = new Audio(musicArr[audioIndex])
    newAudio.currentTime = 0;
    newAudio.volume = 0.2;
    newAudio.play();
    }    
} 

// Initiliaze start game timer
   
function countDown() {
    if(gameFinished) return;

    if(seconds === 0){
        clearInterval(interval);
        interval = null;
        gameFinished = true;
        getPercentage();
        // Fixed win sound playing on reset 
        winSoundInterval = setInterval(playWinSound, 600); 
        canvas.classList.add("endgame");
        win.classList.add("finishedGame");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
        seconds -= 1;
        timer.innerHTML = seconds;
    }
}

function playStartSound(){
    const startSound = new Audio("startSound.wav");
    startSound.volume = 0.3;
    startSound.play();  
}

function playWinSound(){
    if (soundPlayed) return;
    soundPlayed = true;
    const endSound = new Audio("endround.wav");
    endSound.volume = 0.4;
    endSound.currentTime = 0;
    endSound.play();
}

// Gets percentage to display

function getPercentage() {
    if(totalClicks === 0){ // Fixed NaN printing
        percentage.innerHTML = 0 + "%";
        percentage.classList.add("missed");
        percentage.classList.remove("counter");
    } else {
        percentageResult =  points / totalClicks * 100;
    if (percentageResult >= 80) {
        percentage.classList.add("counter");
        percentage.classList.remove("missed");
    } else if (percentageResult < 80 ){
        percentage.classList.add("missed");
        percentage.classList.remove("counter");
    }
    percentage.innerHTML = parseFloat(percentageResult).toFixed(2) + "%";
}}

// Resets the game 

reset.addEventListener('click' , (e) =>{
    win.classList.remove("finishedGame");    
    start.classList.remove("turnOffDisplay");    
    points = 0;
    misses = 0;
    totalClicks = 0;
    seconds = 5;

    // Clear the win sound interval so it doesn't play on reset 
    clearInterval(winSoundInterval);
    clearInterval(interval);

    winSoundInterval = null;
    timerIsOn = false;
    gameFinished = true;
    soundPlayed = false;
    interval = null;
    playStartSound();
    counter.innerHTML = 0;
    missed.innerHTML = 0;
    timer.innerHTML = 60;
    draw(); 
});

// Starts the game

start.addEventListener('click' , (e) => {
    start.classList.add("turnOffDisplay");   
    canvas.classList.remove("endgame");
    points = 0;
    misses = 0;
    totalClicks = 0;
    counter.innerHTML = points;
    missed.innerHTML = misses;
    gameFinished = false;
    draw();
    playStartSound();
    if(timerIsOn === false){ // Clears timer intervals
        clearInterval(interval);
        interval = setInterval(countDown, 1000); 
        timerIsOn = true;
    }
});

resizeCanvas();