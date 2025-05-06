class ArrayBoom extends Phaser.Scene {
    constructor() {
        super("arrayBoom");

        // Initialize a class variable "my" which is an object.
        // The object has two properties, both of which are objects
        //  - "sprite" holds bindings (pointers) to created sprites
        //  - "text"   holds bindings to created bitmap text objects
        this.my = {sprite: {}, text: {}};

        // Create a property inside "sprite" named "bullet".
        // The bullet property has a value which is an array.
        // This array will hold bindings (pointers) to bullet sprites
        this.my.sprite.bullet = [];   
        this.maxBullets = 10;
        // Don't create more than this many bullets
        this.my.sprite.activeEnemies = [];
        this.my.sprite.enemyList = [];
        this.maxEnemies = 5;
        this.enemiesDefeated = 0;
        //this.nextIsHippo = false;
        this.myScore = 0;       // record a score as a class variable
        // More typically want to use a global variable for score, since
        // it will be used across multiple scenes
        this.enemyBulletCooldown = 300;        // Number of update() calls to wait before making a new bullet
        this.enemyBulletCooldownCounter = 0;
        this.enemyBullet = null;
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.image("owl", "owl.png");
        this.load.image("heart", "heart.png");
        this.load.image("hippo", "hippo.png");
        this.load.image("narwhal", "narwhal.png");
        this.load.image("rabbit", "rabbit.png");
        this.load.image("frog", "frog.png");
        this.load.image("sloth", "sloth.png");

        // For animation
        this.load.image("whitePuff00", "whitePuff00.png");
        this.load.image("whitePuff01", "whitePuff01.png");
        this.load.image("whitePuff02", "whitePuff02.png");
        this.load.image("whitePuff03", "whitePuff03.png");

        // Load the Kenny Rocket Square bitmap font
        // This was converted from TrueType format into Phaser bitmap
        // format using the BMFont tool.
        // BMFont: https://www.angelcode.com/products/bmfont/
        // Tutorial: https://dev.to/omar4ur/how-to-create-bitmap-fonts-for-phaser-js-with-bmfont-2ndc
        this.load.bitmapFont("rocketSquare", "KennyRocketSquare_0.png", "KennyRocketSquare.fnt");

        // Sound asset from the Kenny Music Jingles pack
        // https://kenney.nl/assets/music-jingles
        this.load.audio("dadada", "jingles_NES13.ogg");
    }

    create() {
        let my = this.my;

        my.sprite.owl = this.add.sprite(game.config.width/4, game.config.height - 40, "owl");
        my.sprite.owl.setScale(0.5);

        my.sprite.narwhal = this.add.sprite(-200, -80, "narwhal");
        my.sprite.narwhal.setScale(0.45);
        my.sprite.narwhal.scorePoints = 30;
        my.sprite.enemyList.push(my.sprite.narwhal);
        my.sprite.narwhal.visible = false;

        my.sprite.hippo = this.add.sprite(-200, -180, "hippo");
        my.sprite.hippo.setScale(0.25);
        my.sprite.hippo.scorePoints = 25;
        my.sprite.hippo.visible = false;
        my.sprite.enemyList.push(my.sprite.hippo);

        my.sprite.rabbit = this.add.sprite(-200, -280, "rabbit");
        my.sprite.rabbit.setScale(0.5);
        my.sprite.rabbit.scorePoints = 40;
        my.sprite.enemyList.push(my.sprite.rabbit);
        my.sprite.rabbit.visible = false;

        my.sprite.sloth = this.add.sprite(-200, -380, "sloth");
        my.sprite.sloth.setScale(0.5);
        my.sprite.sloth.scorePoints = 35;
        my.sprite.enemyList.push(my.sprite.sloth);
        my.sprite.sloth.visible = false;

        my.sprite.frog = this.add.sprite(-200, -480, "frog");
        my.sprite.frog.setScale(0.5);
        my.sprite.frog.scorePoints = 30;
        my.sprite.enemyList.push(my.sprite.frog);
        my.sprite.frog.visible = false;
        // Notice that in this approach, we don't create any bullet sprites in create(),
        // and instead wait until we need them, based on the number of space bar presses

        // Create white puff animation
        this.anims.create({
            key: "puff",
            frames: [
                { key: "whitePuff00" },
                { key: "whitePuff01" },
                { key: "whitePuff02" },
                { key: "whitePuff03" },
            ],
            frameRate: 20,    // Note: case sensitive (thank you Ivy!)
            repeat: 5,
            hideOnComplete: true
        });
        // Create key objects
        this.left = this.input.keyboard.addKey("A");
        this.right = this.input.keyboard.addKey("D");
        this.down = this.input.keyboard.addKey("S");
        this.up = this.input.keyboard.addKey("W");
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Set movement speeds (in pixels/tick)
        this.playerSpeed = 5;
        this.bulletSpeed = 5;
        this.playerHP = 3;
        // update HTML description
        document.getElementById('description').innerHTML = '<h2>Array Boom.js</h2><br>A: left // D: right // Space: fire/emit // S: down // W: up'

        // Put score on screen
        my.text.score = this.add.bitmapText(500, 0, "rocketSquare", "Score " + this.myScore);
        my.text.health = this.add.bitmapText(300, 0, "rocketSquare", "HP:  " + this.playerHP);
        my.text.gameOver = this.add.bitmapText(300, 400, "rocketSquare", "Game over!");
        my.text.restartButton = this.add.text(300, 200, "Restart Game?");
        my.text.restartButton.setInteractive({useHandCursor: true});
        my.text.restartButton.on('pointerdown', () =>this.startGame());
        my.text.restartButton.visible = false;
        my.text.gameOver.visible = false;

        // Put title on screen
        this.add.text(10, 5, "Arcade Shooter: Cute-em-up", {
            fontFamily: 'Times, serif',
            fontSize: 24,
            wordWrap: {
                width: 60
            }
        });
        this.points = [
            720, 200,
            720, 400,
        ];
        this.curve = new Phaser.Curves.Spline(this.points);
        // Initialize Phaser graphics, used to draw lines
        this.graphics = this.add.graphics();
        my.sprite.narwhal = this.add.follower(this.curve, 720, 80, "narwhal").setScale(.45);
        my.sprite.narwhal.scorePoints = 30;
        my.sprite.activeEnemies.push(my.sprite.narwhal);

        my.sprite.hippo = this.add.follower(this.curve, 720, 180, "hippo").setScale(.25);
        my.sprite.hippo.scorePoints = 25;
        my.sprite.activeEnemies.push(my.sprite.hippo);

        my.sprite.rabbit = this.add.follower(this.curve, 720, 280, "rabbit").setScale(.5);
        my.sprite.rabbit.scorePoints = 40;
        my.sprite.activeEnemies.push(my.sprite.rabbit);

        my.sprite.frog = this.add.follower(this.curve, 720, 380, "frog").setScale(.5);
        my.sprite.frog.scorePoints = 35;
        my.sprite.activeEnemies.push(my.sprite.frog);

        my.sprite.sloth = this.add.follower(this.curve, 720, 480, "sloth").setScale(.5);
        my.sprite.sloth.scorePoints = 30;
        my.sprite.activeEnemies.push(my.sprite.sloth);

            this.startWave();
    }

    update() {
        let my = this.my;
        this.enemyBulletCooldownCounter--;
        if(this.enemyBulletCooldownCounter <= 0) {
            this.enemyBullet = this.add.sprite(my.sprite.rabbit.x+(my.sprite.rabbit.displayWidth/2),my.sprite.rabbit.y, "heart");
            this.enemyBulletCooldownCounter = this.enemyBulletCooldown;
        }
        
        if((this.enemyBullet != null) && this.collides(this.enemyBullet, my.sprite.owl)) {
            this.playerHP--;
            this.enemyBullet.y = -100;
            this.updateHP();
            if(this.playerHP <= 0) {
                my.sprite.owl.visible = false;
                my.text.gameOver.visible = true;
                my.text.restartButton.visible = true;
            }
        }
            
        
        //this.startWave();
        // Moving left
        if (this.left.isDown) {
            // Check to make sure the sprite can actually move left
            if (my.sprite.owl.x > ((my.sprite.owl.displayWidth/2))) {
                my.sprite.owl.x -= this.playerSpeed;
            }
        }

        // Moving right
        if (this.right.isDown) {
            // Check to make sure the sprite can actually move right
            if (my.sprite.owl.x < ((game.config.width - (my.sprite.owl.displayWidth/2)) - 500)) {
                my.sprite.owl.x += this.playerSpeed;
            }
        }
        // Moving up
        if (this.up.isDown) {
            // Check to make sure the sprite can actually move left
            if (my.sprite.owl.y > (my.sprite.owl.displayHeight/2)) {
                my.sprite.owl.y -= this.playerSpeed;
            }
        }

        // Moving down
        if (this.down.isDown) {
            // Check to make sure the sprite can actually move right
            if (my.sprite.owl.y < (game.config.height - (my.sprite.owl.displayHeight/2))) {
                my.sprite.owl.y += this.playerSpeed;
            }
        }
        // Check for bullet being fired
        if (Phaser.Input.Keyboard.JustDown(this.space)) {
            // Are we under our bullet quota?
            if (my.sprite.bullet.length < this.maxBullets) {
                my.sprite.bullet.push(this.add.sprite(
                    my.sprite.owl.x+(my.sprite.owl.displayWidth/2),my.sprite.owl.y, "heart")
                );
            }
        }

        // Remove all of the bullets which are offscreen
        // filter() goes through all of the elements of the array, and
        // only returns those which **pass** the provided test (conditional)
        // In this case, the condition is, is the y value of the bullet
        // greater than zero minus half the display height of the bullet? 
        // (i.e., is the bullet fully offscreen to the top?)
        // We store the array returned from filter() back into the bullet
        // array, overwriting it. 
        // This does have the impact of re-creating the bullet array on every 
        // update() call. 
        my.sprite.bullet = my.sprite.bullet.filter((bullet) => bullet.x < 840);
        //my.sprite.activeEnemies = my.sprite.activeEnemies.filter((activeEnemies) => activeEnemies.y > 0 )

        // Check for collision with the hippo
        for (let bullet of my.sprite.bullet) {
            for(let enemy of my.sprite.activeEnemies) {
                if (bullet.y < 800 && bullet.y > 0 && this.collides(enemy, bullet)) {
                    // start animation
                    this.puff = this.add.sprite(enemy.x, enemy.y, "whitePuff03").setScale(0.25).play("puff");
                    // clear out bullet -- put y offscreen, will get reaped next update
                    bullet.y = -100;
                    enemy.visible = false;
                    enemy.active = false;
                    enemy.stopFollow();
                    enemy.y = -100;

                    // Update score
                    this.myScore += enemy.scorePoints;
                    this.updateScore();
                    // Play sound
                    this.sound.play("dadada", {
                        volume: 0.25   // Can adjust volume using this, goes from 0 to 1
                    });
                    // Have new hippo appear after end of animation
                    this.puff.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                        this.enemiesDefeated++;
                        if(this.enemiesDefeated >= this.maxEnemies) {
                            this.endWave();
                            this.startWave();
                        }
                    }, this);

                }
            }
        }
        // Make all of the bullets move
        for (let bullet of my.sprite.bullet) {
            bullet.x += this.bulletSpeed;
        }
        this.enemyBullet.x -= this.bulletSpeed;


    }

    // A center-radius AABB collision check
    collides(a, b) {
        if (Math.abs(a.x - b.x) > (a.displayWidth/2 + b.displayWidth/2)) return false;
        if (Math.abs(a.y - b.y) > (a.displayHeight/2 + b.displayHeight/2)) return false;
        return true;
    }

    startGame() {
        this.my.sprite.owl.visible = true;
        this.playerHP = 3;
        this.myScore = 0;
        this.updateHP();
        this.updateScore();
        this.my.text.gameOver.visible = false;
        this.my.text.restartButton.visible = false;
        this.startWave();
    }
    startWave() {
        let i = 80;
        for(let enemy of this.my.sprite.activeEnemies) {
            enemy.active = true;
            enemy.y = i;    
            enemy.startFollow( {
                    from: 0,
                    to: 1,
                    delay: 0,
                    duration: 4000,
                    repeat: -1,
                    yoyo: true,
                    rotateToPath: false,
                    rotationOffset: -90
                });
            
            i+= 100;
            enemy.visible = true;
        }


    }
    endWave() {
        this.myScore += 100;
        this.updateScore();
        //this.activeEnemies = [];
        this.enemiesDefeated = 0;
    }
    updateScore() {
        let my = this.my;
        my.text.score.setText("Score " + this.myScore);
    }
    updateHP() {
        let my = this.my;
        my.text.health.setText("HP:  " + this.playerHP);
    }
}
         