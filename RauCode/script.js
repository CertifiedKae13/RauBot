// --- Initial Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 50;
const PLAYER_SPEED = 5;

const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 30;

const PROJECTILE_WIDTH = 5;
const PROJECTILE_HEIGHT = 10;
const PROJECTILE_SPEED = 7;

// --- Input Handler ---
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

window.addEventListener('keydown', (e) => {
    if (e.code in keys) {
        keys[e.code] = true;
    }
    if (e.code === 'Space') {
        player.attemptShoot();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code in keys) {
        keys[e.code] = false;
    }
});


// --- Projectile Class ---
class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = PROJECTILE_WIDTH;
        this.height = PROJECTILE_HEIGHT;
        this.speed = PROJECTILE_SPEED;
        this.markedForDeletion = false;
    }

    update() {
        this.y -= this.speed;
    }

    draw(context) {
        context.fillStyle = '#ff00ff'; // Magenta laser
        context.fillRect(this.x, this.y, this.width, this.height);
    }
}

// --- Player Class ---
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        this.speed = PLAYER_SPEED;
        this.projectiles = [];
        this.shootCooldown = 0;
    }

    update() {
        // Movement
        if (keys.ArrowLeft) {
            this.x -= this.speed;
        }
        if (keys.ArrowRight) {
            this.x += this.speed;
        }

        // Keep player within the canvas bounds
        if (this.x < 0) {
            this.x = 0;
        }
        if (this.x + this.width > canvas.width) {
            this.x = canvas.width - this.width;
        }

        // Shooting cooldown is now handled in attemptShoot, but we still need to decrement it
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        // Update projectiles
        this.projectiles.forEach(p => p.update());
        // Filter out projectiles that are off-screen OR marked for deletion
        this.projectiles = this.projectiles.filter(p => p.y + p.height > 0 && !p.markedForDeletion);
    }

    draw(context) {
        context.fillStyle = '#00ff00'; // Bright green
        context.beginPath();
        context.moveTo(this.x + this.width / 2, this.y);
        context.lineTo(this.x, this.y + this.height);
        context.lineTo(this.x + this.width, this.y + this.height);
        context.closePath();
        context.fill();

        // Draw projectiles
        this.projectiles.forEach(p => p.draw(context));
    }

    shoot() {
        const projectileX = this.x + this.width / 2 - PROJECTILE_WIDTH / 2;
        const projectileY = this.y;
        this.projectiles.push(new Projectile(projectileX, projectileY));
    }

    attemptShoot() {
        if (this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = 15; // Cooldown in frames
        }
    }
}

// --- Enemy Class ---
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = ENEMY_WIDTH;
        this.height = ENEMY_HEIGHT;
        this.markedForDeletion = false;
    }

    draw(context) {
        context.fillStyle = '#ff4d4d'; // Bright red
        // A simple "crab" like shape
        const segment = this.width / 4;
        context.fillRect(this.x + segment, this.y, segment * 2, this.height); // Body
        context.fillRect(this.x, this.y + this.height / 2, this.width, this.height / 2); // "Legs" part
    }

    // This will be empty as the EnemyGrid now controls movement
    update() {}
}

// --- Enemy Grid Class ---
class EnemyGrid {
    constructor() {
        this.enemies = [];
        this.speed = 1; // Speed of the grid's horizontal movement
        this.direction = 1; // 1 for right, -1 for left

        const columns = 5;
        const rows = 3;
        const enemyPadding = 20;
        const startX = 50;
        const startY = 50;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < columns; c++) {
                const enemyX = startX + c * (ENEMY_WIDTH + enemyPadding);
                const enemyY = startY + r * (ENEMY_HEIGHT + enemyPadding);
                this.enemies.push(new Enemy(enemyX, enemyY));
            }
        }
    }

    update() {
        let hitEdge = false;
        // Check if any enemy in the grid will hit the edge in the next frame
        for (const enemy of this.enemies) {
            if ((enemy.x + enemy.width >= canvas.width && this.direction > 0) || (enemy.x <= 0 && this.direction < 0)) {
                hitEdge = true;
                break;
            }
        }

        if (hitEdge) {
            this.direction *= -1; // Reverse direction
            // Move all enemies down
            this.enemies.forEach(e => {
                e.y += ENEMY_HEIGHT / 2;
            });
        } else {
            // Move all enemies horizontally
            this.enemies.forEach(e => {
                e.x += this.speed * this.direction;
            });
        }
    }

    draw(context) {
        this.enemies.forEach(enemy => enemy.draw(context));
    }
}


// --- Game State and Initialization ---
let player;
let enemyGrid;

function init() {
    // Create the player in the bottom center of the canvas
    const playerX = (canvas.width - PLAYER_WIDTH) / 2;
    const playerY = canvas.height - PLAYER_HEIGHT - 10;
    player = new Player(playerX, playerY);

    // Create the grid of enemies
    enemyGrid = new EnemyGrid();
}

// --- Utility Functions ---
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// --- Main Game Loop ---
function update() {
    player.update();
    enemyGrid.update();

    // Collision detection
    enemyGrid.enemies.forEach(enemy => {
        player.projectiles.forEach(projectile => {
            if (checkCollision(projectile, enemy)) {
                projectile.markedForDeletion = true;
                enemy.markedForDeletion = true;
            }
        });
    });

    // Remove marked enemies from the grid
    enemyGrid.enemies = enemyGrid.enemies.filter(enemy => !enemy.markedForDeletion);
}

function draw() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the player (and its projectiles)
    player.draw(ctx);

    // Draw the enemies
    enemyGrid.draw(ctx);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// --- Start the Game ---
init();
gameLoop();
