const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player, obstacles, coins, frame, gameSpeed, gameOver, obstacleFrequency, paused, score, distance, coinImage, magnetImage;
let level = 1;
let backgroundLayers = [];
let obstacleImages = [];
let magnetActive = false;
let magnetTimer = 0;
let baseGameSpeed = 3;

function loadImages() {
    // Load background layers
    const backgroundSources = ['assets/summer.png', 'assets/spring.png', 'assets/snow.png','assets/rain.png'];
    backgroundSources.forEach((src, index) => {
        const img = new Image();
        img.src = src;
        backgroundLayers.push({ image: img, x: 0, speed: (index + 1) * 0.5 });
    });

    // Load character
    character = new Image();
    character.src = 'assets/running_koala.png';

    // Load coin
    coinImage = new Image();
    coinImage.src = 'assets/coin.png';

    // Load magnet
    magnetImage = new Image();
    magnetImage.src = 'assets/magnet.png';

    // Load obstacle images
    const obstacleImageSources = ['assets/rock.png', 'assets/log.png', 'assets/bush.png'];
    obstacleImageSources.forEach(src => {
        const img = new Image();
        img.src = src;
        obstacleImages.push(img);
    });

    Promise.all([
        ...backgroundLayers.map(layer => layer.image.decode()),
        character.decode(),
        coinImage.decode(),
        magnetImage.decode(),
        ...obstacleImages.map(img => img.decode())
    ]).then(() => {
        init();
    });
}

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    player = {
        x: canvas.width / 2 - 55,
        y: canvas.height - 150,
        width: 110,
        height: 150,
        speed: 5,
        dx: 0,
        dy: 0,
        jumpStrength: -20,
        gravity: 0.8,
        isJumping: false,
        jumpHeight: 200,
        groundY: canvas.height - 150
    };

    obstacles = [];
    coins = [];
    frame = 0;
    baseGameSpeed = 3;
    gameSpeed = baseGameSpeed;
    obstacleFrequency = 120;
    gameOver = false;
    paused = false;
    score = 0;
    distance = 0;
    level = 1;
    magnetActive = false;
    magnetTimer = 0;

    update();
}

