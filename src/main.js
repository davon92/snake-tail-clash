import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 800,
  backgroundColor: '#1a1a1a',
  parent: 'app', // This links to a <div id="app"> in index.html
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [GameScene]
};

new Phaser.Game(config);