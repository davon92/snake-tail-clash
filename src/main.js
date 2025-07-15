import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'
import Phaser from 'phaser';

const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 800,
  backgroundColor: '#1a1a1a',
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: {
    preload,
    create,
    update,
  }
};

let snake = [];
let direction = 'RIGHT';
let apple;

function preload() {
  this.load.image('dot', 'https://labs.phaser.io/assets/sprites/dot.png');
  this.load.image('apple', 'https://labs.phaser.io/assets/sprites/apple.png');
}

function create() {
  snake = [this.add.image(240, 400, 'dot')];
  apple = this.add.image(Phaser.Math.Between(0, 480), Phaser.Math.Between(0, 800), 'apple');
  this.input.on('pointerdown', () => {
    // Add swipe or tap logic later
  });
}

function update() {
  // Will add movement logic here
}

new Phaser.Game(config);

document.querySelector('#app').innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
      <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
    </a>
    <h1>Hello Vite!</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite logo to learn more
    </p>
  </div>
`

setupCounter(document.querySelector('#counter'))
