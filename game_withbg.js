const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverEl = document.getElementById('gameOver');
const restartBtn = document.getElementById('restartBtn');
const pauseBtn = document.getElementById('pauseBtn');
const scoreEl = document.getElementById('score');

let player, obstacles, frame, gameSpeed, gameOver, obstacleFrequency, paused, score;
let background, character;

function loadImages() {
    background = new Image();
    background.src = 'assets/forest-background.jpeg';  // Add your background image path here

    character = new Image();
    character.src = 'assets/running_koala.png';  // Add your character image path here

    character.onload = () => {
        init();
    };
}

function init() {
    player = {
        x: canvas.width / 2 - 75,  // Adjust the x position if needed
        y: canvas.height - 150,  // Adjusted to place the character at the bottom
        width: 100,  // Adjusted size of the character (increase to make larger)
        height: 100, // Adjusted size of the character (increase to make larger)
        speed: 5,
        dx: 0,
        dy: 0
    };

    obstacles = [];
    frame = 0;
    gameSpeed = 3;
    obstacleFrequency = 100;
    gameOver = false;
    paused = false;
    score = 0;

    gameOverEl.style.display = 'none';
    scoreEl.textContent = 'Score: 0';
    update();
}

function drawBackground() {
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
    ctx.drawImage(character, player.x, player.y, player.width, player.height);
}

function createObstacle() {
    const minGap = 100; // Minimum gap for the player to pass through
    const maxWidth = canvas.width / 2;
    const width = Math.random() * (maxWidth - minGap) + minGap;
    const x = Math.random() * (canvas.width - width);
    const height = 50;
    obstacles.push({ x, y: 0, width, height });
}

function drawObstacles() {
    ctx.fillStyle = 'red';
    obstacles = obstacles.filter(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        obstacle.y += gameSpeed;
        return obstacle.y < canvas.height; // Keep only obstacles still on screen
    });
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function newPos() {
    player.x += player.dx;
    player.y += player.dy;

    if (player.x < 0) {
        player.x = 0;
    } else if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }

    if (player.y < 0) {
        player.y = 0;
    } else if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
    }
}

function detectCollision() {
    const playerHitbox = {
        x: player.x + player.width * 0.2,
        y: player.y + player.height * 0.2,
        width: player.width * 0.6,
        height: player.height * 0.6
    };

    for (let obstacle of obstacles) {
        if (
            playerHitbox.x < obstacle.x + obstacle.width &&
            playerHitbox.x + playerHitbox.width > obstacle.x &&
            playerHitbox.y < obstacle.y + obstacle.height &&
            playerHitbox.y + playerHitbox.height > obstacle.y
        ) {
            gameOver = true;
            return;
        }
    }
}
function update() {
    if (gameOver) {
        gameOverEl.style.display = 'block';
        return;
    }

    if (!paused) {
        clear();
        drawBackground();
        drawPlayer();
        drawObstacles();
        newPos();
        detectCollision();

        frame++;
        if (frame % obstacleFrequency === 0) {
            createObstacle();
        }

        score++;
        scoreEl.textContent = `Score: ${score}`;

        requestAnimationFrame(update);
    }
}

function moveUp() {
    player.dy = -player.speed;
}

function moveDown() {
    player.dy = player.speed;
}

function moveLeft() {
    player.dx = -player.speed;
}

function moveRight() {
    player.dx = player.speed;
}

function keyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'd') {
        moveRight();
    } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        moveLeft();
    } else if (e.key === 'ArrowUp' || e.key === 'w') {
        moveUp();
    } else if (e.key === 'ArrowDown' || e.key === 's') {
        moveDown();
    }
}

function keyUp(e) {
    if (
        e.key === 'ArrowRight' || e.key === 'd' ||
        e.key === 'ArrowLeft' || e.key === 'a' ||
        e.key === 'ArrowUp' || e.key === 'w' ||
        e.key === 'ArrowDown' || e.key === 's'
    ) {
        player.dx = 0;
        player.dy = 0;
    }
}

function togglePause() {
    paused = !paused;
    if (!paused) {
        update();
    }
}

restartBtn.addEventListener('click', init);
pauseBtn.addEventListener('click', togglePause);
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

loadImages();
