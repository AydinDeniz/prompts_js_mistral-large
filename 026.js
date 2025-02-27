// Server-side (Node.js with WebSocket)
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

mongoose.connect('mongodb://localhost:27017/gamedb', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: String,
  score: Number
});

const User = mongoose.model('User', userSchema);

wss.on('connection', ws => {
  ws.on('message', message => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'join':
        handleJoin(ws, data.username);
        break;
      case 'move':
        handleMove(ws, data.position);
        break;
      case 'score':
        handleScore(ws, data.score);
        break;
    }
  });
});

function handleJoin(ws, username) {
  ws.username = username;
  broadcast({ type: 'join', username });
}

function handleMove(ws, position) {
  broadcast({ type: 'move', username: ws.username, position });
}

function handleScore(ws, score) {
  User.findOneAndUpdate({ username: ws.username }, { $inc: { score } }, { upsert: true, new: true }, (err, user) => {
    if (err) return console.error(err);
    broadcast({ type: 'score', username: ws.username, score: user.score });
  });
}

function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// Client-side (JavaScript with PixiJS)
const socket = new WebSocket('ws://localhost:3000');

const app = new PIXI.Application({ width: 800, height: 600 });
document.body.appendChild(app.view);

let player;

socket.addEventListener('open', () => {
  socket.send(JSON.stringify({ type: 'join', username: 'Player1' }));
});

socket.addEventListener('message', event => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'join':
      addPlayer(data.username);
      break;
    case 'move':
      movePlayer(data.username, data.position);
      break;
    case 'score':
      updateScore(data.username, data.score);
      break;
  }
});

function addPlayer(username) {
  player = new PIXI.Graphics();
  player.beginFill(0xffffff);
  player.drawRect(0, 0, 50, 50);
  player.endFill();
  player.x = Math.random() * (app.renderer.width - 50);
  player.y = Math.random() * (app.renderer.height - 50);
  app.stage.addChild(player);
}

function movePlayer(username, position) {
  if (player && player.username === username) {
    player.x = position.x;
    player.y = position.y;
  }
}

function updateScore(username, score) {
  console.log(`${username}'s score: ${score}`);
}

app.ticker.add(delta => {
  if (player) {
    socket.send(JSON.stringify({ type: 'move', position: { x: player.x, y: player.y } }));
  }
});