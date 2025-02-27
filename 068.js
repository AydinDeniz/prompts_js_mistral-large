// Home Automation Dashboard with IoT Integration

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import http from 'http';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory data store for IoT devices and their states
const devices = {};

// Function to control IoT devices
async function controlDevice(deviceId, action) {
  // Replace with actual API call to control the device
  const response = await axios.post(`https://api.iotplatform.com/control`, {
    deviceId,
    action,
  });
  return response.data;
}

// Function to track energy consumption
async function trackEnergyConsumption(deviceId) {
  // Replace with actual API call to get energy consumption data
  const response = await axios.get(`https://api.iotplatform.com/energy/${deviceId}`);
  return response.data;
}

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('controlDevice', async ({ deviceId, action }) => {
    const result = await controlDevice(deviceId, action);
    socket.emit('deviceControlled', { deviceId, result });
  });

  socket.on('trackEnergy', async ({ deviceId }) => {
    const data = await trackEnergyConsumption(deviceId);
    socket.emit('energyData', { deviceId, data });
  });

  socket.on('setAutomation', ({ deviceId, condition, action }) => {
    if (!devices[deviceId]) {
      devices[deviceId] = { condition, action };
    }
    socket.emit('automationSet', { deviceId, condition, action });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/controlDevice', async (req, res) => {
  const { deviceId, action } = req.body;
  const result = await controlDevice(deviceId, action);
  res.status(200).json(result);
});

app.get('/api/trackEnergy/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  const data = await trackEnergyConsumption(deviceId);
  res.status(200).json(data);
});

app.post('/api/setAutomation', (req, res) => {
  const { deviceId, condition, action } = req.body;
  devices[deviceId] = { condition, action };
  res.status(200).json({ message: 'Automation set successfully' });
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
  const [devices, setDevices] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('deviceControlled', ({ deviceId, result }) => {
      setDevices((prevDevices) =>
        prevDevices.map((device) => (device.id === deviceId ? { ...device, result } : device))
      );
    });

    newSocket.on('energyData', ({ deviceId, data }) => {
      setDevices((prevDevices) =>
        prevDevices.map((device) => (device.id === deviceId ? { ...device, energyData: data } : device))
      );
    });

    newSocket.on('automationSet', ({ deviceId, condition, action }) => {
      setDevices((prevDevices) =>
        prevDevices.map((device) => (device.id === deviceId ? { ...device, condition, action } : device))
      );
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleControlDevice = async (deviceId, action) => {
    await axios.post('/api/controlDevice', { deviceId, action });
  };

  const handleTrackEnergy = async (deviceId) => {
    await axios.get(`/api/trackEnergy/${deviceId}`);
  };

  const handleSetAutomation = async (deviceId, condition, action) => {
    await axios.post('/api/setAutomation', { deviceId, condition, action });
  };

  return (
    <div>
      <h1>Home Automation Dashboard with IoT Integration</h1>
      <div>
        <h2>Devices</h2>
        <ul>
          {devices.map((device) => (
            <li key={device.id}>
              <h3>{device.name}</h3>
              <p>Status: {device.status}</p>
              <button onClick={() => handleControlDevice(device.id, 'on')}>Turn On</button>
              <button onClick={() => handleControlDevice(device.id, 'off')}>Turn Off</button>
              <button onClick={() => handleTrackEnergy(device.id)}>Track Energy</button>
              <button onClick={() => handleSetAutomation(device.id, 'condition', 'action')}>Set Automation</button>
              {device.energyData && (
                <div>
                  <h4>Energy Data</h4>
                  <p>Consumption: {device.energyData.consumption} kWh</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;