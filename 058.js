// 2D Game Development

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import http from 'http';

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Game state
let gameState = {
  player: { x: 50, y: 50, score: 0 },
  enemies: [],
  level: 1,
};

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('movePlayer', (direction) => {
    movePlayer(direction);
    io.emit('gameState', gameState);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Function to move the player
function movePlayer(direction) {
  switch (direction) {
    case 'up':
      gameState.player.y -= 10;
      break;
    case 'down':
      gameState.player.y += 10;
      break;
    case 'left':
      gameState.player.x -= 10;
      break;
    case 'right':
      gameState.player.x += 10;
      break;
  }
}

// Function to update the game state
function updateGameState() {
  // Update enemies, check for collisions, etc.
  gameState.enemies.forEach((enemy) => {
    // Move enemies
    enemy.x += enemy.vx;
    enemy.y += enemy.vy;

    // Check for collisions with the player
    if (
      gameState.player.x < enemy.x + 20 &&
      gameState.player.x + 20 > enemy.x &&
      gameState.player.y < enemy.y + 20 &&
      gameState.player.y + 20 > enemy.y
    ) {
      gameState.player.score += 10;
      gameState.enemies = gameState.enemies.filter((e) => e !== enemy);
    }
  });

  // Update level if all enemies are defeated
  if (gameState.enemies.length === 0) {
    gameState.level += 1;
    gameState.enemies = generateEnemies(gameState.level);
  }

  io.emit('gameState', gameState);
}

// Function to generate enemies
function generateEnemies(level) {
  const enemies = [];
  for (let i = 0; i < level * 2; i++) {
    enemies.push({
      x: Math.random() * 400,
      y: Math.random() * 400,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 2 - 1,
    });
  }
  return enemies;
}

// Start the game loop
setInterval(updateGameState, 1000 / 60);

// API routes
app.get('/api/gameState', (req, res) => {
  res.status(200).json(gameState);
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example frontend code using React
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

function App() {
  const [gameState, setGameState] = useState({ player: { x: 0, y: 0, score: 0 }, enemies: [], level: 1 });
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('gameState', (state) => {
      setGameState(state);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleMovePlayer = (direction) => {
    socket.emit('movePlayer', direction);
  };

  return (
    <div>
      <h1>2D Game Development</h1>
      <canvas id="gameCanvas" width="500" height="500" style={{ border: '1px solid black' }}></canvas>
      <div>
        <button onClick={() => handleMovePlayer('up')}>Up</button>
        <button onClick={() => handleMovePlayer('down')}>Down</button>
        <button onClick={() => handleMovePlayer('left')}>Left</button>
        <button onClick={() => handleMovePlayer('right')}>Right</button>
      </div>
      <div>
        <p>Score: {gameState.player.score}</p>
        <p>Level: {gameState.level}</p>
      </div>
    </div>
  );
}

// Game rendering logic
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw player
  ctx.fillStyle = 'blue';
  ctx.fillRect(gameState.player.x, gameState.player.y, 20, 20);

  // Draw enemies
  ctx.fillStyle = 'red';
  gameState.enemies.forEach((enemy) => {
    ctx.fillRect(enemy.x, enemy.y, 20, 20);
  });

  requestAnimationFrame(drawGame);
}

drawGame();

export default App;