function drawBackground() {
    const currentLayer = backgroundLayers[(level - 1) % backgroundLayers.length];
    ctx.drawImage(currentLayer.image, 0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
    ctx.drawImage(character, player.x, player.y, player.width, player.height);
}

function createObstacle() {
    const minWidth = 50;
    const maxWidth = 100;
    const width = Math.random() * (maxWidth - minWidth) + minWidth;
    const x = Math.random() * (canvas.width - width);
    const height = Math.random() * 50 + 50;
    const imageIndex = Math.floor(Math.random() * obstacleImages.length);
    obstacles.push({ x, y: -height, width, height, image: obstacleImages[imageIndex] });
}

function createCoin() {
    const size = 100;
    let x, y;
    let colliding;
    let isVertical = Math.random() < 0.3; // 30% chance of vertical arrangement

    do {
        colliding = false;
        x = Math.random() * (canvas.width - size);
        y = -size;

        if (isVertical) {
            for (let i = 0; i < 3; i++) {
                coins.push({ x, y: y - i * size, size, isMagnet: false });
            }
        } else {
            coins.push({ x, y, size, isMagnet: false });
        }

        // Check collision with obstacles
        for (let obstacle of obstacles) {
            if (x < obstacle.x + obstacle.width &&
                x + size > obstacle.x &&
                y < obstacle.y + obstacle.height &&
                y + size > obstacle.y) {
                colliding = true;
                break;
            }
        }
    } while (colliding);
}

function createMagnet() {
    const size = 50;
    let x, y;
    let colliding;

    do {
        colliding = false;
        x = Math.random() * (canvas.width - size);
        y = -size;

        // Check collision with obstacles and coins
        for (let obstacle of obstacles) {
            if (x < obstacle.x + obstacle.width &&
                x + size > obstacle.x &&
                y < obstacle.y + obstacle.height &&
                y + size > obstacle.y) {
                colliding = true;
                break;
            }
        }
        for (let coin of coins) {
            if (x < coin.x + coin.size &&
                x + size > coin.x &&
                y < coin.y + coin.size &&
                y + size > coin.y) {
                colliding = true;
                break;
            }
        }
    } while (colliding);

    coins.push({ x, y, size, isMagnet: true });
}

function drawObstacles() {
    obstacles = obstacles.filter(obstacle => {
        ctx.drawImage(obstacle.image, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        obstacle.y += gameSpeed;
        return obstacle.y < canvas.height;
    });
}

function drawCoins() {
    coins = coins.filter(coin => {
        if (coin.isMagnet) {
            ctx.drawImage(magnetImage, coin.x, coin.y, coin.size, coin.size);
        } else {
            ctx.drawImage(coinImage, coin.x, coin.y, coin.size, coin.size);
        }
        coin.y += gameSpeed;
        return coin.y < canvas.height;
    });
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}  Distance: ${Math.floor(distance)}m  Level: ${level}`, 10, 30);
}

function drawPauseButton() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(canvas.width - 60, 10, 50, 50);
    ctx.fillStyle = 'black';
    ctx.font = '30px Arial';
    ctx.fillText(paused ? '▶' : '❚❚', canvas.width - 50, 45);
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function newPos() {
    player.x += player.dx;

    if (player.isJumping) {
        player.y += player.dy;
        player.dy += player.gravity;

        if (player.y < player.groundY - player.jumpHeight) {
            player.y = player.groundY - player.jumpHeight;
            player.dy = 0;
        }

        if (player.y > player.groundY) {
            player.y = player.groundY;
            player.isJumping = false;
            player.dy = 0;
        }
    }

    if (player.x < 0) player.x = 0;
    else if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

function jump() {
    if (!player.isJumping) {
        player.isJumping = true;
        player.dy = player.jumpStrength;
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
            playerHitbox.y + playerHitbox.height > obstacle.y &&
            !player.isJumping
        ) {
            gameOver = true;
            return;
        }
    }

    coins = coins.filter(coin => {
        if (
            playerHitbox.x < coin.x + coin.size &&
            playerHitbox.x + playerHitbox.width > coin.x &&
            playerHitbox.y < coin.y + coin.size &&
            playerHitbox.y + playerHitbox.height > coin.y
        ) {
            if (coin.isMagnet) {
                magnetActive = true;
                magnetTimer = 600; // 10 seconds (60 fps * 10)
            } else {
                score += 10;
            }
            return false;
        }
        return true;
    });
}

function updateLevel() {
    level = Math.floor(distance / 1000) + 1;
    obstacleFrequency = Math.max(120 - (level * 5), 60);
    baseGameSpeed = 3 + (level * 0.2);
    gameSpeed = magnetActive ? baseGameSpeed * 1.5 : baseGameSpeed;
}

function update() {
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.fillText('Game Over', canvas.width / 2 - 70, canvas.height / 2 - 50);
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 80, canvas.height / 2);
        
        ctx.fillStyle = 'green';
        ctx.fillRect(canvas.width / 2 - 60, canvas.height / 2 + 20, 120, 40);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('Restart', canvas.width / 2 - 30, canvas.height / 2 + 45);
        return;
    }

    if (!paused) {
        clear();
        drawBackground();
        drawPlayer();
        drawObstacles();
        drawCoins();
        newPos();
        detectCollision();

        frame++;
        updateLevel();

        if (frame % obstacleFrequency === 0) {
            createObstacle();
        }
        if (frame % 60 === 0) {
            createCoin();
        }
        if (frame % 600 === 0) { // Create magnet every 10 seconds
            createMagnet();
        }

        distance += gameSpeed / 10;

        if (magnetActive) {
            magnetTimer--;
            if (magnetTimer <= 0) {
                magnetActive = false;
                gameSpeed = baseGameSpeed;
            } else {
                // Attract nearby coins
                coins.forEach(coin => {
                    if (!coin.isMagnet) {
                        const dx = player.x - coin.x;
                        const dy = player.y - coin.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance < 200) {
                            coin.x += dx * 0.1;
                            coin.y += dy * 0.1;
                        }
                    }
                });
            }
        }

        drawScore();
    }

    drawPauseButton();
    requestAnimationFrame(update);
}

function moveLeft() {
    player.dx = -player.speed;
}

function moveRight() {
    player.dx = player.speed;
}

function keyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'd') moveRight();
    else if (e.key === 'ArrowLeft' || e.key === 'a') moveLeft();
    else if (e.key === ' ' || e.key === 'w') jump();
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
}

// Touch controls
let touchStartX = 0;
let touchStartY = 0;
let isTouching = false;

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isTouching = true;

    // Check if touch is on pause button
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    if (x > canvas.width - 60 && x < canvas.width - 10 && y > 10 && y < 60) {
        togglePause();
    } else {
        jump();
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isTouching) return;

    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX;

    if (diffX > 50) {
        moveRight();
    } else if (diffX < -50) {
        moveLeft();
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    isTouching = false;
    player.dx = 0;
}

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

loadImages();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});