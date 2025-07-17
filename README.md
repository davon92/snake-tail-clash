# snake-tail-clash

# 🐍 Tail Clash – Snake With a Twist

A Phaser.js mini-game built for a take-home coding test. Inspired by the classic Snake and Tron Light Cycles.

## 🎮 Concept

Tail Clash is a competitive snake game where:
- You grow your tail by collecting apples.
- Enemy snakes roam the board with the same goal.
- Touching any tail (yours or theirs) means instant death.
- The goal: outlast the competition using quick thinking and strategic movement.

---

## 📱 Mobile Design

- Optimized for mobile-first gameplay.
- Uses **swipe controls** for direction changes.
- Designed for Telegram Mini App constraints (touch-first, keyboard-optional, vertical screen).

---

## 🚀 Task List

### ✅ MVP Features

- [x] Initialize Phaser with Vite
- [x] Basic Snake movement (player)
- [x] Apple spawning + tail growth
- [x] Game over logic (self collision)
- [x] Restart on game over
- [x] Responsive mobile layout
- [x] tap controls for mobile

### 🔄 In Progress

- [X] Add basic AI-controlled snakes
- [X] Implement AI apple-chasing logic
- [ ] Tail collision kills enemy snakes
- [X] Tail collision kills player snake

### 🧠 Stretch Goals

- [ ] Powerups (e.g., speed boost, tail cutter)
- [ ] Tail animations or glow effect
- [ ] Multiple enemy snakes spawning over time
- [ ] Sound effects & background music
- [ ] Time attack or survival mode
- [ ] Win condition: last snake standing

---

## 💻 How to Run Locally

```bash
npm install
npm run dev
