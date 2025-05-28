const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');

// 游戏参数
let gameWidth = 800;
let gameHeight = 400;
canvas.width = gameWidth;
canvas.height = gameHeight;

let gravity = 0.8;
let gameSpeed = 3.5; // 降低了初始游戏速度
let score = 0;
let gameOver = false;
let gameStarted = false;

// 主角
const player = {
    x: 50,
    y: gameHeight - 50, 
    width: 40,
    height: 40,
    color: '#ff4b4b', 
    velocityY: 0,
    isJumping: false,
    jumpsLeft: 2, 
    jumpPower: 15,
    grounded: true,
    draw: function() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = 'white';
        ctx.fillRect(this.x + 8, this.y + 8, 8, 8);
        ctx.fillRect(this.x + this.width - 16, this.y + 8, 8, 8);
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + 11, this.y + 11, 3, 3);
        ctx.fillRect(this.x + this.width - 13, this.y + 11, 3, 3);
    },
    jump: function() {
        if (this.jumpsLeft > 0) {
            this.velocityY = -this.jumpPower;
            this.isJumping = true;
            this.grounded = false;
            this.jumpsLeft--;
        }
    },
    update: function() {
        if (!this.grounded) {
            this.velocityY += gravity;
            this.y += this.velocityY;
        }
        // 移除了之前防止掉出画布底部的逻辑，现在掉下去会死（在 checkCollisions 中处理）

        if (this.x < 0) {
            this.x = 0;
        }
        if (this.x + this.width > gameWidth) {
            this.x = gameWidth - this.width;
        }
    }
};

// 平台
let platforms = [];
const platformSettings = {
    height: 20,
    minWidth: 80,
    maxWidth: 180, // 稍微减小最大宽度，增加一些变化
    gap: 130, 
    color: '#4caf50'
};

function createPlatform(x, y, width) {
    platforms.push({
        x: x,
        y: y,
        width: width,
        height: platformSettings.height,
        color: platformSettings.color,
        draw: function() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        },
        update: function() {
            this.x -= gameSpeed;
        }
    });
}

// 地面障碍物
let obstacles = [];
const obstacleSettings = {
    width: 30,
    height: 50,
    color: '#333333', 
    spawnRate: 0.007 // 稍微调整生成率
};

function createObstacle(x, y) {
    obstacles.push({
        x: x,
        y: y,
        width: obstacleSettings.width,
        height: obstacleSettings.height,
        color: obstacleSettings.color,
        draw: function() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        },
        update: function() {
            this.x -= gameSpeed;
        }
    });
}

// 鸟类怪物
let birds = [];
const birdSettings = {
    width: 45,
    height: 30,
    color: '#3498db', // 蓝色
    speedMultiplier: 1.1, // 鸟比地面滚动稍快一点
    spawnRate: 0.004,     // 鸟的生成概率
    minY: 50,             // 鸟的最低生成高度
    maxY: gameHeight / 2,   // 鸟的最高生成高度
    amplitudeY: 15,       // 上下摆动幅度
    frequencyY: 0.04      // 上下摆动频率
};

function createBird(x, y) {
    birds.push({
        x: x,
        y: y,
        initialY: y, // 用于计算摆动
        width: birdSettings.width,
        height: birdSettings.height,
        color: birdSettings.color,
        draw: function() {
            ctx.fillStyle = this.color;
            // 简单的鸟形状：身体 + 小翅膀示意
            ctx.fillRect(this.x, this.y, this.width, this.height); // 身体
            ctx.fillStyle = '#2980b9'; // 深一点的蓝色做翅膀
            ctx.fillRect(this.x - 5, this.y + this.height / 2 - 5, 10, 10); // 左翅膀
            ctx.fillRect(this.x + this.width - 5, this.y + this.height / 2 - 5, 10, 10); // 右翅膀

            // 眼睛
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.x + this.width - 12, this.y + 10, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(this.x + this.width - 12, this.y + 10, 2, 0, Math.PI * 2);
            ctx.fill();
        },
        update: function() {
            this.x -= gameSpeed * birdSettings.speedMultiplier;
            // 上下摆动
            this.y = this.initialY + Math.sin(this.x * birdSettings.frequencyY) * birdSettings.amplitudeY;
        }
    });
}


function initGame() {
    gameOver = false;
    gameStarted = false;
    score = 0;
    scoreDisplay.textContent = score;
    gameSpeed = 3.5; // 重置速度

    player.y = gameHeight - 50 - platformSettings.height;
    player.velocityY = 0;
    player.isJumping = false;
    player.jumpsLeft = 2;
    player.grounded = true;

    platforms = [];
    obstacles = [];
    birds = []; // 重置鸟

    createPlatform(0, gameHeight - platformSettings.height, gameWidth * 1.5);
    
    let lastPlatformX = gameWidth * 1.5;
    for (let i = 0; i < 5; i++) {
        const width = Math.random() * (platformSettings.maxWidth - platformSettings.minWidth) + platformSettings.minWidth;
        const x = lastPlatformX + platformSettings.gap + Math.random() * 80;
        const y = gameHeight - platformSettings.height - Math.random() * 120; 
        createPlatform(x, Math.max(y, 120), width); // 确保平台不要太高或太低
        lastPlatformX = x + width;
    }

    gameOverScreen.style.display = 'none';
    if (!gameStarted) {
        drawStartScreen();
    } else {
        gameLoop();
    }
}

