import Phaser from 'phaser';

export default class AISnake {
  constructor(scene, x, y, id = 'AI') {
    this.scene = scene;
    this.tileSize = 16;
    this.id = id;
    this.body = [scene.physics.add.image(x, y, 'dot')];
    this.direction = Phaser.Math.RND.pick(['UP', 'DOWN', 'LEFT', 'RIGHT']);
    this.moveTimer = 0;
    this.moveDelay = this.scene.moveDelay;
    this.visitedZones = new Set();
    this.stuckTime = 0;
    this.lastAppleDist = null;
    this.exploring = false;
    this.exploreCooldown = 0;
  }

  update(delta) {
    if (this.dead) return;

    this.moveTimer += delta;
    this.exploreCooldown -= delta;
    if (this.moveTimer < this.moveDelay) return;
    this.moveTimer = 0;

    this.pickDirection();
    this.move();
  }

  pickDirection() {
    const head = this.body[0];
    const headX = head.x;
    const headY = head.y;

    const closestAppleDist = this.distanceToClosestApple(headX, headY);
    const improving = this.lastAppleDist === null || closestAppleDist < this.lastAppleDist;
    this.lastAppleDist = closestAppleDist;

    if (!improving) {
      this.stuckTime++;
    } else {
      this.stuckTime = 0;
    }

    if (this.stuckTime > 5) {
      this.exploring = true;
      this.stuckTime = 0;
      this.exploreCooldown = 3000; // 3 seconds
    }

    if (this.exploreCooldown <= 0) {
      this.exploring = false;
    }

    const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    const validMoves = [];

    for (const dir of directions) {
      const offset = this.getOffset(dir);
      const tx = Phaser.Math.Snap.To(headX + offset.x, this.tileSize);
      const ty = Phaser.Math.Snap.To(headY + offset.y, this.tileSize);

      if (!this.isOccupied(tx, ty)) {
        const zone = this.scene.getZoneFromPosition(tx, ty);
        const key = `${zone.x},${zone.y}`;
        const apples = this.scene.apples.get(key) || [];

        let score = 0;

        // 🍏 Apple desirability
        score += apples.length * 10;

        // 🧠 Avoid crowded zones (too risky)
        if (this.isZoneCrowded(key)) {
          score -= 20;
        }

        // 🧭 Prefer new zones
        if (!this.visitedZones.has(key)) {
          score += 5;
        }

        // 🔀 If exploring, deprioritize apples
        if (this.exploring) {
          score += Phaser.Math.Between(0, 10);
        } else {
          const dist = this.distanceToClosestApple(tx, ty);
          score += (dist > 0 ? 1000 / dist : 0);
        }

        // ⚔️ Chance to try to trap player or other snakes
        if (!this.exploring && Phaser.Math.Between(0, 20) === 0) {
          score += this.trapOpportunityScore(tx, ty);
        }

        validMoves.push({ dir, score });
      }
    }

    if (validMoves.length === 0) return;

    validMoves.sort((a, b) => b.score - a.score);
    const topScore = validMoves[0].score;
    const bestOptions = validMoves.filter(m => m.score === topScore);
    this.direction = Phaser.Utils.Array.GetRandom(bestOptions).dir;
  }

  trapOpportunityScore(x, y) {
    let score = 0;

    const playerHead = this.scene.snake?.[0];
    if (playerHead && Phaser.Math.Distance.Between(x, y, playerHead.x, playerHead.y) < 48) {
      score += 20;
    }

    for (const ai of this.scene.aiSnakes) {
      if (ai.id !== this.id && ai.body.length > 0) {
        const otherHead = ai.body[0];
        if (Phaser.Math.Distance.Between(x, y, otherHead.x, otherHead.y) < 48) {
          score += 10;
        }
      }
    }

    return score;
  }

  getOffset(direction) {
    switch (direction) {
      case 'UP': return { x: 0, y: -this.tileSize };
      case 'DOWN': return { x: 0, y: this.tileSize };
      case 'LEFT': return { x: -this.tileSize, y: 0 };
      case 'RIGHT': return { x: this.tileSize, y: 0 };
    }
  }

  isOccupied(x, y) {
    const threshold = 1;
    const check = (segments) => {
      return segments.some(seg => Phaser.Math.Distance.Between(x, y, seg.x, seg.y) < threshold);
    };

    if (check(this.scene.snake)) return true;

    for (const ai of this.scene.aiSnakes) {
      if (ai.id !== this.id && check(ai.body)) return true;
    }

    return check(this.body.slice(1));
  }

  isZoneCrowded(key) {
    let count = 0;
    for (const ai of this.scene.aiSnakes) {
      if (ai.id !== this.id) {
        const head = ai.body[0];
        if (head) {
          const zone = this.scene.getZoneFromPosition(head.x, head.y);
          if (`${zone.x},${zone.y}` === key) {
            count++;
          }
        }
      }
    }
    return count > 3;
  }

  distanceToClosestApple(x, y) {
    let closest = Infinity;
    for (const apples of this.scene.apples.values()) {
      for (const apple of apples) {
        const d = Phaser.Math.Distance.Between(x, y, apple.x, apple.y);
        if (d < closest) closest = d;
      }
    }
    return closest;
  }

  move() {
    const head = this.body[0];
    let newX = head.x;
    let newY = head.y;

    switch (this.direction) {
      case 'RIGHT': newX += this.tileSize; break;
      case 'LEFT':  newX -= this.tileSize; break;
      case 'DOWN':  newY += this.tileSize; break;
      case 'UP':    newY -= this.tileSize; break;
    }

    newX = Phaser.Math.Snap.To(newX, this.tileSize);
    newY = Phaser.Math.Snap.To(newY, this.tileSize);

    if (this.isOccupied(newX, newY)) {
      this.die();
      return;
    }

    const prevZone = this.scene.getZoneFromPosition(head.x, head.y);
    const nextZone = this.scene.getZoneFromPosition(newX, newY);

    if (nextZone.x !== prevZone.x) {
      newX = nextZone.x > prevZone.x
        ? nextZone.x * this.scene.zoneWidth
        : (nextZone.x + 1) * this.scene.zoneWidth - this.tileSize;
    }

    if (nextZone.y !== prevZone.y) {
      newY = nextZone.y > prevZone.y
        ? nextZone.y * this.scene.zoneHeight
        : (nextZone.y + 1) * this.scene.zoneHeight - this.tileSize;
    }

    const finalZone = this.scene.getZoneFromPosition(newX, newY);
    this.visitedZones.add(`${finalZone.x},${finalZone.y}`);

    const newHead = this.scene.physics.add.image(newX, newY, 'dot');
    this.body.unshift(newHead);

    const key = `${finalZone.x},${finalZone.y}`;
    const apples = this.scene.apples.get(key);
    let ate = false;

    if (apples) {
      for (let i = 0; i < apples.length; i++) {
        const apple = apples[i];
        if (Phaser.Math.Distance.Between(newX, newY, apple.x, apple.y) < 24) {
          apple.destroy();
          apples.splice(i, 1);
          ate = true;
          this.scene.spawnAppleInZone(finalZone.x, finalZone.y);
          break;
        }
      }
    }

    if (!ate) {
      this.body.pop().destroy();
    }
  }

  die() {
    this.body.forEach(segment => segment.destroy());
    this.body = [];
    this.dead = true;
  }
}
