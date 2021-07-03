const Game = Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function(){
        this.level = 1;
        this.score = 0;
        this.initScore = 0;
        this.started = false;

        Phaser.Scene.call(this, {
            key: "Game"
        });
    },
    preload: function(){
        this.load.setBaseURL("https://cdn.jsdelivr.net/gh/Quickcoder2005/dogGameAssets@main/assets");

        this.load.image("background", "images/background.png");
        this.load.image("enemy", "images/enemy.png");
        this.load.image("tiles", "tiles/tiles.png");

        this.load.spritesheet("player", "sprites/player.png", {
            frameWidth: 32,
            frameHeight: 32
        });
            
        this.load.tilemapTiledJSON("map1", "maps/level1.json");
        this.load.tilemapTiledJSON("map2", "maps/level2.json");
        this.load.tilemapTiledJSON("map3", "maps/level3.json");
        this.load.tilemapTiledJSON("map4", "maps/level4.json");

        this.load.audio("coin", "sounds/coin.mp3");
        this.load.audio("click", "sounds/click.mp3");
        this.load.audio("bark", "sounds/bark.mp3");
        this.load.audio("shout", "sounds/shout.mp3");
    },
    create: function(){
        this.cameras.main.setBackgroundColor("#f2f5f5");

        this.currentLevel();
        this.map = this.make.tilemap({
            key: this.mapKey
        });

        this.tileset = this.map.addTilesetImage("Level", "tiles");

        this.platforms = this.map.createLayer("Platforms", this.tileset, 0, 150);
        this.diamonds = this.map.createLayer("Diamonds", this.tileset, 0, 150);
        this.water = this.map.createLayer("Water", this.tileset, 0, 150);
        this.switch = this.map.createLayer("Switch", this.tileset, 0, 150);
        this.switchOn = this.map.createLayer("SwitchOn", this.tileset, 0, 150);
        this.key = this.map.createLayer("Key", this.tileset, 0, 150);
        this.way = this.map.createLayer("Way", this.tileset, 0, 150);
        this.door = this.map.createLayer("Door", this.tileset, 0, 150);
        this.decor = this.map.createLayer("Decor", this.tileset, 0, 150);

        this.platforms.setScale(2);
        this.diamonds.setScale(2);
        this.water.setScale(2);
        this.switch.setScale(2);
        this.switchOn.setScale(2);
        this.key.setScale(2);
        this.way.setScale(2)
        this.door.setScale(2);
        this.decor.setScale(2);

        this.platforms.setDepth(1);
        this.diamonds.setDepth(1);
        this.water.setDepth(1);
        this.switch.setDepth(1);
        this.switchOn.setDepth(1);
        this.key.setDepth(1);
        this.way.setDepth(1);
        this.door.setDepth(1);
        this.decor.setDepth(1);

        this.way.setVisible(false);
        this.switchOn.setVisible(false);

        this.platforms.setCollisionByExclusion([-1]);
        this.way.setCollisionByExclusion([-1]);
        this.diamonds.setCollisionByExclusion([-1]);

        this.background = this.add.image(0, 0, "background");
        this.background.displayWidth = 800;
        this.background.displayHeight = 900;
        this.background.setScrollFactor(0);

        this.physics.world.bounds.width = 2*this.map.widthInPixels;
        this.physics.world.bounds.height = 2*this.map.heightInPixels + 150;

        this.onDoor = false;

        this.player = this.physics.add.sprite(55, 250, "player");
        this.player.setDepth(2);

        this.player.left = () => {
            this.player.flipX = true;
            this.player.anims.play("walk", true);
            this.player.body.setVelocityX(-230);            
        }
        this.player.right = () => {
            this.player.flipX = false;
            this.player.anims.play("walk", true);
            this.player.body.setVelocityX(230);        
        }
        this.player.jump = () => {
            this.player.body.setVelocityY(-500);
        }
        this.player.stand = () => {
            this.player.anims.play("stand", true);
            this.player.body.setVelocityX(0);            
        }

        this.anims.create({
            key: "stand",
            frames: [
                {
                    key: "player",
                    frame: 2
                }
            ]
        });

        this.anims.create({
            key: "walk",
            frames: this.anims.generateFrameNames("player", {
                start: 2,
                end: 3
            }).reverse(),
            frameRate: 7,
            repeat: -1
        });

        this.enemies = this.physics.add.group();

        this.player.setCollideWorldBounds(true);
        
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.enemies, this.player, (player, enemy) => {
            this.enemyCollide(player, enemy);
        }, null, this);
        this.physics.world.setFPS(50);
        this.physics.world.timeScale = 1.2;

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, 2*this.map.widthInPixels, 2*this.map.heightInPixels);

        this.switched = false;
        this.keyed = false;

        this.levelText = this.add.text(20, 15, `Level: ${this.level}`, {
            fontSize: "35px",
            fill: "#000"
        });
        this.levelText.setScrollFactor(0);

        this.scoreText = this.add.text(210, 15, `Score: ${this.score}`, {
            fontSize: "35px",
            fill: "#000"
        });
        this.scoreText.setScrollFactor(0);

        this.leftButton = this.add.dom(0, 510, "button", `
            width: 120px;
            height: 90px;
            color: #000;
            font-weight: bold;
            background: #fafafa;
            outline: none;
            user-select: none;
        `, "LEFT");
        this.leftButton.setDepth(2);
        this.leftButton.setOrigin(0, 0);
        this.leftButton.setScrollFactor(0);
        this.leftButton.pressed = false;

        this.rightButton = this.add.dom(120, 510, "button", `
            width: 120px;
            height: 90px;
            color: #000;
            font-weight: bold;
            background: #fafafa;
            outline: none;
            user-select: none;
        `, "RIGHT");
        this.rightButton.setDepth(2);
        this.rightButton.setOrigin(0, 0);
        this.rightButton.setScrollFactor(0);
        this.rightButton.pressed = false;

        this.jumpButton = this.add.dom(260, 510, "button", `
            width: 120px;
            height: 90px;
            color: #000;
            font-weight: bold;
            background: #fafafa;
            outline: none;
            user-select: none;
        `, "JUMP");
        this.jumpButton.setDepth(2);
        this.jumpButton.setOrigin(0, 0);
        this.jumpButton.setScrollFactor(0);
        this.jumpButton.pressed = false;
        this.jumping = false;

        this.coin = this.sound.add("coin");
        this.click = this.sound.add("click");
        this.bark = this.sound.add("bark");
        this.shout = this.sound.add("shout");
        this.loader = document.querySelector(".loader");

        this.desktop = this.sys.game.device.os.desktop;

        this.cursors = this.input.keyboard.createCursorKeys();

        if (this.loader !== null){
            this.loader.remove();
        }
        this.initLevel();
    },
    generateEnemies: function(){
        for (let i = 0; i < this.enemyXY.length; ++i){
            let enemy = this.enemies.create(this.enemyXY[i].x, this.enemyXY[i].y, "enemy");
            enemy.setScale(1.5);
            enemy.setDepth(2);
            enemy.setVelocityX(200);

            enemy.start = this.enemyXY[i].start;
            enemy.stop = this.enemyXY[i].stop;

            enemy.move = () => {
                if (enemy.x <= enemy.start){
                    enemy.setVelocityX(200);
                }
                else if (enemy.x >= enemy.stop){
                    enemy.setVelocityX(-200);
                }
            }
        }
    },
    enemyCollide: function(player, enemy){
        if (enemy.body.touching.up){
            this.shout.play();
            this.score += 2;
            this.scoreText.setText(`Score: ${this.score}`);         
            enemy.destroy();
        }
        else{
            this.bark.play();
            this.restartLevel();
        }
    },
    initLevel: function(){
        switch(this.level){
            case 1:
                this.enemyXY = [
                    {
                        x: 400,
                        y: 350,
                        start: 400,
                        stop: 600
                    },
                    {
                        x: 700,
                        y: 350,
                        start: 600,
                        stop: 800
                    },
                    {
                        x: 1060,
                        y: 350,
                        start: 1060,
                        stop: 1500
                    }
                ];
                if (!this.started){
                    this.startGame();
                }
                break;
            case 2:
                this.enemyXY = [
                    {
                        x: 1060,
                        y: 350,
                        start: 1060,
                        stop: 1240
                    },
                    {
                        x: 550,
                        y: 350,
                        start: 550,
                        stop: 780
                    },
                    {
                        x: 270,
                        y: 350,
                        start: 270,
                        stop: 550
                    }
                ];

                this.player.flipX = true;
                this.player.setX(1700);
                this.player.setY(250);             
                break;
            case 3:
                this.enemyXY = [
                    {
                        x: 1200,
                        y: 350,
                        start: 1200,
                        stop: 1600
                    },
                    {
                        x: 650,
                        y: 350,
                        start: 650,
                        stop: 850
                    },
                    {
                        x: 270,
                        y: 200,
                        start: 270,
                        stop: 380
                    },
                    {
                        x: 100,
                        y: 350,
                        start: 100,
                        stop: 320
                    }
                ];

                this.player.flipX = true;
                this.player.setX(950);
                this.player.setY(250);               
                break;
            case 4:
                this.enemyXY = [];

                this.levelText.setText("Level: 🏆");
                this.player.flipX = false;
                this.player.setX(950);
                this.player.setY(250);

                this.completeGame();
                break;
        }
        this.generateEnemies();
    },
    currentLevel: function(){
        switch (this.level){
            case 1:
                this.mapKey = "map1";
                break;
            case 2:
                this.mapKey = "map2";
                break;
            case 3:
                this.mapKey = "map3";
                break;
            case 4:
                this.mapKey = "map4";
                break;
        }
    },
    nextLevel: function(){
        this.leftButton.pressed = false;
        this.rightButton.pressed = false;
        this.jumpButton.pressed = false;
        this.jumping = false;
    
        this.scene.restart({
            level: ++this.level,
            initScore: this.initScore = this.score
        });
    },
    restartLevel: function(){
        this.leftButton.pressed = false;
        this.rightButton.pressed = false;
        this.jumpButton.pressed = false;
        this.jumping = false;
        
        this.scene.restart({
            score: this.score = this.initScore
        });

        toastify({
            text: "You lost, try again!",
            toastBoxColor: "#fafafa",    
            toastBoxTextColor: "#000",    
            toastBoxShadow: "none",    
            toastBoxTextAlign: "center",    
            toastWidth: "90vw",    
            animationOut: "scale-up",    
            position: "top left",    
            toastCloseTimer: "2500"
        });
    },
    startGame: function(){
        this.player.setVisible(false);
        this.enemies.setVisible(false);
        this.scene.pause();

        alertify({
            title: "Rescue Doggo! By Satish",
            text: "Plot:\n\nDoggo is a dog belonging to very rare breed. He has been kidnapped by some humans for running experiments on him. Help him get out of danger!\n\nInstructions:\n\n1) Find a switch/lever that spawns a platform to get a key.\n2) Collect the key and go through the door to get to the next level.\n3) Collect coins and destroy enemies on the way by jumping on them to gain points. \n \n Satish_shekhar & Team ❤",
            confirmButtonText: "Play!",
            onConfirmed: () => {
                this.player.setVisible(true);
                this.enemies.setVisible(true);
                this.scene.resume();
                this.started = true;

                toastify({
                    text: "Look for the door and a lever!",
                    toastBoxColor: "#fafafa",    
                    toastBoxTextColor: "#000",    
                    toastBoxShadow: "none",    
                    toastBoxTextAlign: "center",    
                    toastWidth: "90vw",    
                    animationOut: "scale-up",    
                    position: "top left",    
                    toastCloseTimer: "2500"
                });
            }
        });
    },
    completeGame: function(){
        this.player.setVisible(false);
        this.enemies.setVisible(false);
        this.scene.pause();

        alertify({
            title: "Doggo Rescued! \n\n   Don't forget to buy me a Coffee🙂.",
            text: `Congratulations! You have successfully rescued Doggo with ${this.score} points! \n\n In just a couple of taps, you can make payment and leave a message.\n you don't have to create an account`,
           
            confirmButtonText: "Thank you! ❣",
            onConfirmed: () => {
                this.player.setVisible(true);
                this.enemies.setVisible(true);
                this.scene.resume();

                toastify({
           
                    text: "Do whatever you like! ",
                    toastBoxColor: "#fafafa",    
                    toastBoxTextColor: "#000",    
                    toastBoxShadow: "none",    
                    toastBoxTextAlign: "center",    
                    toastWidth: "90vw",    
                    animationOut: "scale-up",    
                    position: "top left",    
                    toastCloseTimer: "2500"
                });
            }
        });
    },
    update: function(){
        Phaser.Actions.Call(this.enemies.getChildren(), (enemy) => {
            enemy.move();
        });

        let diamondTile = this.diamonds.getTileAtWorldXY(this.player.x, this.player.y);

        if (diamondTile !== null){
            this.coin.play();
            this.diamonds.removeTileAt(diamondTile.x, diamondTile.y);
            ++this.score;
            this.scoreText.setText(`Score: ${this.score}`);
        }
        let waterTile = this.water.getTileAtWorldXY(this.player.x, this.player.y);

        if (waterTile !== null){
            this.bark.play();
            this.restartLevel();
        }
        let switchTile = this.switch.getTileAtWorldXY(this.player.x, this.player.y);

        if (switchTile !== null && !this.switched){
            this.click.play();
            this.switched = true;
            this.switchOn.setVisible(true);
            this.switch.setVisible(false);
            this.way.setVisible(true);
            this.physics.add.collider(this.player, this.way);

            toastify({
                text: "Now get the key!",
                toastBoxColor: "#fafafa",    
                toastBoxTextColor: "#000",    
                toastBoxShadow: "none",    
                toastBoxTextAlign: "center",    
                toastWidth: "90vw",    
                animationOut: "scale-up",    
                position: "top left",    
                toastCloseTimer: "2500"
            });
        }
        let keyTile = this.key.getTileAtWorldXY(this.player.x, this.player.y);

        if (keyTile !== null){
            this.coin.play();
            this.keyed = true;
            this.key.removeTileAt(keyTile.x, keyTile.y);
            
            toastify({
                text: "Go through the door!",
                toastBoxColor: "#fafafa",    
                toastBoxTextColor: "#000",    
                toastBoxShadow: "none",    
                toastBoxTextAlign: "center",    
                toastWidth: "90vw",    
                animationOut: "scale-up",    
                position: "top left",    
                toastCloseTimer: "2500"
            });
        }
        let doorTile = this.door.getTileAtWorldXY(this.player.x, this.player.y);

        if (doorTile !== null && this.keyed){
            this.nextLevel();
        }
        else if (doorTile !== null && !this.keyed){
            if (!this.onDoor){
                toastify({
                    text: "Find the key first!",
                    toastBoxColor: "#fafafa",    
                    toastBoxTextColor: "#000",    
                    toastBoxShadow: "none",    
                    toastBoxTextAlign: "center",    
                    toastWidth: "90vw",    
                    animationOut: "scale-up",    
                    position: "top left",    
                    toastCloseTimer: "2500"
                });
                this.onDoor = true;
            }
        }
        else if (doorTile === null && !this.keyed){
            this.onDoor = false;
        }

        if (this.desktop){
            let pointer = this.input.activePointer;

            if (this.cursors.left.isDown){
                this.player.left();
            }
            else if (this.cursors.right.isDown){
                this.player.right();
            }
            else{
                if (pointer.isDown){
                    if (pointer.x > this.leftButton.x && pointer.x < this.leftButton.x + this.leftButton.width && pointer.y > this.leftButton.y && pointer.y < this.leftButton.y + this.leftButton.height){
                        this.player.left();
                    }
                    else if (pointer.x > this.rightButton.x && pointer.x < this.rightButton.x + this.rightButton.width && pointer.y > this.rightButton.y && pointer.y < this.rightButton.y + this.rightButton.height){
                        this.player.right();
                    }
                    else if ((pointer.x > this.jumpButton.x && pointer.x < this.jumpButton.x + this.jumpButton.width && pointer.y > this.jumpButton.y && pointer.y < this.jumpButton.y + this.jumpButton.height) && this.player.body.onFloor()){
                        this.player.jump();
                    }
                }
                else{
                    this.player.stand();
                }
            }

            if (this.cursors.up.isDown && this.player.body.onFloor()){
                this.player.jump();
            }
        }
        else{
            this.leftButton.setInteractive().on("pointerdown", () => {
                this.leftButton.pressed = true;
            });
            this.leftButton.setInteractive().on("pointerup", () => {
                this.leftButton.pressed = false;
            });
            this.leftButton.setInteractive().on("pointerout", () => {
                this.leftButton.pressed = false;
            });

            this.rightButton.setInteractive().on("pointerdown", () => {
                this.rightButton.pressed = true;
            });
            this.rightButton.setInteractive().on("pointerup", () => {
                this.rightButton.pressed = false;
            });
            this.rightButton.setInteractive().on("pointerout", () => {
                this.rightButton.pressed = false;
            });

            this.jumpButton.setInteractive().on("pointerdown", () => {
                this.jumpButton.pressed = true;
            });
            this.jumpButton.setInteractive().on("pointerup", () => {
                this.jumpButton.pressed = false;
                this.jumping = false;
            });
            this.jumpButton.setInteractive().on("pointerout", () => {
                this.jumpButton.pressed = false;
                this.jumping = false;
            });

            if (this.leftButton.pressed){
                this.player.left();
            }
            else if (this.rightButton.pressed){
                this.player.right();
            }
            else{
                this.player.stand();
            }

            if (this.jumpButton.pressed && this.player.body.onFloor()){
            if (!this.jumping){       
                    this.player.jump();
                    this.jumping = true;
                }
            }
        }
    }
});

new Phaser.Game({
    type: Phaser.CANVAS,
    width: 400,
    height: 600,
    parent: "game",
    dom: {
        createContainer: true
    },
    input :{
        activePointers: 10
    },
    scene: [Game],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: "arcade",
        arcade: {
            gravity: {
                y: 1100
            },
            debug: false
        }
    },
    pixelArt: true,
    antiAlias: false,
    roundPixels: false,
    banner: false
});
