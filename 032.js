// Voice-Controlled Smart Home Assistant

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Initialize WebSocket server for real-time updates
const wss = new WebSocketServer({ noServer: true });

// Function to send real-time updates to clients
function sendUpdate(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// API routes
app.post('/api/controlDevice', (req, res) => {
  const { deviceId, command } = req.body;
  // Simulate device control (replace with actual device control logic)
  console.log(`Controlling device ${deviceId} with command ${command}`);
  sendUpdate({ deviceId, command, status: 'executed' });
  res.status(200).json({ message: 'Command executed' });
});

// WebSocket server setup
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log('Received message:', message);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Upgrade HTTP server to handle WebSocket connections
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Example frontend code using React
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [devices, setDevices] = useState([]);
  const [command, setCommand] = useState('');
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // Connect to WebSocket server for real-time updates
    const socket = new WebSocket('ws://localhost:3000');
    setWs(socket);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Real-time update:', data);
      // Update device status in the UI
      setDevices((prevDevices) =>
        prevDevices.map((device) =>
          device.id === data.deviceId ? { ...device, status: data.status } : device
        )
      );
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleControlDevice = async (deviceId) => {
    await axios.post('/api/controlDevice', { deviceId, command });
  };

  return (
    <div>
      <h1>Voice-Controlled Smart Home Assistant</h1>
      <input
        type="text"
        placeholder="Enter command"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
      />
      <ul>
        {devices.map((device) => (
          <li key={device.id}>
            {device.name} - {device.status}
            <button onClick={() => handleControlDevice(device.id)}>Execute Command</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;