export class Game extends Phaser.Scene {
    constructor() {
        super('Game');

        this.bricks;
        this.paddle;
        this.ball;
        this.ballTrail;
        this.brickEmitters;
        this.cursors;
        this.lives = 3; // Add lives counter
        this.livesText; // Add text display for lives
    }

    init() {
        // Reset lives when the scene starts (including on restart)
        this.lives = 3;
    }

    create() {
        //  Enable world bounds, but disable the floor
        this.physics.world.setBoundsCollision(true, true, true, false);

        // Create brick explosion particles for each color
        const colorConfig = {
            'blue1': 0x4444ff,
            'red1': 0xff4444,
            'green1': 0x44ff44,
            'yellow1': 0xffff44,
            'silver1': 0xcccccc,
            'purple1': 0xff44ff
        };

        this.brickEmitters = {};
        Object.entries(colorConfig).forEach(([color, tint]) => {
            this.brickEmitters[color] = this.add.particles(0, 0, 'assets', {
                frame: 'ball1',
                lifespan: 800,
                speed: { min: 150, max: 250 },
                scale: { start: 0.4, end: 0 },
                alpha: { start: 1, end: 0 },
                blendMode: 'ADD',
                gravityY: 300,
                tint,
                emitting: false
            });
        });

        //  Create the bricks in a 10x6 grid
        this.bricks = this.physics.add.staticGroup({
            key: 'assets',
            frame: ['blue1', 'red1', 'green1', 'yellow1', 'silver1', 'purple1'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 6, cellWidth: 64, cellHeight: 32, x: 192, y: 100 }
        });

        this.ball = this.physics.add.image(512, 600, 'assets', 'ball1')
        this.ball.setCollideWorldBounds(true)
        this.ball.setBounce(1);
        this.ball.setData('onPaddle', true);

        // Create particles for ball trail
        this.ballTrail = this.add.particles(0, 0, 'assets', {
            frame: 'ball1',
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.3, end: 0 },
            speed: 20,
            lifespan: 1000,
            blendMode: 'ADD',
            follow: this.ball
        });

        this.paddle = this.physics.add.image(512, 700, 'assets', 'paddle1').setImmovable();

        // Add lives text display
        this.livesText = this.add.text(16, 16, 'Lives: ' + this.lives, {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'Arial Black',
            stroke: '#000',
            strokeThickness: 4
        });

        //  Our colliders
        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);

        //  Initialize keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    hitBrick(ball, brick) {
        const brickColor = brick.frame.name;

        // Create explosion effect at brick position
        this.brickEmitters[brickColor].emitParticleAt(brick.x, brick.y, 12);
        this.brickEmitters[brickColor].setDepth(100);

        this.tweenAlpha(brick, () => {
            brick.disableBody(true, true);
        });

        if (this.bricks.countActive() === 0) {
            // Award extra life when all bricks are destroyed
            this.lives++;
            this.updateLivesText();
            this.resetLevel();
        }
    }

    resetBall() {
        this.ball.setVelocity(0);
        this.ball.setPosition(this.paddle.x, 600);
        this.ball.setData('onPaddle', true);
    }

    resetLevel() {
        this.resetBall();

        this.bricks.children.each(brick => {
            brick.enableBody(false, 0, 0, true, true);
        });
    }

    hitPaddle(ball, paddle) {
        let diff = 0;

        if (ball.x < paddle.x) {
            //  Ball is on the left-hand side of the paddle
            diff = paddle.x - ball.x;
            ball.setVelocityX(-10 * diff);
        }
        else if (ball.x > paddle.x) {
            //  Ball is on the right-hand side of the paddle
            diff = ball.x - paddle.x;
            ball.setVelocityX(10 * diff);
        }
        else {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            ball.setVelocityX(2 + Math.random() * 8);
        }
    }

    tweenAlpha(target, callback) {
        this.tweens.add({
            targets: target,
            alpha: 0,
            duration: 150,
            ease: 'Sine.inOut',
            onComplete: callback
        });
    }

    updateLivesText() {
        this.livesText.setText('Lives: ' + this.lives);
    }

    loseLife() {
        this.lives--;
        this.updateLivesText();
        
        if (this.lives <= 0) {
            // Game over when no lives remain
            this.scene.start('GameOver');
        } else {
            // Reset ball if player still has lives
            this.resetBall();
        }
    }

    update() {
        // Handle paddle movement with arrow keys
        if (this.cursors.left.isDown) {
            this.paddle.x -= 10;
            this.paddle.x = Phaser.Math.Clamp(this.paddle.x, 52, 972);
            
            if (this.ball.getData('onPaddle')) {
                this.ball.x = this.paddle.x;
            }
        }
        else if (this.cursors.right.isDown) {
            this.paddle.x += 10;
            this.paddle.x = Phaser.Math.Clamp(this.paddle.x, 52, 972);
            
            if (this.ball.getData('onPaddle')) {
                this.ball.x = this.paddle.x;
            }
        }

        // Launch ball with spacebar
        if (this.cursors.space.isDown && this.ball.getData('onPaddle')) {
            this.ball.setVelocity(-75, -300);
            this.ball.setData('onPaddle', false);
        }

        if (this.ball.y > 768) {
            this.loseLife();
        }
    }
}