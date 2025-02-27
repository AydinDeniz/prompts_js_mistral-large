// Robotics Control System

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import five from 'johnny-five';
import { Server } from 'socket.io';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize Johnny-Five board
const board = new five.Board();

// Define robot actions and behaviors
let robotActions = [];

// Function to execute robot actions
function executeActions(robot) {
  robotActions.forEach((action) => {
    switch (action.type) {
      case 'move':
        robot.motor(action.motor).forward(action.speed);
        setTimeout(() => {
          robot.motor(action.motor).stop();
        }, action.duration);
        break;
      case 'turn':
        robot.servo(action.servo).to(action.angle);
        break;
      case 'light':
        robot.led(action.led).on();
        setTimeout(() => {
          robot.led(action.led).off();
        }, action.duration);
        break;
      default:
        break;
    }
  });
}

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('defineAction', (action) => {
    robotActions.push(action);
    console.log('Action defined:', action);
  });

  socket.on('executeActions', () => {
    board.on('ready', () => {
      const robot = {
        motor: (motor) => new five.Motor(motor),
        servo: (servo) => new five.Servo(servo),
        led: (led) => new five.Led(led),
      };
      executeActions(robot);
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/defineAction', (req, res) => {
  const { type, motor, speed, duration, servo, angle, led } = req.body;
  const action = { type, motor, speed, duration, servo, angle, led };
  robotActions.push(action);
  res.status(200).json({ message: 'Action defined successfully' });
});

app.post('/api/executeActions', (req, res) => {
  board.on('ready', () => {
    const robot = {
      motor: (motor) => new five.Motor(motor),
      servo: (servo) => new five.Servo(servo),
      led: (led) => new five.Led(led),
    };
    executeActions(robot);
    res.status(200).json({ message: 'Actions executed successfully' });
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example frontend code using React
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

function App() {
  const [actions, setActions] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleDefineAction = (action) => {
    setActions((prevActions) => [...prevActions, action]);
    socket.emit('defineAction', action);
  };

  const handleExecuteActions = () => {
    socket.emit('executeActions');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const action = Object.fromEntries(formData.entries());
    await axios.post('/api/defineAction', action);
    handleDefineAction(action);
  };

  return (
    <div>
      <h1>Robotics Control System</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Action Type:
          <select name="type">
            <option value="move">Move</option>
            <option value="turn">Turn</option>
            <option value="light">Light</option>
          </select>
        </label>
        <label>
          Motor:
          <input type="text" name="motor" />
        </label>
        <label>
          Speed:
          <input type="number" name="speed" />
        </label>
        <label>
          Duration:
          <input type="number" name="duration" />
        </label>
        <label>
          Servo:
          <input type="text" name="servo" />
        </label>
        <label>
          Angle:
          <input type="number" name="angle" />
        </label>
        <label>
          LED:
          <input type="text" name="led" />
        </label>
        <button type="submit">Define Action</button>
      </form>
      <button onClick={handleExecuteActions}>Execute Actions</button>
      <div>
        <h2>Defined Actions</h2>
        <ul>
          {actions.map((action, index) => (
            <li key={index}>
              {action.type}: {JSON.stringify(action)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;