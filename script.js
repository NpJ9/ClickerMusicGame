const canvas =document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const counter = document.getElementById("counter");
const missed = document.getElementById("missed");
let points = 0;
let misses = 0;
const musicArr = ["1.wav", "2.wav", "3.wav", "4.wav"]

// Tracks current circles Paths 2d object

let circle = null;

// Resizes canvas according to window size

window.addEventListener('resize', resizeCanvas, false);

// window.addEventListener('click', resizeCanvas);

function resizeCanvas(){
    canvas.height = window.innerHeight * 0.8;
    canvas.width = window.innerWidth * 0.9;
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
    ctx.lineWidth = 8;
    ctx.stroke(circle);
    ctx.fill(circle);
}

    // Checks click position

 canvas.addEventListener('mousedown', function(e){
        e.preventDefault(); // Prevents text selection
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        // console.log(mouseX + " + " + mouseY);
        // console.log(x + " + " + y);

        if(circle && ctx.isPointInPath(circle, e.offsetX, e.offsetY)) {
            points += 1;
            counter.innerHTML = points
            playRandomNote();
            draw();
        }  else{
            misses += 1
            missed.innerHTML = misses
        }
        console.clear();
        console.log("Points: "+ points);
        console.log("Misses: "+ misses);
        
    })


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

resizeCanvas();