function drawStartScreen() {
    ctx.clearRect(0, 0, gameWidth, gameHeight);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, gameWidth, gameHeight);
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("点击屏幕或按空格键开始游戏", gameWidth / 2, gameHeight / 2);
}


function managePlatforms() {
    platforms = platforms.filter(platform => platform.x + platform.width > 0);
    const lastPlatform = platforms[platforms.length - 1];
    if (lastPlatform.x + lastPlatform.width < gameWidth + platformSettings.gap * 1.5) {
        const width = Math.random() * (platformSettings.maxWidth - platformSettings.minWidth) + platformSettings.minWidth;
        const x = lastPlatform.x + lastPlatform.width + platformSettings.gap + Math.random() * 80;
        const y = gameHeight - platformSettings.height - Math.random() * 150;
        createPlatform(x, Math.max(y, 120), width);
    }
}

function manageObstacles() {
    obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);
    if (Math.random() < obstacleSettings.spawnRate && platforms.length > 1) {
        const targetPlatformIndex = Math.floor(Math.random() * (platforms.length -1)) + 1;
        const platform = platforms[targetPlatformIndex];
        // 确保平台在屏幕右侧即将出现的位置，并且不在太边缘
        if (platform.x > gameWidth * 0.6 && platform.x < gameWidth - platformSettings.minWidth && platform.width > obstacleSettings.width + 20) { 
             createObstacle(platform.x + 10 + Math.random() * (platform.width - obstacleSettings.width - 20), platform.y - obstacleSettings.height);
        }
    }
}

function manageBirds() {
    birds = birds.filter(bird => bird.x + bird.width > 0);
    if (gameStarted && Math.random() < birdSettings.spawnRate && score > 300) { // 鸟在一定分数后出现
        const yPosition = Math.random() * (birdSettings.maxY - birdSettings.minY) + birdSettings.minY;
        createBird(gameWidth, yPosition);
    }
}


function checkCollisions() {
    player.grounded = false; 

    for (let platform of platforms) {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height < platform.y + platform.height && 
            player.y + player.height + player.velocityY >= platform.y) { 
            
            if (player.velocityY >= 0) {
                 player.y = platform.y - player.height;
                 player.velocityY = 0;
                 player.isJumping = false;
                 player.grounded = true;
                 player.jumpsLeft = 2; 
                 break; 
            }
        }
    }

    for (let obstacle of obstacles) {
        if (player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y) {
            setGameOver();
            return;
        }
    }

    // 新增：玩家与鸟碰撞
    for (let bird of birds) {
        if (player.x < bird.x + bird.width &&
            player.x + player.width > bird.x &&
            player.y < bird.y + bird.height &&
            player.y + player.height > bird.y) {
            setGameOver();
            return;
        }
    }

    // 修改：掉落到屏幕下方，游戏结束 (更精确)
    if (player.y >= gameHeight) { // 如果玩家的顶部接触或超过画布底部
        setGameOver();
    }
}

function setGameOver() {
    gameOver = true;
    gameStarted = false;
    finalScoreDisplay.textContent = score;
    gameOverScreen.style.display = 'block';
}

function gameLoop() {
    if (gameOver) return;
    if (!gameStarted) return;

    ctx.clearRect(0, 0, gameWidth, gameHeight);

    platforms.forEach(platform => {
        platform.update();
        platform.draw();
    });
    managePlatforms();

    obstacles.forEach(obstacle => {
        obstacle.update();
        obstacle.draw();
    });
    manageObstacles();

    // 新增：鸟的更新和绘制
    birds.forEach(bird => {
        bird.update();
        bird.draw();
    });
    manageBirds();

    player.update();
    player.draw();

    checkCollisions();
    
    if (!gameOver) {
        score++;
        scoreDisplay.textContent = score;
    }
    
    if (score % 700 === 0 && score > 0 && gameSpeed < 7) { // 减缓速度增加的频率，设置上限
        gameSpeed += 0.05;
    }

    requestAnimationFrame(gameLoop);
}

function handleUserAction() {
    if (!gameStarted && !gameOver) {
        gameStarted = true;
        gameLoop();
    } else if (gameStarted && !gameOver) {
        player.jump();
    }
}

document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        e.preventDefault(); // 防止空格键滚动页面
        handleUserAction();
    }
});

canvas.addEventListener('mousedown', function() {
    handleUserAction();
});
canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    handleUserAction();
});

restartButton.addEventListener('click', function() {
    initGame();
});

initGame();