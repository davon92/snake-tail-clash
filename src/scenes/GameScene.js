import Phaser from 'phaser';
import AISnake from '../ai/AISnake.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.image('dot', 'https://labs.phaser.io/assets/sprites/dot.png');
    this.load.image('apple', 'https://labs.phaser.io/assets/sprites/apple.png');
  }

  create() {
    this.tileSize = 16;
    this.moveDelay = 150;
    this.moveTimer = 0;
    this.snakeDir = 'RIGHT';

    this.zoneWidth = this.scale.width;
    this.zoneHeight = this.scale.height;

    this.setupWorld();
    this.createSnake();
    this.apples = new Map(); // key: "zoneX,zoneY" → value: array of apple sprites
    this.spawnAppleInZone(this.currentZoneX, this.currentZoneY);
    this.setupControls();

   this.aiSnakes = [];

    for (let i = 0; i < 99; i++) {
      // Randomize spawn within -2 to 2 zones
      const zoneX = Phaser.Math.Between(-6, 6);
      const zoneY = Phaser.Math.Between(-6, 6);

      const x = Phaser.Math.Snap.To(
        Phaser.Math.Between(zoneX * this.zoneWidth, (zoneX + 1) * this.zoneWidth - 1),
        this.tileSize
      );

      const y = Phaser.Math.Snap.To(
        Phaser.Math.Between(zoneY * this.zoneHeight, (zoneY + 1) * this.zoneHeight - 1),
        this.tileSize
      );

      const ai = new AISnake(this, x, y, `AI${i}`);
      this.aiSnakes.push(ai);

      const key = `${zoneX},${zoneY}`;
      this.spawnAppleInZone(zoneX, zoneY);
    }


    const { x: zx, y: zy } = this.getZoneFromPosition(this.snake[0].x, this.snake[0].y);
    this.currentZoneX = zx;
    this.currentZoneY = zy;
    this.snapCameraToZone(zx, zy);

    this.zoneLabel = this.add.text(0, 0, '', {
      fontSize: '32px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(999).setVisible(false);

    this.snakeCounterText = this.add.text(10, 10, '', {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'monospace',
    }).setScrollFactor(0);

    this.playerDead = false;
  }

  setupWorld() {
    const worldSize = 5000; // just a large enough area
    const half = worldSize / 2;
    this.cameras.main.setBounds(-half, -half, worldSize, worldSize);
    this.physics.world.setBounds(-half, -half, worldSize, worldSize);
  }

  createSnake() {
    this.snake = [this.physics.add.image(240, 400, 'dot')];
  }

  spawnAppleInZone(zoneX, zoneY) {
    const key = `${zoneX},${zoneY}`;

    if (!this.apples.has(key)) {
      this.apples.set(key, []);
    }

    const appleGroup = this.apples.get(key);

    // ✅ Do not spawn more than 4 apples in this zone
    if (appleGroup.length >= 4) return;

    const minX = zoneX * this.zoneWidth;
    const minY = zoneY * this.zoneHeight;
    const maxX = (zoneX + 1) * this.zoneWidth;
    const maxY = (zoneY + 1) * this.zoneHeight;

    const x = Phaser.Math.Snap.To(Phaser.Math.Between(minX, maxX - 1), this.tileSize);
    const y = Phaser.Math.Snap.To(Phaser.Math.Between(minY, maxY - 1), this.tileSize);

    const apple = this.add.image(x, y, 'apple').setScale(0.5);
    appleGroup.push(apple);
  }

  repositionAppleInZone(zoneX, zoneY) {
    const minX = zoneX * this.zoneWidth;
    const minY = zoneY * this.zoneHeight;
    const maxX = (zoneX + 1) * this.zoneWidth;
    const maxY = (zoneY + 1) * this.zoneHeight;

    const x = Phaser.Math.Snap.To(Phaser.Math.Between(minX, maxX - 1), this.tileSize);
    const y = Phaser.Math.Snap.To(Phaser.Math.Between(minY, maxY - 1), this.tileSize);
    this.apple.setPosition(x, y);
  }

  getZoneFromPosition(x, y) {
    return {
      x: Math.floor(x / this.zoneWidth),
      y: Math.floor(y / this.zoneHeight)
    };
  }

  snapCameraToZone(zoneX, zoneY) {
    const cam = this.cameras.main;
    const centerX = zoneX * this.zoneWidth + this.zoneWidth / 2;
    const centerY = zoneY * this.zoneHeight + this.zoneHeight / 2;
    cam.setScroll(centerX - cam.width / 2, centerY - cam.height / 2);
  }

  setupControls() {
  this.input.on('pointerdown', (pointer) => {
    if (this.playerDead || this.snake.length === 0) return;

    const head = this.snake[0];
    const dx = pointer.worldX - head.x;
    const dy = pointer.worldY - head.y;

    let newDir = this.snakeDir;
    if (Math.abs(dx) > Math.abs(dy)) {
      newDir = dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
      newDir = dy > 0 ? 'DOWN' : 'UP';
    }

    const opposites = {
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
      UP: 'DOWN',
      DOWN: 'UP'
    };

    if (newDir !== opposites[this.snakeDir]) {
      this.snakeDir = newDir;
    }
  });
}


  moveSnake() {
    const head = this.snake[0];
    let newX = head.x;
    let newY = head.y;

    // 1. Step forward
    switch (this.snakeDir) {
      case 'RIGHT': newX += this.tileSize; break;
      case 'LEFT':  newX -= this.tileSize; break;
      case 'DOWN':  newY += this.tileSize; break;
      case 'UP':    newY -= this.tileSize; break;
    }

    newX = Phaser.Math.Snap.To(newX, this.tileSize);
    newY = Phaser.Math.Snap.To(newY, this.tileSize);

    const previousZone = { x: this.currentZoneX, y: this.currentZoneY };
    let tentativeZone = this.getZoneFromPosition(newX, newY);
    let crossedZone = false;

    // 2. Adjust newX/newY for entering new zone from edge
    if (tentativeZone.x !== previousZone.x) {
      crossedZone = true;
      newX = tentativeZone.x > previousZone.x
        ? tentativeZone.x * this.zoneWidth                     // entered from left
        : (tentativeZone.x + 1) * this.zoneWidth - this.tileSize; // entered from right
    }

    if (tentativeZone.y !== previousZone.y) {
      crossedZone = true;
      newY = tentativeZone.y > previousZone.y
        ? tentativeZone.y * this.zoneHeight                    // entered from top
        : (tentativeZone.y + 1) * this.zoneHeight - this.tileSize; // entered from bottom
    }

    // 3. Now re-calculate the actual final zone after position correction
    const finalZone = this.getZoneFromPosition(newX, newY);
    const newHead = this.physics.add.image(newX, newY, 'dot');
    this.snake.unshift(newHead);

    // 4. Camera update — after zone correction
    if (finalZone.x !== this.currentZoneX || finalZone.y !== this.currentZoneY) {
      this.currentZoneX = finalZone.x;
      this.currentZoneY = finalZone.y;
      this.snapCameraToZone(finalZone.x, finalZone.y);
      this.onZoneEntered(finalZone.x, finalZone.y);
    }

    // 5. Check self-collision (including tail in other zones)
    for (let i = 1; i < this.snake.length; i++) {
      const part = this.snake[i];
      if (Phaser.Math.Distance.Between(newX, newY, part.x, part.y) < 1) {
        this.playerDead = true;
        this.snake.forEach(part => part.destroy());
        this.snake = [];
        return;
      }
    }

    // 5b. Check collision with AI snakes
      for (const ai of this.aiSnakes) {
        for (const part of ai.body) {
          if (Phaser.Math.Distance.Between(newX, newY, part.x, part.y) < 1) {
            this.playerDead = true;
            this.snake.forEach(part => part.destroy());
            this.snake = [];
            return;
          }
        }
      }

    // 6. Apple check
    const key = `${finalZone.x},${finalZone.y}`;
    const apples = this.apples.get(key);
    let ate = false;

    if (apples) {
      for (let i = 0; i < apples.length; i++) {
        const apple = apples[i];
        if (Phaser.Math.Distance.Between(newX, newY, apple.x, apple.y) < 24) {
          apple.destroy();
          apples.splice(i, 1); // remove from array
          ate = true;

          // optionally respawn another apple immediately:
          this.spawnAppleInZone(finalZone.x, finalZone.y);
          break;
        }
      }
    }

    if (!ate) {
      this.snake.pop().destroy();
    }
  }

  onZoneEntered(zoneX, zoneY) {
    console.log(`Entered zone ${zoneX}, ${zoneY}`);
    this.zoneLabel.setText(`Zone ${zoneX}, ${zoneY}`);
    this.zoneLabel.setPosition(this.cameras.main.centerX, this.cameras.main.centerY);
    this.zoneLabel.setVisible(true);
    this.time.delayedCall(1000, () => this.zoneLabel.setVisible(false));
    this.spawnAppleInZone(zoneX, zoneY);
  }
  update(time, delta) {
    // ✅ AI should update every frame
    this.aiSnakes.forEach(ai => ai.update(delta));

    // ✅ Only move the player snake on its timer
    this.moveTimer += delta;
    if (this.moveTimer >= this.moveDelay) {
      this.moveTimer = 0;

      if (!this.playerDead) {
        this.moveSnake();
      }
    }

    if (this.playerDead && !this.winnerDeclared) {
      if (!this.spectatorTarget || this.spectatorTarget.dead || this.spectatorTarget.body.length === 0) {
        // Pick a new valid AI to spectate
        this.spectatorTarget = this.aiSnakes.find(ai => !ai.dead && ai.body.length > 0);
      }

      if (this.spectatorTarget) {
        const lead = this.spectatorTarget.body[0];
        if (lead) {
          this.cameras.main.centerOn(lead.x, lead.y);
        }
      }
    }

    const liveAISnakes = this.aiSnakes.filter(ai => !ai.dead);
    const liveCount = 1 + liveAISnakes.length; // include player
    this.snakeCounterText.setText(`Snakes Alive: ${liveCount}`);
    this.spectatorTarget = null;
  }
}
